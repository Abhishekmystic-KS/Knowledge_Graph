import unittest

from knowledge_graph import KnowledgeGraph


class KnowledgeGraphTests(unittest.TestCase):
    def setUp(self) -> None:
        self.graph = KnowledgeGraph()
        self.graph.add_node("asha", labels={"Person"})
        self.graph.add_node("acme", labels={"Company"})
        self.graph.add_node("payments", labels={"Service"})
        self.graph.add_edge("asha", "WORKS_AT", "acme")
        self.graph.add_edge("acme", "OWNS", "payments")

    def test_two_hop_query_follows_typed_relationships(self) -> None:
        result = self.graph.two_hop_query("asha", "WORKS_AT", "OWNS")

        self.assertEqual([node.node_id for node in result], ["payments"])

    def test_relationship_direction_matters(self) -> None:
        self.assertEqual(self.graph.neighbors("acme", predicate="WORKS_AT"), [])

    def test_edge_requires_existing_entities(self) -> None:
        with self.assertRaises(KeyError):
            self.graph.add_edge("unknown", "OWNS", "payments")


if __name__ == "__main__":
    unittest.main()
