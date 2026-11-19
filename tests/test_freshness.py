import unittest
from datetime import date

from knowledge_graph.freshness import is_fresh


class FreshnessTests(unittest.TestCase):
    def test_accepts_fact_within_age_limit(self) -> None:
        self.assertTrue(
            is_fresh(
                "2026-11-18",
                today=date(2026, 11, 19),
                max_age_days=30,
            )
        )

    def test_rejects_old_fact(self) -> None:
        self.assertFalse(
            is_fresh(
                "2026-01-01",
                today=date(2026, 11, 19),
                max_age_days=30,
            )
        )

    def test_rejects_future_or_invalid_dates(self) -> None:
        self.assertFalse(
            is_fresh(
                "2026-11-20",
                today=date(2026, 11, 19),
                max_age_days=30,
            )
        )
        with self.assertRaises(ValueError):
            is_fresh(
                "not-a-date",
                today=date(2026, 11, 19),
                max_age_days=30,
            )


if __name__ == "__main__":
    unittest.main()
