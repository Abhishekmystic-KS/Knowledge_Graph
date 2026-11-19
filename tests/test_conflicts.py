import unittest

from knowledge_graph.conflicts import find_conflicts
from knowledge_graph.provenance import FactRecord
from knowledge_graph.schema import Fact


def owner_record(team: str, source: str) -> FactRecord:
    return FactRecord(
        fact=Fact("checkout", "Service", "OWNED_BY", team, "Team"),
        source=source,
        source_span=f"Checkout is owned by {team}.",
        observed_at="2026-11-19",
        confidence=0.9,
    )


class ConflictTests(unittest.TestCase):
    def test_detects_different_claims_about_same_relationship(self) -> None:
        conflicts = find_conflicts([
            owner_record("payments-team", "catalog.json"),
            owner_record("growth-team", "wiki.md"),
        ])

        self.assertEqual(len(conflicts), 1)
        self.assertEqual(len(conflicts[0]), 2)

    def test_does_not_flag_same_claim_from_two_sources(self) -> None:
        conflicts = find_conflicts([
            owner_record("payments-team", "catalog.json"),
            owner_record("payments-team", "wiki.md"),
        ])

        self.assertEqual(conflicts, [])


if __name__ == "__main__":
    unittest.main()
