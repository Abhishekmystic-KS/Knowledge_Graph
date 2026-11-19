"""Small, dependency-free knowledge graph primitives."""

from .answering import EvidenceAnswer, answer_from_facts
from .conflicts import find_conflicts
from .evaluation import EvaluationResult, evaluate
from .graph import KnowledgeGraph, Node
from .ingestion import load_json_graph
from .linking import EntityLinker
from .provenance import FactRecord
from .schema import Fact, validate_fact

__all__ = [
    "Fact",
    "KnowledgeGraph",
    "Node",
    "answer_from_facts",
    "evaluate",
    "find_conflicts",
    "EntityLinker",
    "EvidenceAnswer",
    "EvaluationResult",
    "FactRecord",
    "load_json_graph",
    "validate_fact",
]
