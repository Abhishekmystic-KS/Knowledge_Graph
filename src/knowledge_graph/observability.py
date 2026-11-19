"""Small structured events for debugging and monitoring."""

from dataclasses import dataclass


@dataclass(frozen=True)
class QueryEvent:
    """Non-sensitive metadata about one graph question."""

    query_id: str
    retrieved_fact_count: int
    latency_ms: int
    answer_supported: bool

    def as_dict(self) -> dict[str, int | str | bool]:
        return {
            "query_id": self.query_id,
            "retrieved_fact_count": self.retrieved_fact_count,
            "latency_ms": self.latency_ms,
            "answer_supported": self.answer_supported,
        }


def create_query_event(
    query_id: str,
    *,
    retrieved_fact_count: int,
    latency_ms: int,
    answer_supported: bool,
) -> QueryEvent:
    """Create a validated event without storing the user's question."""
    if not query_id.strip():
        raise ValueError("query_id is required")
    if retrieved_fact_count < 0 or latency_ms < 0:
        raise ValueError("Counts and latency cannot be negative")
    return QueryEvent(
        query_id=query_id,
        retrieved_fact_count=retrieved_fact_count,
        latency_ms=latency_ms,
        answer_supported=answer_supported,
    )
