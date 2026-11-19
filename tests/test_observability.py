import unittest

from knowledge_graph.observability import create_query_event


class ObservabilityTests(unittest.TestCase):
    def test_creates_non_sensitive_query_event(self) -> None:
        event = create_query_event(
            "q-123",
            retrieved_fact_count=2,
            latency_ms=18,
            answer_supported=True,
        )

        self.assertEqual(event.as_dict(), {
            "query_id": "q-123",
            "retrieved_fact_count": 2,
            "latency_ms": 18,
            "answer_supported": True,
        })

    def test_rejects_invalid_measurements(self) -> None:
        with self.assertRaises(ValueError):
            create_query_event(
                "",
                retrieved_fact_count=-1,
                latency_ms=18,
                answer_supported=False,
            )


if __name__ == "__main__":
    unittest.main()
