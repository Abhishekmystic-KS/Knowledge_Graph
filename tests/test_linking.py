import unittest

from knowledge_graph.linking import EntityLinker


class EntityLinkerTests(unittest.TestCase):
    def test_resolves_alias_to_canonical_id(self) -> None:
        linker = EntityLinker({
            "Checkout": {"checkout"},
            "checkout service": {"checkout"},
        })

        self.assertEqual(linker.resolve("checkout service"), "checkout")

    def test_rejects_ambiguous_alias(self) -> None:
        linker = EntityLinker({
            "Atlas": {"atlas-database", "atlas-project"},
        })

        with self.assertRaises(ValueError):
            linker.resolve("Atlas")

    def test_rejects_unknown_mention(self) -> None:
        linker = EntityLinker({"Checkout": {"checkout"}})

        with self.assertRaises(KeyError):
            linker.resolve("Payments")


if __name__ == "__main__":
    unittest.main()
