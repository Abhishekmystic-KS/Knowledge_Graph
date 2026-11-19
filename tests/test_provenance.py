import unittest

from knowledge_graph.provenance import FactRecord
from knowledge_graph.schema import Fact


class ProvenanceTests(unittest.TestCase):
    def test_records_evidence_for_a_fact(self) -> None:
        record = FactRecord(
            fact=Fact("payments", "Team", "OWNS", "checkout", "Service"),
            source="engineering-catalog.json",
            source_span="The Payments team owns the Checkout service.",
            observed_at="2026-11-19",
            confidence=0.98,
        )

        self.assertEqual(record.fact.object_id, "checkout")
        self.assertEqual(record.source, "engineering-catalog.json")

    def test_rejects_invalid_confidence(self) -> None:
        with self.assertRaises(ValueError):
            FactRecord(
                fact=Fact("payments", "Team", "OWNS", "checkout", "Service"),
                source="catalog.json",
                source_span="Payments owns Checkout.",
                observed_at="2026-11-19",
                confidence=1.2,
            )


if __name__ == "__main__":
    unittest.main()
