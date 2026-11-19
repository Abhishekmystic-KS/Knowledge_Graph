"""The allowed shapes of facts in the engineering knowledge graph."""

from dataclasses import dataclass


NODE_TYPES = frozenset({"Person", "Team", "Service", "Technology", "Incident"})

ALLOWED_RELATIONSHIPS = {
    ("Person", "MEMBER_OF", "Team"),
    ("Team", "OWNS", "Service"),
    ("Service", "OWNED_BY", "Team"),
    ("Service", "USES", "Technology"),
    ("Service", "DEPENDS_ON", "Service"),
    ("Incident", "AFFECTED", "Service"),
}


@dataclass(frozen=True)
class Fact:
    """A validated relationship between two typed entities."""

    subject_id: str
    subject_type: str
    predicate: str
    object_id: str
    object_type: str


def validate_fact(fact: Fact) -> None:
    """Raise ValueError when a fact is not allowed by the schema."""
    if fact.subject_type not in NODE_TYPES:
        raise ValueError(f"Unknown subject type: {fact.subject_type}")
    if fact.object_type not in NODE_TYPES:
        raise ValueError(f"Unknown object type: {fact.object_type}")
    relationship = (fact.subject_type, fact.predicate, fact.object_type)
    if relationship not in ALLOWED_RELATIONSHIPS:
        raise ValueError(
            f"Relationship is not allowed: "
            f"{fact.subject_type} --{fact.predicate}--> {fact.object_type}"
        )
