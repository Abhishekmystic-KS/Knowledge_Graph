"""Detect contradictory claims in graph evidence."""

from collections import defaultdict

from .provenance import FactRecord


def find_conflicts(records: list[FactRecord]) -> list[tuple[FactRecord, ...]]:
    """Return groups with the same subject/predicate and different objects."""
    grouped: dict[tuple[str, str], list[FactRecord]] = defaultdict(list)
    for record in records:
        key = (record.fact.subject_id, record.fact.predicate)
        grouped[key].append(record)

    conflicts = []
    for group in grouped.values():
        object_ids = {record.fact.object_id for record in group}
        if len(object_ids) > 1:
            conflicts.append(tuple(group))
    return conflicts
