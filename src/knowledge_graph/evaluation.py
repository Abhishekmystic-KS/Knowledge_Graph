"""Small, reproducible evaluation metrics for graph retrieval."""

from dataclasses import dataclass


@dataclass(frozen=True)
class EvaluationResult:
    retrieval_recall: float
    unsupported_claim_rate: float
    citation_precision: float


def evaluate(
    required_fact_ids: set[str],
    retrieved_fact_ids: set[str],
    claimed_fact_ids: set[str],
    cited_fact_ids: set[str],
) -> EvaluationResult:
    """Measure whether retrieval and answer claims are evidence-supported."""
    if not required_fact_ids:
        raise ValueError("At least one required fact is needed")

    retrieved_required = required_fact_ids & retrieved_fact_ids
    retrieval_recall = len(retrieved_required) / len(required_fact_ids)

    unsupported = claimed_fact_ids - retrieved_fact_ids
    unsupported_rate = (
        len(unsupported) / len(claimed_fact_ids)
        if claimed_fact_ids
        else 0.0
    )
    cited_supported = cited_fact_ids & claimed_fact_ids
    citation_precision = (
        len(cited_supported) / len(cited_fact_ids)
        if cited_fact_ids
        else 0.0
    )
    return EvaluationResult(
        retrieval_recall,
        unsupported_rate,
        citation_precision,
    )
