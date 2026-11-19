"""Build transparent answers from verified graph facts."""

from dataclasses import dataclass

from .provenance import FactRecord


@dataclass(frozen=True)
class EvidenceAnswer:
    """An answer whose supporting records are explicit."""

    text: str
    evidence: tuple[FactRecord, ...]


def answer_from_facts(records: list[FactRecord]) -> EvidenceAnswer:
    """Format facts into an answer, refusing unsupported claims."""
    if not records:
        raise ValueError("Cannot answer without supporting facts")

    statements = [
        f"{record.fact.subject_id} {record.fact.predicate} "
        f"{record.fact.object_id}"
        for record in records
    ]
    return EvidenceAnswer(
        text="; ".join(statements),
        evidence=tuple(records),
    )
