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

## Milestone 7 — Evidence-backed answers

### Concept learned

Retrieval finds facts; answering turns only those facts into a response. The
answer must include the supporting records so a person can inspect the source.
If no fact was retrieved, the safe behavior is to refuse rather than guess.

```text
Answer: checkout USES postgresql
Evidence: service-inventory.json
Source text: "Checkout uses PostgreSQL."
```

### Challenge

If a user asks which database Checkout uses and the graph has no matching fact,
should the assistant guess based on a common technology choice?

## Milestone 8 — Conflict handling

### Concept learned

A conflict occurs when the same subject and relationship have different
objects:

```text
Checkout --OWNED_BY--> Payments
Checkout --OWNED_BY--> Growth
```

The system should preserve both source-backed claims, mark the conflict, and
resolve it using source authority, freshness, or human review. Two sources
repeating the same claim are not a conflict.

### Challenge

If the catalog says Payments owns Checkout and a six-month-old wiki says Growth
owns Checkout, which fact should receive more trust, and why?

## Milestone 9 — Evaluation

### Concept learned

Evaluation compares system behavior with a small gold dataset containing the
expected facts. A plausible answer is not enough; the retrieved facts and
claims must be checked.

Important first metrics:

- **retrieval recall**: percentage of required facts retrieved;
- **unsupported-claim rate**: percentage of answer claims not present in the
  retrieved evidence.

Example:

```text
Required facts: owner, database
Retrieved facts: owner
Recall: 1 / 2 = 0.5
```

### Challenge

If retrieval recall is 1.0 but unsupported-claim rate is 0.5, is the system
safe to trust? Explain why or why not.

### Next metric

**Citation precision** checks whether cited facts actually support the claims:

```text
supported citations / all citations
```

A citation can be real but irrelevant, so citation presence alone is not
enough. The cited source must support the specific claim.

## Milestone 10 — End-to-end question

The example in `examples/ask_checkout.py` demonstrates the complete path:

```text
JSON source -> validation -> graph -> relationship query -> evidence-backed answer
```

It answers:

```text
Who owns Checkout and what database does it use?
```

The answer is only considered useful because it includes the two source files
supporting the ownership and technology facts.

## Milestone 11 — Production readiness: freshness

Production data changes. A fact should carry an observation date, and each
fact type should have a freshness policy. For example, service ownership might
need review every 90 days, while a historical incident timeline should remain
valid permanently.

```text
observed_at = 2026-01-01
today       = 2026-11-19
max_age     = 30 days
result      = stale
```

Stale facts should be refreshed, marked uncertain, or excluded from answers
depending on the use case. Freshness does not prove correctness; it is only one
signal.

## Milestone 12 — Production readiness: observability

Logging records structured operational facts such as:

```text
query_id
retrieved_fact_count
latency_ms
answer_supported
```

These fields help answer questions like "Are answers getting slower?" and "How
often do we refuse unsupported questions?" Do not log secrets or unnecessary
raw user content. Logs describe behavior; they do not replace evaluation.

## Milestone 13 — Production readiness: access control

Graph facts may have different visibility rules. Authorization should be
checked before a fact is retrieved or included in an answer:

```text
fact requires: payments-engineer
user roles:    frontend-engineer
result:        deny
```

The safe default is deny. A user should not learn a restricted fact merely
because it is connected to a fact they are allowed to see. Access decisions
must also be logged without exposing the restricted content.
hi

## Milestone 14 — Production readiness: bounded retries

Temporary failures can happen while reading an API or document store. Retry
only errors explicitly classified as transient, and stop after a small limit.

```text
attempt 1 -> temporary failure
attempt 2 -> temporary failure
attempt 3 -> success
```

Do not retry validation errors, permission errors, or malformed data; retrying
those only repeats the same failure. Production systems also add backoff and
jitter so many workers do not retry simultaneously.

## Milestone 15 — Production readiness: versioning and rollback

Ingestion should create a new graph version rather than overwriting the only
copy. If a bad file assigns the wrong owner to a service, operators can
activate the previous known-good version:

```text
v1: Checkout owned by Payments
v2: Checkout owned by UnknownTeam
rollback -> activate v1
```

