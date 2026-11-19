import unittest

from knowledge_graph.authorization import can_access


class AuthorizationTests(unittest.TestCase):
    def test_allows_user_with_required_role(self) -> None:
        self.assertTrue(can_access({"payments-engineer"}, {"payments-engineer"}))

    def test_denies_user_without_required_role(self) -> None:
        self.assertFalse(can_access({"frontend-engineer"}, {"payments-engineer"}))

    def test_rejects_missing_access_requirement(self) -> None:
        with self.assertRaises(ValueError):
            can_access({"payments-engineer"}, set())


if __name__ == "__main__":
    unittest.main()
