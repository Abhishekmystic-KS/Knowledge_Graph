import unittest

from knowledge_graph.versioning import VersionStore


class VersionStoreTests(unittest.TestCase):
    def test_can_rollback_to_a_known_version(self) -> None:
        store = VersionStore()
        store.save("v1", {"owner": "payments"})
        store.save("v2", {"owner": "growth"})

        store.activate("v1")

        self.assertEqual(store.active().data["owner"], "payments")

    def test_rejects_duplicate_versions(self) -> None:
        store = VersionStore()
        store.save("v1", {})

        with self.assertRaises(ValueError):
            store.save("v1", {})


if __name__ == "__main__":
    unittest.main()
