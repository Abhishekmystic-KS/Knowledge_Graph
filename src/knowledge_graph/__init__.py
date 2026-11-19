"""Small, dependency-free knowledge graph primitives."""

from .answering import EvidenceAnswer, answer_from_facts
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
    "EntityLinker",
    "EvidenceAnswer",
    "FactRecord",
    "load_json_graph",
    "validate_fact",
]
