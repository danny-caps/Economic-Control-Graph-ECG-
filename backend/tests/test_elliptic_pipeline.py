import unittest

import numpy as np
import pandas as pd

from app.elliptic_models import (
    BatchValidationError,
    EllipticModelManager,
    FEATURE_COLUMNS,
)
from app.elliptic_graph import EllipticTopologyEngine


def make_nodes(ids, labels=None):
    data = {
        "txId": ids,
        **{column: np.zeros(len(ids), dtype=np.float32) for column in FEATURE_COLUMNS},
    }
    if labels is not None:
        data["class"] = labels
    return pd.DataFrame(data)


class EllipticBatchTests(unittest.TestCase):
    def test_validates_required_features_and_edge_endpoints(self):
        nodes = make_nodes(["a", "b"])
        edges = pd.DataFrame({"txId1": ["a"], "txId2": ["c"]})
        with self.assertRaisesRegex(BatchValidationError, "missing from Nodes CSV"):
            EllipticModelManager._validate_batch(nodes, edges)

    def test_rejects_duplicate_transaction_ids(self):
        nodes = make_nodes(["a", "a"])
        edges = pd.DataFrame(columns=["txId1", "txId2"])
        with self.assertRaisesRegex(BatchValidationError, "duplicate txId"):
            EllipticModelManager._validate_batch(nodes, edges)

    def test_excludes_unknown_labels_and_handles_single_class_auc(self):
        nodes = make_nodes(["a", "b", "c"], labels=[1, 3, 1])
        evaluation = EllipticModelManager._evaluate(nodes, np.array([0.8, 0.9, 0.2]))
        self.assertEqual(evaluation["status"], "available")
        self.assertEqual(evaluation["known_label_count"], 2)
        self.assertEqual(evaluation["unknown_label_count"], 1)
        self.assertIsNone(evaluation["roc_auc"])

    def test_topology_includes_isolated_nodes_and_preserves_direction(self):
        edges = pd.DataFrame({"txId1": ["a"], "txId2": ["b"]})
        graph = EllipticTopologyEngine.build_and_analyze(
            edges,
            node_ids=["a", "b", "isolated"],
        )
        self.assertTrue(graph.has_edge("a", "b"))
        self.assertFalse(graph.has_edge("b", "a"))
        self.assertIn("isolated", graph)
        self.assertEqual(graph.nodes["isolated"]["wcc_size"], 1)


if __name__ == "__main__":
    unittest.main()
