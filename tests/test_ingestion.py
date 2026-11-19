import json
import tempfile
import unittest
from pathlib import Path

from knowledge_graph.ingestion import load_json_graph


class IngestionTests(unittest.TestCase):
    def test_loads_nodes_edges_and_source_evidence(self) -> None:
        graph, evidence = load_json_graph(
            Path(__file__).parents[1] / "data" / "engineering_graph.json"
        )

        self.assertEqual(graph.get_node("checkout").properties["name"], "Checkout")
        self.assertEqual(graph.neighbors("checkout")[0].node_id, "postgresql")
        self.assertEqual(evidence[0]["source"], "engineering-catalog.json")

    def test_rejects_edge_with_unknown_node(self) -> None:
        invalid_data = {
            "nodes": [{"id": "checkout", "type": "Service"}],
            "edges": [{
                "subject": "checkout",
                "predicate": "USES",
                "object": "missing",
                "source": "test.json",
            }],
        }
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json") as file:
            json.dump(invalid_data, file)
            file.flush()
            with self.assertRaises(ValueError):
                load_json_graph(file.name)


if __name__ == "__main__":
    unittest.main()
