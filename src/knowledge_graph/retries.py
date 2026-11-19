"""Bounded retries for explicitly transient operations."""

from collections.abc import Callable
from typing import TypeVar


class TransientError(Exception):
    """An operation failed temporarily and may succeed if retried."""


T = TypeVar("T")


def retry_transient(
    operation: Callable[[], T],
    *,
    max_attempts: int,
) -> T:
    """Retry transient failures, then surface the final error."""
    if max_attempts < 1:
        raise ValueError("max_attempts must be at least 1")

    for attempt in range(max_attempts):
        try:
            return operation()
        except TransientError:
            if attempt == max_attempts - 1:
                raise
    raise RuntimeError("Retry loop ended unexpectedly")