Rollback restores a known state; it does not erase the bad version. Keeping the
bad version makes the incident auditable and allows the ingestion bug to be
fixed before trying again.

## Interactive learning interface: Professional Knowledge Graph Lab

### Design research & inspiration from designed-to-scale.vercel.app

We audited the reference application (Dilum Sanjaya's System Design course) to understand its architectural principles:
1. **Window & Layout Hierarchy**:
   - Fixed-viewport application mode on desktop (`100vw` by `100vh` grid with `52px` topbar, fluid body, and clean `34px` status footer) avoiding awkward window clipping.
   - Three-column body grid (`260px` IDE explorer, fluid center hero canvas, and `390px` educational rail) that collapses to a slide-out drawer on tablets (`<= 980px`) and stacks naturally on mobile devices (`<= 768px`) with unclipped vertical scrolling.
2. **Tactile Color System & Typography**:
   - Warm paper aesthetic: `--paper: #f4ebe0`, `--sheet: #fbf7f1`, `--card: #f8f0e6`, `--line: #ddd3c5`, and `--ink: #1d1b18`.
   - Dark theme tokens with warm obsidian and deep slate tones (`--paper: #1b1916`, `--sheet: #23201b`, `--card: #27231e`).
   - Technical monospace typography (`"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`) with consistent sizing, uppercase tracking on eyebrows (`0.08em`), and tight line heights on headers.
   - High-contrast visual accents: emerald green for verified/teams, azure blue for services/traversal, amber for tech/predicates, rust for conflicts/schema rejections, and purple for persons.
3. **IDE Explorer Pattern**:
   - Collapsible folders (`01 · Foundations`, `02 · Ingestion & Extraction`, `03 · Graph Storage`, `04 · Retrieval & Reasoning`, `05 · Evaluation & Quality`) inspired by modern developer tools.
   - File-like items (`01_data_sources.kg`, `02_extraction.kg`, etc.) with `.kg` file badges, auto-opening active folder, and clear keyboard focus states.
4. **Hero Canvas Visual Language & Substep Animations**:
   - Replaced plain circular nodes with rich architectural system components:
     - **Service Node (Checkout)**: Microservice rack unit with chassis header, status LED (`● 200 OK`), port badge (`:8080`), glyph, and sub-labels.
     - **Database Node (PostgreSQL)**: Multi-tier database chassis with read/write IOPS LED, port (`:5432`), and engine version.
     - **Team Node (Payments)**: Engineering squad badge with active member counter and domain banner.
     - **Person Node (Asha Patel)**: Staff engineer identity chip with on-call status LED.
     - **Incident Node (INC-842)**: Alert triage beacon with blinking red hazard LED and blast radius tags.
   - Dynamic, reactive substep animations for every stage:
     - **Data Sources Substeps**:
       * *Unstructured docs*: Markdown runbook sheet (`checkout-runbook.md`) with vertical scanning laser line (`scan-vertical`) highlighting prose lines and streaming extracted token pills.
       * *Structured data*: Interactive JSON catalog tree (`service-catalog.json`) with expanding syntax keys and green `[VALIDATED TYPE]` pulsing checks.
       * *Incident logs*: Real-time telemetry console (`incident-stream.log`) with blinking cursor, P1 hazard beacon, and live streaming outage events.
       * *Source metadata*: Cryptographic provenance attacher running SHA-256 hash spinner and stamping down a bouncy `VERIFIED & SIGNED ✓` tamper seal with RBAC ACL permissions.
     - **Extraction Substeps**: Entity bounding boxes with targeting brackets, relation arrow morphing, character offset span ruler, and confidence gauges.
     - **Entity Linking Substeps**: Magnetic alias bubble convergence, persistent URN stamp, polysemous ambiguity collision alert ("Atlas"), and steward review ticket.
     - **Validation Substeps**: Schema rule approval stamp, 5-point required field checklist, type constraint mismatch alert, and physical Dead-Letter Queue (DLQ) slide chute.
     - **Deduplication Substeps**: Deterministic triple hashing, idempotency collision barrier, multi-source accumulation counter, and merge ledger.
     - **Provenance Substeps**: Authority tier comparison, freshness half-life countdown, cryptographic signature match, and composite confidence calculation.
     - **Graph Storage Substeps**: Node property drawer, adjacency lists, version snapshot timeline (`v1.4.2 [COMMITTED]`), and storage engine trade-off matrix.
     - **Querying Substeps**: Natural language intent parser, multi-hop light beam traversal, RBAC access gate, and temporal freshness filter.
     - **Evidence Answering Substeps**: Grounded sentence constructor, source citations `[1]` and `[2]`, safe refusal guardrail shield, and NLI entailment meter.
     - **Conflict Handling Substeps**: Competing claims comparison, authority showdown, freshness decay comparison, and human tie-break review ticket dispatch.
     - **Evaluation Substeps**: Retrieval recall formula, zero-hallucination badge, citation precision meter, faithfulness gauge, coverage radar, and P95 latency/cost HUD.
5. **Educational Guide Rail**:
   - Beginner-friendly concept explanation.
   - Deep dive into currently active clickable substep.
   - Interactive prediction quiz with 3 choices, immediate correctness verification, and explanatory feedback.
   - Code/data snippet with syntax styling and copy-to-clipboard functionality.
   - Production failure modes ("What can fail in production?").
   - At production scale notes (distributed streaming, Kafka CDC, Bloom filters, KMS signing).
   - Evidence audit grid (source, span, timestamp, authority score, freshness status).
   - Interactive live evaluation metrics glossary.

### Concept learned:
A production knowledge graph QA pipeline requires 11 distinct stages working in harmony: ingestion outside the graph, extraction with span preservation, entity linking to canonical IDs, schema validation with dead-letter routing, deduplication with source accumulation, cryptographic provenance attachment, versioned graph storage, multi-hop query traversal with access control, citation-backed answer generation with safe refusal guardrails, conflict resolution via authority and freshness matrices, and continuous evaluation against gold test suites.

### Code changed:
- `web/index.html`: Complete semantic redesign with `<header>`, `<nav>`, `<aside>`, `<main>`, `<figure>`, `<section>`, `<footer>`, accessible buttons, ARIA tree roles, HUD headers, mobile drawer close button, and mobile backdrop.
- `web/styles.css`: Complete CSS overhaul including tactile paper and dark theme tokens, mobile phone layout (`<= 768px` and `<= 380px`), non-overlapping mobile node layout, 44px touch targets, vertically stacked conflict matrix, full-height slide-over explorer drawer, SVG bezier paths, glowing active edges, interactive prediction quiz styling, and metric tiles.
- `web/app.js`: Implementation of all 11 stages with clickable substeps, interactive prediction quizzes with instant feedback, stage-specific overlay renderers, SVG curved edges, metric glossary, keyboard shortcuts (`J`/`K`/`ArrowKeys`/`T`/`M`), theme toggling, node inspection click interactions, and mobile drawer logic.
- `learning_log.md`: Documented design research, UI architecture, 11-stage pipeline, and verification results.

### Evidence inspected:
- Reference site DOM, computed styles, CSS variables (`--paper`, `--sheet`, `--card`, `--ink`, `--line`), typography, and layout behavior analyzed via curl and node scripts.
- Verified DOM element IDs and ARIA labels in `web/index.html`.
- Verified 11 stages, 44 substeps, quizzes, and metric definitions in `web/app.js`.
- Verified light and dark mode styling, responsive breakpoints (`<= 1200px`, `<= 980px`, `<= 768px`), and reduced-motion mode in `web/styles.css`.

### Tests run:
- `node -c web/app.js`: Syntax check passed.
- Node mock DOM execution: verified all 11 stage transitions, substep toggles, prediction quiz evaluations, and metric explainer updates.
- Local HTTP server test: `python3 -m http.server 8080 --directory web` verified `HTTP/1.0 200 OK`.
- Python backend test suite: `PYTHONPATH=src python3 -m unittest discover tests` ran 33 tests with 100% OK.

### What can still be wrong:
- Web browsers with JavaScript disabled will see a static placeholder; server-side rendering or progressive static fallback could be added in a hosted full-stack deployment.
- Mobile screens under 360px width may require horizontal panning for wide SVG labels.

### Next concept:
Connecting graph storage to distributed graph engines (Neo4j Cypher or SPARQL endpoints) while maintaining the local in-memory/SQLite implementation behind the same interchangeable repository interface.

