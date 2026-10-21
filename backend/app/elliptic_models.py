import json
import pandas as pd
import numpy as np
import xgboost as xgb
import torch
from pathlib import Path

class EllipticModelManager:
    def __init__(self, base_path="results"):
        self.base_path = Path(base_path)
        self.embeddings = {}
        self.xgb_model = None
        self.metrics = None
        self.graphsage_model = None

    def load_artifacts(self):
        try:
            with open(self.base_path / "metrics.json", "r") as f:
                self.metrics = json.load(f)
        except FileNotFoundError:
            self.metrics = {}

        self.xgb_model = xgb.Booster()
        self.xgb_model.load_model(self.base_path / "pcc_xgb_model.json")

        try:
            emb_df = pd.read_csv(self.base_path / "elliptic_embeddings.csv")
            self.embeddings = emb_df.set_index('txId').T.to_dict('list')
        except FileNotFoundError:
            pass

        try:
            self.graphsage_model = torch.load(self.base_path / "graphsage" / "data.pkl", map_location='cpu')
            self.graphsage_model.eval()
        except Exception:
            pass

    def _get_embedding(self, tx_id):
        return self.embeddings.get(tx_id, [0.0] * 128)

    def predict_batch(self, nodes_df, graph):
        predictions = []
        for _, row in nodes_df.iterrows():
            tx_id = row.get('txId')
            
            # Base features (165 floats)
            base_feats = [row.get(f'feat_{i}', 0.0) for i in range(2, 167)]
            
            # Structural features (3 ints)
            core_number = graph.nodes[tx_id].get('core_number', 0) if tx_id in graph else 0
            wcc_size = graph.nodes[tx_id].get('wcc_size', 1) if tx_id in graph else 1
            community_size = graph.nodes[tx_id].get('community_size', 1) if tx_id in graph else 1
            
            # GraphSAGE embeddings (128 floats)
            gsage_feats = self._get_embedding(tx_id)
            
            # Combine to exact 296 dimensions
            feature_vector = base_feats + [core_number, wcc_size, community_size] + gsage_feats
            
            dmatrix = xgb.DMatrix(np.array([feature_vector]))
            score = float(self.xgb_model.predict(dmatrix)[0])
            
            predictions.append({
                "txId": tx_id,
                "risk_score": score,
                "predicted_class": 1 if score > 0.5 else 0
            })
        return predictions
