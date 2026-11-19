import unittest

from knowledge_graph.answering import answer_from_facts
from knowledge_graph.provenance import FactRecord
from knowledge_graph.schema import Fact


class AnsweringTests(unittest.TestCase):
    def test_answer_includes_the_supporting_fact(self) -> None:
        record = FactRecord(
            fact=Fact("checkout", "Service", "USES", "postgresql", "Technology"),
            source="service-inventory.json",
            source_span="Checkout uses PostgreSQL.",
            observed_at="2026-11-19",
            confidence=0.99,
        )

        answer = answer_from_facts([record])

        self.assertIn("checkout USES postgresql", answer.text)
        self.assertEqual(answer.evidence, (record,))

    def test_refuses_answer_without_evidence(self) -> None:
        with self.assertRaises(ValueError):
            answer_from_facts([])


if __name__ == "__main__":
    unittest.main()
