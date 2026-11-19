import unittest

from knowledge_graph.evaluation import evaluate


class EvaluationTests(unittest.TestCase):
    def test_measures_retrieval_recall(self) -> None:
        result = evaluate(
            required_fact_ids={"owner", "database"},
            retrieved_fact_ids={"owner", "database"},
            claimed_fact_ids={"owner"},
            cited_fact_ids={"owner"},
        )

        self.assertEqual(result.retrieval_recall, 1.0)
        self.assertEqual(result.unsupported_claim_rate, 0.0)
        self.assertEqual(result.citation_precision, 1.0)

    def test_detects_unsupported_claims(self) -> None:
        result = evaluate(
            required_fact_ids={"owner"},
            retrieved_fact_ids={"owner"},
            claimed_fact_ids={"owner", "incident"},
            cited_fact_ids={"owner", "unrelated"},
        )

        self.assertEqual(result.unsupported_claim_rate, 0.5)
        self.assertEqual(result.citation_precision, 0.5)


if __name__ == "__main__":
    unittest.main()
