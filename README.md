# Knowledge Graph Learning Project

An interactive, beginner-friendly project for learning how to build an evidence-backed knowledge graph application.

**Live demo:** https://abhishekmystic-ks.github.io/Knowledge_Graph/

The demo explains the complete workflow from source documents to a trustworthy answer:

- data sources;
- extraction;
- entity linking;
- schema validation;
- deduplication;
- provenance;
- graph storage;
- querying;
- evidence-backed answering;
- conflict handling;
- evaluation;
- production readiness.

## What you will learn

- the difference between nodes, edges, entities, relationships, and properties;
- how to distinguish a knowledge graph from a relational database, document store, and vector database;
- how to extract and link entities;
- how to validate, deduplicate, and store graph facts;
- how to preserve source evidence and timestamps;
- how to retrieve facts and generate answers only when evidence supports them;
- how to detect conflicts and safely refuse unsupported answers;
- how to measure retrieval recall, unsupported claims, and citation precision;
- how to move a prototype toward production readiness.

## Interactive website

The interactive learning interface is inside `web/`:

- `web/index.html` contains the page structure;
- `web/styles.css` contains the visual design and themes;
- `web/app.js` contains the lesson stages and interactions.

Run it locally:

```bash
cd /home/kali/Desktop/knowledge_graph
python3 -m http.server 8765 --directory web
```

Open http://localhost:8765.

## Python graph prototype

The standard-library Python implementation demonstrates graph fundamentals and production-shaped concepts.

Run the example:

```bash
PYTHONPATH=src python3 examples/ask_checkout.py
```

Run all tests:

```bash
PYTHONPATH=src python3 -m unittest discover -s tests -v
```

## Project structure

```text
data/       Example graph and evaluation JSON
examples/   End-to-end example
src/        Python knowledge graph implementation
tests/      Unit and integration tests
web/        Interactive browser learning site
```

## Learning notes

Read [AGENTS.md](AGENTS.md) for the project teaching contract and [learning_log.md](learning_log.md) for lessons, decisions, challenges, and unresolved questions.

## What is still important to verify

An interactive lesson and passing tests demonstrate implementation behavior, but they do not prove real-world correctness. Production use additionally requires authoritative fixtures, human-reviewed gold questions, fresh data, access control, monitoring, and reproducible evaluations.
