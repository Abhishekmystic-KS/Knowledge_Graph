import unittest

from knowledge_graph.retries import TransientError, retry_transient


class RetryTests(unittest.TestCase):
    def test_retries_transient_failure_until_success(self) -> None:
        attempts = 0

        def operation() -> str:
            nonlocal attempts
            attempts += 1
            if attempts < 3:
                raise TransientError()
            return "loaded"

        self.assertEqual(retry_transient(operation, max_attempts=3), "loaded")
        self.assertEqual(attempts, 3)

    def test_stops_after_limit(self) -> None:
        attempts = 0

        def operation() -> None:
            nonlocal attempts
            attempts += 1
            raise TransientError()

        with self.assertRaises(TransientError):
            retry_transient(operation, max_attempts=2)
        self.assertEqual(attempts, 2)


if __name__ == "__main__":
    unittest.main()
