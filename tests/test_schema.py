import unittest

from knowledge_graph.schema import Fact, validate_fact


class SchemaTests(unittest.TestCase):
    def test_accepts_valid_team_ownership(self) -> None:
        validate_fact(
            Fact("payments", "Team", "OWNS", "checkout", "Service")
        )

    def test_rejects_invalid_relationship_shape(self) -> None:
        with self.assertRaises(ValueError):
            validate_fact(
                Fact("checkout", "Service", "OWNS", "payments", "Team")
            )

    def test_rejects_unknown_entity_type(self) -> None:
        with self.assertRaises(ValueError):
            validate_fact(
                Fact("checkout", "Unknown", "USES", "postgres", "Technology")
            )


if __name__ == "__main__":
    unittest.main()
