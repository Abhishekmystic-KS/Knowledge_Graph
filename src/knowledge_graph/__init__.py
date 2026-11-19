"""Small, dependency-free knowledge graph primitives."""

from .graph import KnowledgeGraph, Node
from .ingestion import load_json_graph
from .schema import Fact, validate_fact

__all__ = [
    "Fact",
    "KnowledgeGraph",
    "Node",
    "load_json_graph",
    "validate_fact",
]
