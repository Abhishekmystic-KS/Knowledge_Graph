import subprocess
import sys
import unittest
from pathlib import Path


class EndToEndTests(unittest.TestCase):
    def test_checkout_question_shows_answer_and_sources(self) -> None:
        root = Path(__file__).parents[1]
        result = subprocess.run(
            [sys.executable, str(root / "examples" / "ask_checkout.py")],
            check=True,
            capture_output=True,
            text=True,
            env={"PYTHONPATH": str(root / "src")},
        )

        self.assertIn("Payments owns Checkout", result.stdout)
        self.assertIn("engineering-catalog.json", result.stdout)
        self.assertIn("service-inventory.json", result.stdout)


if __name__ == "__main__":
    unittest.main()
