import json
import logging
from pathlib import Path
from uuid import uuid4

import networkx as nx
import numpy as np
import pandas as pd
import torch
import xgboost as xgb
from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score
from torch import nn
from torch_geometric.nn import SAGEConv

from .elliptic_graph import EllipticTopologyEngine

LOGGER = logging.getLogger(__name__)
FEATURE_COLUMNS = [f"feat_{index}" for index in range(2, 167)]
EMBEDDING_COLUMNS = [f"gsage_{index}" for index in range(128)]
STRUCTURAL_COLUMNS = ["core_number", "wcc_size", "community_size"]
MODEL_FEATURE_COLUMNS = FEATURE_COLUMNS + STRUCTURAL_COLUMNS + EMBEDDING_COLUMNS
REQUIRED_ARTIFACTS = (
    "graphsage.pt",
    "pcc_xgb_model.json",
    "elliptic_embeddings.csv",
    "metrics.json",
)


class ArtifactError(RuntimeError):
    """Raised when a configured model artifact is missing or incompatible."""


class BatchValidationError(ValueError):
    """Raised when uploaded graph data cannot be safely evaluated."""


class GraphSAGE(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = SAGEConv(165, 128)
        self.conv2 = SAGEConv(128, 128)
        self.classifier = nn.Linear(128, 2)

    def forward(self, x, edge_index):
        hidden = torch.relu(self.conv1(x, edge_index))
        hidden = torch.relu(self.conv2(hidden, edge_index))
        return self.classifier(hidden), hidden


class EllipticModelManager:
    def __init__(self, base_path):
        self.base_path = Path(base_path)
        self.embeddings = None
        self.xgb_model = None
        self.metrics = None
        self.graphsage_model = None
        self.artifact_error = None
        self.batches = {}

    @property
    def is_ready(self):
        return all(
            artifact is not None
            for artifact in (
                self.embeddings,
                self.xgb_model,
                self.metrics,
                self.graphsage_model,
            )
        )

    def load_artifacts(self):
        missing = [
            name for name in REQUIRED_ARTIFACTS
            if not (self.base_path / name).is_file()
        ]
        if missing:
            raise ArtifactError(
                f"Missing required ECG model artifacts in {self.base_path}: "
                + ", ".join(missing)
            )

        with (self.base_path / "metrics.json").open(encoding="utf-8") as metrics_file:
            metrics = json.load(metrics_file)
        required_metrics = {
            "test_precision",
            "test_recall",
            "test_f1",
            "test_roc_auc",
        }
        if not isinstance(metrics, dict) or not required_metrics.issubset(metrics):
            raise ArtifactError(
                "metrics.json must contain test_precision, test_recall, "
                "test_f1, and test_roc_auc."
            )
        for name in required_metrics:
            try:
                value = float(metrics[name])
            except (TypeError, ValueError) as error:
                raise ArtifactError(f"Metric {name} must be numeric.") from error
            if not np.isfinite(value):
                raise ArtifactError(f"Metric {name} must be finite.")
            metrics[name] = value

        embeddings = pd.read_csv(
            self.base_path / "elliptic_embeddings.csv",
            dtype={"txId": "string"},
        )
        missing_embedding_columns = [
            column
            for column in ["txId", *EMBEDDING_COLUMNS]
            if column not in embeddings.columns
        ]
        if missing_embedding_columns:
            raise ArtifactError(
                "elliptic_embeddings.csv is missing columns: "
                + ", ".join(missing_embedding_columns[:8])
            )
        if embeddings["txId"].isna().any() or embeddings["txId"].duplicated().any():
            raise ArtifactError(
                "elliptic_embeddings.csv must have unique, non-empty txId values."
            )
        embeddings = embeddings.set_index("txId")[EMBEDDING_COLUMNS]
        if not np.isfinite(embeddings.to_numpy(dtype=np.float32)).all():
            raise ArtifactError("elliptic_embeddings.csv contains non-finite values.")

        booster = xgb.Booster()
        booster.load_model(str(self.base_path / "pcc_xgb_model.json"))
        if booster.num_features() != len(MODEL_FEATURE_COLUMNS):
            raise ArtifactError(
                f"XGBoost expects {booster.num_features()} features; "
                f"the notebook pipeline requires {len(MODEL_FEATURE_COLUMNS)}."
            )
        if booster.feature_names and booster.feature_names != MODEL_FEATURE_COLUMNS:
            raise ArtifactError(
                "XGBoost feature names do not match the notebook's expected "
                "296-column feature order."
            )

        try:
            checkpoint = torch.load(
                self.base_path / "graphsage.pt",
                map_location="cpu",
                weights_only=True,
            )
        except (OSError, RuntimeError, ValueError) as error:
            raise ArtifactError(f"Could not read graphsage.pt: {error}") from error
        if not isinstance(checkpoint, dict) or not checkpoint:
            raise ArtifactError(
                "graphsage.pt must contain the GraphSAGE state_dict exported by the notebook."
            )
        model = GraphSAGE()
        try:
            model.load_state_dict(checkpoint, strict=True)
        except RuntimeError as error:
            raise ArtifactError(
                "graphsage.pt is incompatible with the notebook's two-layer "
                f"165→128 GraphSAGE architecture: {error}"
            ) from error
        model.eval()

        self.metrics = metrics
        self.embeddings = embeddings
        self.xgb_model = booster
        self.graphsage_model = model
        self.artifact_error = None
        LOGGER.info(
            "Loaded ECG artifacts from %s (%d indexed embeddings).",
            self.base_path,
            len(embeddings),
        )

    def _require_ready(self):
        if not self.is_ready:
            message = self.artifact_error or (
                f"ECG model artifacts are not loaded from {self.base_path}."
            )
            raise ArtifactError(message)

    @staticmethod
    def _validate_batch(nodes_df, edges_df):
        if "txId" not in nodes_df.columns:
            raise BatchValidationError("Nodes CSV must contain a txId column.")
        if nodes_df.empty:
            raise BatchValidationError("Nodes CSV must contain at least one row.")
        if nodes_df["txId"].isna().any():
            raise BatchValidationError("Nodes CSV contains an empty txId.")
        nodes_df["txId"] = nodes_df["txId"].astype("string").str.strip()
        if nodes_df["txId"].eq("").any():
            raise BatchValidationError("Nodes CSV contains an empty txId.")
        if nodes_df["txId"].duplicated().any():
            duplicate = nodes_df.loc[nodes_df["txId"].duplicated(), "txId"].iloc[0]
            raise BatchValidationError(f"Nodes CSV contains duplicate txId {duplicate}.")

        missing_features = [
            column for column in FEATURE_COLUMNS if column not in nodes_df.columns
        ]
        if missing_features:
            raise BatchValidationError(
                "Nodes CSV is missing required model features: "
                + ", ".join(missing_features[:8])
            )
        try:
            features = nodes_df[FEATURE_COLUMNS].apply(pd.to_numeric, errors="raise")
        except (TypeError, ValueError) as error:
            raise BatchValidationError(
                "All 165 feature columns (feat_2 through feat_166) must be numeric."
            ) from error
        if features.isna().any().any() or not np.isfinite(features.to_numpy()).all():
            raise BatchValidationError(
                "Feature columns must not contain missing or non-finite values."
            )

        required_edge_columns = {"txId1", "txId2"}
        missing_edge_columns = required_edge_columns.difference(edges_df.columns)
        if missing_edge_columns:
            raise BatchValidationError(
                "Edges CSV must contain txId1 and txId2 columns."
            )
        if edges_df.empty:
            edges_df = pd.DataFrame(columns=["txId1", "txId2"])
        else:
            edges_df["txId1"] = edges_df["txId1"].astype("string").str.strip()
            edges_df["txId2"] = edges_df["txId2"].astype("string").str.strip()
            if edges_df[["txId1", "txId2"]].isna().any().any() or (
                edges_df[["txId1", "txId2"]].eq("").any().any()
            ):
                raise BatchValidationError("Edges CSV contains an empty endpoint.")
            if edges_df.duplicated(subset=["txId1", "txId2"]).any():
                raise BatchValidationError("Edges CSV contains duplicate directed edges.")
            node_ids = set(nodes_df["txId"])
            invalid = ~edges_df["txId1"].isin(node_ids) | ~edges_df["txId2"].isin(node_ids)
            if invalid.any():
                row = edges_df.loc[invalid].iloc[0]
                raise BatchValidationError(
                    f"Edge endpoint is missing from Nodes CSV: "
                    f"{row['txId1']} -> {row['txId2']}."
                )
        return nodes_df, edges_df, features.astype(np.float32)

    @staticmethod
    def _evaluate(nodes_df, predictions):
        if "class" not in nodes_df.columns:
            return {"status": "unavailable", "reason": "Ground-truth class labels were not supplied."}

        normalized = nodes_df["class"].astype("string").str.strip().str.lower()
        label_map = {"1": 1, "2": 0, "unknown": 3, "3": 3}
        labels = normalized.map(label_map)
        invalid = normalized.notna() & labels.isna()
        if invalid.any():
            values = ", ".join(sorted(normalized[invalid].unique().tolist())[:5])
            raise BatchValidationError(
                f"Unsupported class labels: {values}. Expected 1 (illicit), "
                "2 (licit), or unknown/3."
            )
        known_mask = labels.isin([0, 1])
        if not known_mask.any():
            return {
                "status": "unavailable",
                "reason": "No known licit/illicit labels; unknown labels are excluded.",
                "known_label_count": 0,
                "unknown_label_count": int((labels == 3).sum()),
            }

        y_true = labels[known_mask].astype(int).to_numpy()
        known_predictions = np.asarray(predictions)[known_mask.to_numpy()]
        y_pred = (known_predictions >= 0.5).astype(int)
        roc_auc = (
            float(roc_auc_score(y_true, known_predictions))
            if len(np.unique(y_true)) == 2
            else None
        )
        return {
            "status": "available",
            "positive_class": "illicit (class 1)",
            "known_label_count": int(known_mask.sum()),
            "unknown_label_count": int((labels == 3).sum()),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, zero_division=0)),
            "roc_auc": roc_auc,
            "roc_auc_reason": (
                None
                if roc_auc is not None
                else "ROC AUC requires both licit and illicit ground-truth labels."
            ),
        }

    def analyze_batch(self, nodes_df, edges_df, batch_name="Uploaded batch"):
        self._require_ready()
        nodes_df, edges_df, features = self._validate_batch(nodes_df, edges_df)
        graph = EllipticTopologyEngine.build_and_analyze(
            edges_df,
            node_ids=nodes_df["txId"].tolist(),
        )

        edge_pairs = [
            (str(source), str(target))
            for source, target in edges_df[["txId1", "txId2"]].itertuples(
                index=False, name=None
            )
        ]
        node_ids = nodes_df["txId"].tolist()
        id_to_index = {tx_id: index for index, tx_id in enumerate(node_ids)}
        edge_index = (
            torch.tensor(
                [
                    [id_to_index[source] for source, _ in edge_pairs],
                    [id_to_index[target] for _, target in edge_pairs],
                ],
                dtype=torch.long,
            )
            if edge_pairs
            else torch.empty((2, 0), dtype=torch.long)
        )

        x = torch.from_numpy(features.to_numpy(dtype=np.float32, copy=True))
        with torch.inference_mode():
            _, embedding_tensor = self.graphsage_model(x, edge_index)
        embeddings = embedding_tensor.numpy()

        structural_rows = []
        node_payload = []
        for index, tx_id in enumerate(node_ids):
            structural = graph.nodes[tx_id]
            structural_rows.append(
                [
                    structural["core_number"],
                    structural["wcc_size"],
                    structural["community_size"],
                ]
            )
            node_payload.append(
                {
                    "id": tx_id,
                    "txId": tx_id,
                    "label": tx_id,
                    "type": "Transaction",
                    "core_number": structural["core_number"],
                    "wcc_size": structural["wcc_size"],
                    "community_id": structural["community_id"],
                    "community_size": structural["community_size"],
                    "timestep": (
                        str(nodes_df.iloc[index]["timestep"])
                        if "timestep" in nodes_df.columns
                        and pd.notna(nodes_df.iloc[index]["timestep"])
                        else None
                    ),
                    "ground_truth_label": self._display_label(
                        nodes_df.iloc[index].get("class")
                    ),
                }
            )

        model_features = np.concatenate(
            [
                features.to_numpy(dtype=np.float32, copy=False),
                np.asarray(structural_rows, dtype=np.float32),
                embeddings.astype(np.float32, copy=False),
            ],
            axis=1,
        )
        if model_features.shape[1] != len(MODEL_FEATURE_COLUMNS):
            raise ArtifactError(
                f"Generated {model_features.shape[1]} model features; expected "
                f"{len(MODEL_FEATURE_COLUMNS)}."
            )
        dmatrix = xgb.DMatrix(
            model_features,
            feature_names=(
                self.xgb_model.feature_names or MODEL_FEATURE_COLUMNS
            ),
        )
        scores = self.xgb_model.predict(dmatrix)
        predictions = np.asarray(scores, dtype=np.float64)
        if predictions.ndim != 1 or len(predictions) != len(node_ids):
            raise ArtifactError(
                "XGBoost returned an unexpected prediction shape; expected one risk "
                "score per transaction."
            )
        if not np.isfinite(predictions).all() or (
            (predictions < 0).any() or (predictions > 1).any()
        ):
            raise ArtifactError(
                "XGBoost output is not a finite probability score in [0, 1]."
            )

        for node, score in zip(node_payload, predictions):
            node["risk_score"] = float(score)
            node["predicted_class"] = int(score >= 0.5)

        evaluation = self._evaluate(nodes_df, predictions)
        result = {
            "batch_id": str(uuid4()),
            "batch_name": batch_name or "Uploaded batch",
            "model_target": "Elliptic transaction illicit-risk classification",
            "positive_class": "illicit (class 1)",
            "nodes": node_payload,
            "edges": [
                {
                    "source": source,
                    "target": target,
                    "type": "transaction_flow",
                }
                for source, target in edge_pairs
            ],
            "summary": self._summarize(nodes_df, graph, predictions, evaluation),
            "evaluation": evaluation,
            "capabilities": {
                "transaction_risk": "available",
                "common_control_pcc": {
                    "status": "not_configured",
                    "reason": (
                        "pcc_xgb_model.json was trained on Elliptic licit/illicit "
                        "transaction labels, not common-control labels."
                    ),
                },
                "financial_exposure": {
                    "status": "not_configured",
                    "reason": (
                        "The uploaded schema has no validated currency amount field."
                    ),
                },
                "embedding_source": (
                    "GraphSAGE embeddings recomputed for this uploaded graph; "
                    "precomputed embeddings are indexed but not reused because their "
                    "original graph context cannot be verified for this batch."
                ),
            },
        }
        self.batches[result["batch_id"]] = result
        while len(self.batches) > 10:
            self.batches.pop(next(iter(self.batches)))
        return result

    @staticmethod
    def _display_label(value):
        if pd.isna(value):
            return None
        normalized = str(value).strip().lower()
        return {
            "1": "illicit",
            "2": "licit",
            "3": "unknown",
            "unknown": "unknown",
        }.get(normalized, "unknown")

    @staticmethod
    def _summarize(nodes_df, graph, predictions, evaluation):
        undirected = graph.to_undirected()
        components = list(nx.connected_components(undirected))
        communities = {
            attrs["community_id"] for _, attrs in graph.nodes(data=True)
        }
        summary = {
            "node_count": graph.number_of_nodes(),
            "edge_count": graph.number_of_edges(),
            "predicted_illicit_count": int((predictions >= 0.5).sum()),
            "predicted_licit_count": int((predictions < 0.5).sum()),
            "mean_risk_score": float(np.mean(predictions)),
            "connected_component_count": len(components),
            "largest_component_size": max((len(component) for component in components), default=0),
            "community_count": len(communities),
            "mean_core_number": float(
                np.mean([attrs["core_number"] for _, attrs in graph.nodes(data=True)])
            ),
            "mean_wcc_size": float(
                np.mean([attrs["wcc_size"] for _, attrs in graph.nodes(data=True)])
            ),
            "two_hop_walk_count": int(
                sum(
                    graph.in_degree(node) * graph.out_degree(node)
                    for node in graph.nodes
                )
            ),
            "evaluation_status": evaluation["status"],
        }
        if "timestep" in nodes_df.columns:
            timesteps = nodes_df["timestep"].dropna().astype("string")
            counts = timesteps.value_counts().sort_index()
            summary["transactions_by_timestep"] = {
                str(timestep): int(count) for timestep, count in counts.items()
            }
            summary["max_timestep_share"] = (
                float(counts.max() / counts.sum()) if counts.sum() else None
            )
        else:
            summary["transactions_by_timestep"] = None
            summary["max_timestep_share"] = None
        return summary

    def get_batch(self, batch_id):
        self._require_ready()
        try:
            return self.batches[batch_id]
        except KeyError as error:
            raise KeyError(f"Batch {batch_id} was not found in recent server history.") from error
