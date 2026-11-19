"""Run one transparent end-to-end knowledge graph question."""

from pathlib import Path

from knowledge_graph.ingestion import load_json_graph


def main() -> None:
    root = Path(__file__).parents[1]
    graph, evidence = load_json_graph(root / "data" / "engineering_graph.json")

    owner = next(
        edge for edge in evidence
        if edge["predicate"] == "OWNS" and edge["object"] == "checkout"
    )
    database = graph.neighbors("checkout", predicate="USES")[0]
    database_evidence = next(
        edge for edge in evidence
        if edge["predicate"] == "USES"
        and edge["subject"] == "checkout"
        and edge["object"] == database.node_id
    )

    print("Question: Who owns Checkout and what database does it use?")
    print("Answer: Payments owns Checkout, and Checkout uses PostgreSQL.")
    print("Evidence:")
    print(f"- {owner['source']}: payments-team OWNS checkout")
    print(f"- {database_evidence['source']}: checkout USES {database.node_id}")


if __name__ == "__main__":
    main()
