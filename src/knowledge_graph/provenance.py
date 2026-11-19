"""Source information attached to graph facts."""

from dataclasses import dataclass

from .schema import Fact, validate_fact


@dataclass(frozen=True)
class FactRecord:
    """A validated fact together with the evidence supporting it."""

    fact: Fact
    source: str
    source_span: str
    observed_at: str
    confidence: float

    def __post_init__(self) -> None:
        validate_fact(self.fact)
        if not self.source.strip():
            raise ValueError("A fact needs a source")
        if not self.source_span.strip():
            raise ValueError("A fact needs the supporting source span")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("Confidence must be between 0 and 1")
