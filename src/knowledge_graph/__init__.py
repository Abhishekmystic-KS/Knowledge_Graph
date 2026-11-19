"""Small, dependency-free knowledge graph primitives."""

from .answering import EvidenceAnswer, answer_from_facts
from .conflicts import find_conflicts
from .evaluation import EvaluationResult, evaluate
from .freshness import is_fresh
from .graph import KnowledgeGraph, Node
from .ingestion import load_json_graph
from .linking import EntityLinker
from .provenance import FactRecord
from .retries import TransientError, retry_transient
from .versioning import GraphVersion, VersionStore
from .observability import QueryEvent, create_query_event
from .schema import Fact, validate_fact

__all__ = [
    "Fact",
    "can_access",
    "KnowledgeGraph",
    "Node",
    "answer_from_facts",
    "evaluate",
    "find_conflicts",
    "is_fresh",
    "EntityLinker",
    "EvidenceAnswer",
    "EvaluationResult",
    "FactRecord",
    "load_json_graph",
    "QueryEvent",
    "create_query_event",
    "TransientError",
    "retry_transient",
    "GraphVersion",
    "VersionStore",
    "validate_fact",
]
from .authorization import can_access
