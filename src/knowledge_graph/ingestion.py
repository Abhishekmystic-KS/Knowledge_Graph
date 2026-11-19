"""Load a small validated graph dataset from JSON."""

import json
from pathlib import Path
from typing import Any

from .graph import KnowledgeGraph
from .schema import Fact, validate_fact


def load_json_graph(path: str | Path) -> tuple[KnowledgeGraph, list[dict[str, Any]]]:
    """Load nodes and validated edges, returning the graph and edge evidence."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("The JSON root must be an object")

    nodes = data.get("nodes")
    edges = data.get("edges")
    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise ValueError("JSON must contain 'nodes' and 'edges' lists")

    graph = KnowledgeGraph()
    node_types: dict[str, str] = {}
    for node in nodes:
        if not isinstance(node, dict):
            raise ValueError("Each node must be an object")
        node_id = node.get("id")
        node_type = node.get("type")
        if not isinstance(node_id, str) or not isinstance(node_type, str):
            raise ValueError("Each node needs string 'id' and 'type'")
        if node_id in node_types:
            raise ValueError(f"Duplicate node id: {node_id}")
        graph.add_node(
            node_id,
            labels={node_type},
            properties=node.get("properties", {}),
        )
        node_types[node_id] = node_type

    evidence: list[dict[str, Any]] = []
    for edge in edges:
        if not isinstance(edge, dict):
            raise ValueError("Each edge must be an object")
        subject = edge.get("subject")
        predicate = edge.get("predicate")
        object_id = edge.get("object")
        source = edge.get("source")
        if not all(isinstance(value, str) for value in
                   (subject, predicate, object_id, source)):
            raise ValueError(
                "Each edge needs string subject, predicate, object, and source"
            )
        if subject not in node_types or object_id not in node_types:
            raise ValueError("Edge endpoints must refer to defined nodes")

        validate_fact(
            Fact(
                subject,
                node_types[subject],
                predicate,
                object_id,
                node_types[object_id],
            )
        )
        graph.add_edge(subject, predicate, object_id)
        evidence.append(edge)

    return graph, evidence
