"""A minimal directed knowledge graph for the first learning milestone."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Node:
    """An entity in the graph."""

    node_id: str
    labels: frozenset[str] = field(default_factory=frozenset)
    properties: dict[str, Any] = field(default_factory=dict)


class KnowledgeGraph:
    """Store entities and directed, typed relationships between them."""

    def __init__(self) -> None:
        self._nodes: dict[str, Node] = {}
        self._edges: dict[str, list[tuple[str, str]]] = {}

    def add_node(
        self,
        node_id: str,
        *,
        labels: set[str] | frozenset[str] = frozenset(),
        properties: dict[str, Any] | None = None,
    ) -> Node:
        """Create or replace an entity and return it."""
        node = Node(
            node_id=node_id,
            labels=frozenset(labels),
            properties=dict(properties or {}),
        )
        self._nodes[node_id] = node
        self._edges.setdefault(node_id, [])
        return node

    def add_edge(self, subject: str, predicate: str, object_: str) -> None:
        """Add a directed fact: subject --predicate--> object."""
        if subject not in self._nodes or object_ not in self._nodes:
            raise KeyError("Both edge endpoints must already exist as nodes")
        self._edges[subject].append((predicate, object_))

    def get_node(self, node_id: str) -> Node:
        """Return a node or raise KeyError when it is unknown."""
        return self._nodes[node_id]

    def neighbors(
        self, node_id: str, *, predicate: str | None = None
    ) -> list[Node]:
        """Return nodes reachable by outgoing edges, optionally filtered."""
        edges = self._edges[node_id]
        return [
            self._nodes[target]
            for edge_predicate, target in edges
            if predicate is None or edge_predicate == predicate
        ]

    def two_hop_query(
        self, start: str, first_predicate: str, second_predicate: str
    ) -> list[Node]:
        """Follow two directed relationships from a starting entity."""
        return [
            self._nodes[path[-1][1]]
            for path in self.two_hop_paths(
                start, first_predicate, second_predicate
            )
        ]

    def two_hop_paths(
        self, start: str, first_predicate: str, second_predicate: str
    ) -> list[list[tuple[str, str]]]:
        """Return two-hop paths as (predicate, node_id) steps."""
        results: list[list[tuple[str, str]]] = []
        for first_hop in self.neighbors(start, predicate=first_predicate):
            for second_hop in self.neighbors(
                first_hop.node_id, predicate=second_predicate
            ):
                results.append([
                    (first_predicate, first_hop.node_id),
                    (second_predicate, second_hop.node_id),
                ])
        return results
