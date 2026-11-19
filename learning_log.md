# Learning Log

## Before coding — What is a knowledge graph?

A **knowledge graph is a structured map of facts**. It represents:

- **entities** as nodes: a person, company, service, technology, or incident;
- **relationships** as directed edges: works at, owns, depends on, caused, or
  uses;
- **properties** as details attached to nodes or relationships: a name, team,
  timestamp, source, or confidence score.

Example:

```text
(Asha: Person) --WORKS_AT--> (Acme: Company)
(Acme)        --OWNS-----> (Payments: Service)
(Payments)    --USES-----> (PostgreSQL: Technology)
```

This is more useful than a list of disconnected text because we can ask
relationship questions such as:

```text
Who owns the service used by Asha's company?
Asha -> WORKS_AT -> Acme -> OWNS -> Payments
```

The graph is not automatically intelligent and it does not guarantee that a
fact is true. Its value comes from making facts connected, queryable, and
traceable to sources. A production system must still validate data, handle
conflicts, and show evidence.

### How it differs from other tools

| Tool | Main strength |
| --- | --- |
| Relational database | Reliable tables, rows, joins, and transactions |
| Document store | Flexible storage of whole documents |
| Vector database | Finding semantically similar text |
| Knowledge graph | Explicit entities, relationships, and multi-hop reasoning |

Real systems often use these together: documents are the source, a vector
index finds relevant text, and a knowledge graph connects validated facts.

## Knowledge graph workflow

The usual workflow is:

```text
Source data
   ↓
Extraction
   ↓
Entity linking
   ↓
Validation and deduplication
   ↓
Graph storage
   ↓
Querying
   ↓
Evidence-backed answer
```

### 1. Extraction

Read a document or record and identify entities and relationships.

```text
"The Payments team owns the Checkout service."

Extracted:
  entity: Payments team
  entity: Checkout service
  relation: Payments team --OWNS--> Checkout service
```

Extraction can use rules, database fields, or an LLM. The extracted fact should
retain its source text and document identifier.

### 2. Entity linking

Connect each mention to the correct canonical entity instead of creating a
duplicate node.

```text
"Checkout", "checkout service", "checkout-api"
                 ↓
        Service: checkout-api
```

Linking may use IDs, aliases, exact matching, or similarity plus human review.
This step is important because two spellings may refer to one entity, while one
name such as "Atlas" may refer to several entities.

### 3. Validation, deduplication, and storage

Check that the relationship is allowed by the schema, merge duplicate facts,
and store the fact with provenance:

```text
Payments --OWNS--> Checkout
source = engineering-catalog.json
source_span = "The Payments team owns the Checkout service."
observed_at = 2026-11-18
```

If two sources disagree, preserve both facts and mark the conflict; do not
silently overwrite one.

### 4. Querying

Translate a user question into a graph traversal:

```text
Question: Which team owns Checkout and what database does it use?

Checkout <- OWNS - Payments
Checkout - USES -> PostgreSQL
```

The query should return both the result and the facts used to reach it.

### 5. Answering with evidence

Turn the query result into a readable answer and cite the source facts. If the
graph has no supported path, say that the information is unavailable instead
of guessing.

## Milestone 1 — Graph fundamentals

### Concept learned

A knowledge graph stores entities as **nodes** and facts between entities as
directed, named **edges**:

```text
Asha --WORKS_AT--> Acme --OWNS--> Payments
```

The two-hop query follows `WORKS_AT` and then `OWNS` to answer which service is
owned by the company where Asha works.

### Important design decision

Relationships are directed and typed. `Asha WORKS_AT Acme` is not the same as
`Acme WORKS_AT Asha`; the direction and predicate carry meaning.

### Verification

The tests verify a successful two-hop traversal, direction-sensitive lookup,
and rejection of edges whose endpoints are missing.

### Still to learn

- How to define a larger schema
- How to preserve source evidence for every fact
- How to ingest documents and handle conflicting facts

## Milestone 2 — Schema design

### Concept learned

A schema is a contract for the graph. It defines which entity types exist and
which relationship shapes are valid. For example, a `Team` can `OWNS` a
`Service`, but a `Service` cannot `OWNS` a `Team` in our current model.

### Design

The first schema supports `Person`, `Team`, `Service`, `Technology`, and
`Incident` nodes. It allows membership, ownership, technology usage, service
dependencies, and incident impact relationships.

### Challenge

Predict whether this fact should pass validation:

```text
Checkout --DEPENDS_ON--> PostgreSQL
```

The next step is to verify the prediction and then add source metadata to each
fact.

## Milestone 3 — JSON ingestion

### Concept learned

Ingestion means loading source data into the graph. Our JSON separates
`nodes` (entities) from `edges` (relationships). Before an edge is stored, the
loader checks that its endpoints exist, its relationship matches the schema,
and its source is recorded.

### Example

```json
{
  "subject": "payments-team",
  "predicate": "OWNS",
  "object": "checkout",
  "source": "engineering-catalog.json"
}
```

### Challenge

Why should we reject an edge that refers to an ID not present in the `nodes`
list instead of creating that node automatically?

## Milestone 4 — Entity linking

### Concept learned

Entity linking maps a name found in text to a canonical graph ID:

```text
"Checkout service" -> checkout
```

This prevents duplicate nodes when the same entity has multiple names. The
linker must not silently guess: unknown names and ambiguous names are errors
that need more data or human review.

### Challenge

If the text says `"Atlas"` and the graph contains both an Atlas database and an
Atlas project, should the system choose one automatically?

## Milestone 5 — Provenance

### Concept learned

Provenance is the history attached to a fact: where it came from, which text
supported it, when it was observed, and how confident the system is.

```text
Payments --OWNS--> Checkout
source: engineering-catalog.json
source_span: "The Payments team owns the Checkout service."
observed_at: 2026-11-19
confidence: 0.98
```

Without provenance, an answer may sound convincing but cannot be audited or
corrected. Confidence is a signal for review, not proof that a fact is true.

### Challenge

If two sources claim different owners for Checkout, should we silently replace
the old fact or preserve both facts and investigate the conflict?

## Milestone 6 — Querying

### Concept learned

A graph query follows relationships from a starting entity. A one-hop query
asks for direct neighbors; a multi-hop query follows a path through more than
one relationship.

```text
Asha -WORKS_AT-> Acme -OWNS-> Payments
```

The answer is `Payments`, but the path is also important because it explains
how the answer was found. Query results should be inspectable rather than
returning an unexplained name.

### Challenge

For the question `"What does Checkout use?"`, which relationship should the
query follow: `OWNS`, `USES`, or `DEPENDS_ON`?
