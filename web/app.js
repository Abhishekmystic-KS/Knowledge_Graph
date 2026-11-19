/**
 * Knowledge Graph Lab — Interactive Educational Engine
 * Completely dependency-free, high-performance vanilla ES6 JavaScript.
 */

// 1. Definition of Evaluation Metrics Glossary
const metricGlossary = {
  recall: {
    name: "Retrieval Recall",
    formula: "Retrieved Gold Facts / Total Required Gold Facts",
    target: "100%",
    desc: "Measures whether the retrieval step captured every fact needed to answer the question. If recall < 1.0, the assistant must either refuse or risk hallucinating.",
  },
  unsupported: {
    name: "Unsupported-Claim Rate",
    formula: "Unsupported Claims / Total Claims Generated",
    target: "0.0%",
    desc: "The hallucination rate. Measures how often the system generates statements not grounded in the retrieved knowledge graph subgraph.",
  },
  citation: {
    name: "Citation Precision",
    formula: "Directly Relevant Citations / Total Citations Attached",
    target: "100%",
    desc: "Ensures cited source documents and text spans actually support the specific sentences they are attached to, preventing deceptive references.",
  },
  faithfulness: {
    name: "Answer Faithfulness",
    formula: "Logically Entailed Statements / Total Statements",
    target: "100%",
    desc: "Verifies that the generated answer logically entails only from retrieved evidence without extrapolating unverified assumptions.",
  },
  coverage: {
    name: "Query Coverage",
    formula: "Answered Valid Questions / Total Benchmark Questions",
    target: "95.4%",
    desc: "The percentage of organization questions the knowledge graph is capable of answering with high confidence and evidence.",
  },
  latency: {
    name: "P95 Query Latency",
    formula: "95th percentile execution time (ms)",
    target: "< 50ms",
    desc: "Graph traversal takes 38ms compared to 1200ms+ for brute-force document scanning or vector similarity re-ranking over thousands of docs.",
  },
  cost: {
    name: "Cost per Query",
    formula: "Token compute & graph IO cost ($)",
    target: "$0.0003",
    desc: "Feeding only a compact 3-fact subgraph into an LLM uses ~150 tokens instead of feeding 20 raw documents (30,000 tokens), slashing cost by 99%.",
  },
};

// 2. Comprehensive Definition of All 11 Stages
const stages = [
  {
    id: "data-sources",
    folderIndex: 0,
    file: "01_data_sources.kg",
    label: "Data sources",
    short: "Sources",
    kicker: "Milestone 1 · Foundations",
    title: "Data sources: facts begin in disconnected systems",
    hint: "Explore raw source intake documents",
    lead: "A knowledge graph does not invent facts out of thin air. It ingests unstructured text, structured JSON registries, CSV databases, tickets, and incident post-mortems from across an organization.",
    explanation:
      "Enterprise knowledge is fragmented across service catalogs, Git runbooks, Slack outage discussions, and incident trackers. The intake stage registers every document with a unique URI, timestamp, permissions boundary, and SHA-256 checksum so that every downstream fact remains traceable to an authoritative origin.",
    code: `{\n  "source_id": "doc:service-catalog-2026",\n  "type": "official_catalog",\n  "fetched_at": "2026-11-19T08:00:00Z",\n  "checksum": "sha256:4a7e93b1...",\n  "records": [\n    {\n      "service": "checkout",\n      "owner_team": "payments",\n      "tier": 1,\n      "repo": "github.com/acme/checkout"\n    }\n  ]\n}`,
    codeLang: "JSON",
    codeFilename: "catalog.json",
    failure:
      "Processing documents without cryptographic checksums or version timestamps causes silent data overwrites, stale runbooks overwriting authoritative catalogs, and duplicate reprocessing loops.",
    scale:
      "At enterprise scale, event buses (e.g. Kafka) stream change-data-capture (CDC) events into the ingestion worker pool with idempotency keys and partitioned rate limits.",
    evidence: {
      source: "engineering-catalog.json",
      span: "catalog.json records: [checkout -> payments]",
      timestamp: "2026-11-19T08:00:00Z",
      authority: "0.95 (Official Catalog)",
      freshness: "Fresh (Age: 2 hours)",
      conflict: "None",
    },
    substeps: [
      ["Unstructured docs", "Ingest markdown runbooks, architectural RFCs, and wikis."],
      ["Structured data", "Read JSON catalogs, SQL schemas, and service inventories."],
      ["Incident logs", "Stream incident reports, post-mortems, and pager duty alerts."],
      ["Source metadata", "Compute SHA-256 hashes, record authors, and bind access ACLs."],
    ],
    quiz: {
      question: "Can a knowledge graph be more accurate than the source documents it ingests?",
      options: [
        "Yes, the graph automatically corrects wrong facts with AI.",
        "No, the graph represents source claims; if sources are wrong or stale, the graph reflects that unless validated.",
        "Yes, graph databases inherently reject incorrect statements.",
      ],
      correctIndex: 1,
      explanation:
        "Correct! Knowledge graphs make connections and provenance transparent, but 'garbage in, garbage out' still applies. Strict schema validation, freshness checks, and authority scoring are required to protect graph integrity.",
    },
    visibleNodes: [],
    visibleEdges: [],
    activePath: [],
    packetPos: { x: 8, y: 18, label: "INTAKE" },
    metrics: { recall: "—", unsupported: "—", citation: "—", faithfulness: "—", coverage: "—", latency: "12ms", cost: "$0.0000" },
  },
  {
    id: "extraction",
    folderIndex: 1,
    file: "02_extraction.kg",
    label: "Extraction",
    short: "Extract",
    kicker: "Milestone 2 · Ingestion & Extraction",
    title: "Extraction: discovering candidate entities & relationships",
    hint: "Identify named entities and semantic verbs",
    lead: "Extraction parses raw text or structured attributes into candidate subject-predicate-object triples, capturing the exact character offsets for complete auditability.",
    explanation:
      "From the statement 'The Payments team owns the Checkout service', extraction identifies two entity candidates ('Payments team' and 'Checkout service') and one directed relationship candidate ('OWNS'). Crucially, the extractor preserves the original character span so that any downstream claim can be defended with verifiable text evidence.",
    code: `# Deterministic / Model extraction output\n@dataclass\nclass CandidateFact:\n    subject_mention: str = "Payments team"\n    predicate: str = "OWNS"\n    object_mention: str = "Checkout service"\n    source_id: str = "doc:catalog-2026"\n    char_start: int = 4\n    char_end: int = 43\n    confidence: float = 0.98`,
    codeLang: "PYTHON",
    codeFilename: "extraction.py",
    failure:
      "Discarding source character spans during extraction makes it impossible to cite exact evidence later, turning explainable retrieval into an ungrounded black box.",
    scale:
      "Production extractors begin with high-precision regex/grammar rules and structured catalog parsers. LLMs are reserved for ambiguous free-form documents with strict JSON schema constraints.",
    evidence: {
      source: "engineering-catalog.json",
      span: "“The Payments team owns the Checkout service.” [chars 4-43]",
      timestamp: "2026-11-19T08:00:00Z",
      authority: "0.95 (High)",
      freshness: "Fresh",
      conflict: "None",
    },
    substeps: [
      ["Entities", "Detect typed mentions: Payments (Team), Checkout (Service), PostgreSQL (Tech)."],
      ["Relationships", "Detect directed predicates: OWNS, USES, DEPENDS_ON, AFFECTED."],
      ["Source spans", "Capture exact byte/character offsets to anchor provenance citations."],
      ["Confidence", "Score extraction confidence (0.98 rule-based vs 0.85 LLM zero-shot)."],
    ],
    quiz: {
      question: "Why is saving the exact source character span essential during extraction?",
      options: [
        "It compresses the database index size.",
        "It allows users and auditors to verify the exact text that justified the fact.",
        "It is required by the SQLite database driver.",
      ],
      correctIndex: 1,
      explanation:
        "Exactly right! An enterprise knowledge graph must be explainable. Storing character spans enables instant citation validation and human auditing.",
    },
    visibleNodes: ["team:payments", "service:checkout"],
    visibleEdges: [],
    activePath: [],
    packetPos: { x: 26, y: 38, label: "EXTRACT" },
    metrics: { recall: "—", unsupported: "—", citation: "—", faithfulness: "—", coverage: "—", latency: "19ms", cost: "$0.0001" },
  },
  {
    id: "entity-linking",
    folderIndex: 1,
    file: "03_entity_linking.kg",
    label: "Entity linking",
    short: "Linking",
    kicker: "Milestone 2 · Ingestion & Extraction",
    title: "Entity linking: resolving mentions to canonical IDs",
    hint: "Map aliases to a single stable entity",
    lead: "Entity linking resolves surface mentions, nicknames, and abbreviations to stable canonical identifiers, preventing graph fragmentation into duplicate nodes.",
    explanation:
      "In corporate wikis and logs, people write 'Checkout', 'checkout-service', 'Checkout API', and 'chk-svc'. Entity linking maps all these synonymous surface forms to a single canonical entity ID ('service:checkout'). When an ambiguous name such as 'Atlas' appears (which could mean MongoDB Atlas or Project Atlas), the system halts and escalates to human review instead of guessing.",
    code: `linker = EntityLinker()\nlinker.register_canonical(\n    entity_id="service:checkout",\n    aliases=["Checkout", "Checkout API", "checkout-service", "chk-v2"],\n    entity_type="Service"\n)\n\n# Resolves mention "Checkout API" -> "service:checkout"\ncanonical_id = linker.resolve("Checkout API")`,
    codeLang: "PYTHON",
    codeFilename: "linking.py",
    failure:
      "Creating new nodes for every surface spelling causes multi-hop traversals to dead-end because edges connect to different variations of the same real-world entity.",
    scale:
      "High-scale systems use embedding-based vector lookups coupled with cosine similarity thresholds and human review escalation queues for scores between 0.70 and 0.85.",
    evidence: {
      source: "service-registry.json",
      span: "alias: 'Checkout API' matched to canonical: 'service:checkout'",
      timestamp: "2026-11-19T08:15:00Z",
      authority: "0.95 (Canonical Linker)",
      freshness: "Fresh",
      conflict: "None",
    },
    substeps: [
      ["Aliases", "Maintain synonym tables for names, acronyms, and legacy service keys."],
      ["Canonical IDs", "Map accepted mentions to immutable URNs like service:checkout."],
      ["Ambiguity check", "Detect polysemous names like 'Atlas' (Tool vs DB Cluster)."],
      ["Human review", "Route low-confidence links (< 0.85) to domain stewards."],
    ],
    quiz: {
      question: "What happens if entity linking fails to connect 'Checkout API' and 'Checkout'?",
      options: [
        "The graph database crashes immediately.",
        "Two disconnected nodes exist, so queries asking for Checkout will miss facts attached to Checkout API.",
        "The database automatically merges them during queries.",
      ],
      correctIndex: 1,
      explanation:
        "Spot on! Without entity linking, the graph becomes fragmented into disconnected nodes, breaking multi-hop reasoning and completeness.",
    },
    visibleNodes: ["team:payments", "service:checkout"],
    visibleEdges: [],
    activePath: [],
    packetPos: { x: 42, y: 38, label: "LINKED" },
    metrics: { recall: "—", unsupported: "—", citation: "—", faithfulness: "—", coverage: "—", latency: "22ms", cost: "$0.0001" },
  },
  {
    id: "validation",
    folderIndex: 1,
    file: "04_validation.kg",
    label: "Validation",
    short: "Validate",
    kicker: "Milestone 2 · Ingestion & Extraction",
    title: "Validation: enforcing schema & rejecting malformed triples",
    hint: "Check facts against the schema rulebook",
    lead: "A schema is a contract. It verifies that entity types, relationship directions, required timestamps, and property values comply with organizational rules before writing to the graph.",
    explanation:
      "Schema validation acts as a strict firewall. Triples such as (Team: Payments) -[OWNS]-> (Service: Checkout) are verified and approved. If an extractor produces an illegal triple such as (Technology: PostgreSQL) -[OWNS]-> (Person: Asha), validation rejects the record with a SchemaViolationError and routes it to a Dead-Letter Queue (DLQ) for engineering inspection.",
    code: `# Schema definition rule:\nALLOWED_RELATIONSHIPS = {\n    ("Team", "OWNS", "Service"),\n    ("Service", "USES", "Technology"),\n    ("Person", "WORKS_AT", "Team"),\n    ("Incident", "AFFECTED", "Service"),\n}\n\ndef validate_fact(fact: Fact) -> None:\n    shape = (fact.subject_type, fact.predicate, fact.object_type)\n    if shape not in ALLOWED_RELATIONSHIPS:\n        raise SchemaViolation(f"Illegal triple shape: {shape}")`,
    codeLang: "PYTHON",
    codeFilename: "schema.py",
    failure:
      "Swallowing validation errors or allowing arbitrary graph triples corrupts graph semantics, leading to nonsense multi-hop query answers.",
    scale:
      "Production systems serialize invalid triples to an SQS/Kafka Dead-Letter Queue with full stack traces, firing PagerDuty alerts if the violation rate exceeds 1%.",
    evidence: {
      source: "schema.py",
      span: "Schema rule (Team, OWNS, Service) matched successfully",
      timestamp: "2026-11-19T08:20:00Z",
      authority: "1.00 (Core Schema)",
      freshness: "Enforced",
      conflict: "0 Violations",
    },
    substeps: [
      ["Schema rules", "Define allowed domain, predicate, and range triples."],
      ["Required fields", "Verify non-null IDs, source IDs, spans, and timestamps."],
      ["Type constraints", "Enforce strict enum types (Team, Service, Tech, Person)."],
      ["Error queues", "Divert malformed records into a Dead-Letter Queue (DLQ) for audit."],
    ],
    quiz: {
      question: "Why should invalid records be placed in an error queue instead of being silently dropped?",
      options: [
        "Silent drops hide parser bugs and cause silent loss of valuable business knowledge.",
        "Error queues make the graph query faster.",
        "Database drivers require dead-letter queues to boot up.",
      ],
      correctIndex: 0,
      explanation:
        "Correct! Silent failures mask broken extraction code or changing upstream API schemas. An auditable error queue enables alerting and reprocessing.",
    },
    visibleNodes: ["team:payments", "service:checkout"],
    visibleEdges: ["owns"],
    activePath: [],
    packetPos: { x: 30, y: 47, label: "VALID" },
    metrics: { recall: "—", unsupported: "—", citation: "—", faithfulness: "—", coverage: "—", latency: "25ms", cost: "$0.0001" },
  },
  {
    id: "deduplication",
    folderIndex: 1,
    file: "05_deduplication.kg",
    label: "Deduplication",
    short: "Dedup",
    kicker: "Milestone 2 · Ingestion & Extraction",
    title: "Deduplication: merging repeated claims into one clean fact",
    hint: "Consolidate duplicate edges and accumulate evidence",
    lead: "Multiple files often assert the exact same fact. Deduplication computes an immutable fact hash to ensure a single edge exists while accumulating all supporting sources.",
    explanation:
      "If both 'catalog.json' and 'checkout-runbook.md' declare that Payments owns Checkout, the graph should not store two duplicate edges. Instead, deduplication computes an idempotent triple key hash (hash(team:payments + OWNS + service:checkout)). It updates the existing edge by adding the new source document to its evidence array, strengthening confidence without bloating the graph.",
    code: `fact_key = hashlib.sha256(\n    f"{subject_id}:{predicate}:{object_id}".encode()\n).hexdigest()\n\nif graph.has_edge(subject_id, predicate, object_id):\n    edge = graph.get_edge(subject_id, predicate, object_id)\n    edge.add_source_evidence(source_doc, span, timestamp)\n    # Edge count remains 1; evidence count becomes 2!`,
    codeLang: "PYTHON",
    codeFilename: "deduplication.py",
    failure:
      "Failure to deduplicate results in exponential graph explosion, where identical relationships multiply with every hourly ingestion batch.",
    scale:
      "Distributed graph stores use Bloom filters and Redis key caches for microsecond deduplication lookups during million-record ETL pipelines.",
    evidence: {
      source: "catalog.json + runbook.md",
      span: "2 independent document mentions merged into 1 canonical edge",
      timestamp: "2026-11-19T08:25:00Z",
      authority: "Multi-source verified",
      freshness: "Fresh",
      conflict: "0 (Identical claims)",
    },
    substeps: [
      ["Stable keys", "Compute deterministic SHA-256 keys from subject, predicate, and object."],
      ["Idempotent writes", "Running ingestion 100 times produces identical graph state."],
      ["Source accumulation", "Merge provenance records so multiple sources strengthen confidence."],
      ["Merge history", "Track an immutable history of every file that contributed."],
    ],
    quiz: {
      question: "If two separate documents assert that Payments owns Checkout, what should the graph store?",
      options: [
        "Two separate edges connecting the two nodes.",
        "One edge, with both documents recorded in its provenance evidence list.",
        "Delete the fact entirely because of redundancy.",
      ],
      correctIndex: 1,
      explanation:
        "Exactly! A clean knowledge graph maintains one semantic edge, but preserves all supporting documents in its evidence list to increase confidence.",
    },
    visibleNodes: ["team:payments", "service:checkout"],
    visibleEdges: ["owns"],
    activePath: ["owns"],
    packetPos: { x: 30, y: 47, label: "MERGED" },
    metrics: { recall: "—", unsupported: "—", citation: "—", faithfulness: "—", coverage: "—", latency: "27ms", cost: "$0.0001" },
  },
  {
    id: "provenance",
    folderIndex: 1,
    file: "06_provenance.kg",
    label: "Provenance",
    short: "Provenance",
    kicker: "Milestone 2 · Ingestion & Extraction",
    title: "Provenance: attaching authority, freshness & audit metadata",
    hint: "Every fact carries cryptographic audit proof",
    lead: "Every node and edge in a trustworthy knowledge graph carries provenance: where it came from, who wrote it, when it was observed, its authority rating, and its freshness TTL.",
    explanation:
      "A fact without provenance is a rumor. Provenance attaches metadata directly to facts: an official service registry has an authority score of 0.95, while an informal Slack mention has an authority score of 0.35. Freshness monitors track time-to-live (TTL), warning when a runbook has not been verified for 180 days.",
    code: `@dataclass\nclass FactProvenance:\n    source_id: str = "doc:catalog-2026"\n    source_type: str = "official_catalog"\n    authority_score: float = 0.95\n    observed_at: datetime = datetime(2026, 11, 19, 8, 0)\n    freshness_ttl_days: int = 30\n    is_fresh: bool = True\n    content_sha256: str = "e3b0c442..."`,
    codeLang: "PYTHON",
    codeFilename: "provenance.py",
    failure:
      "Treating all sources equally allows a casual 2-year-old developer comment to override an authoritative production service registry.",
    scale:
      "Regulated industries (finance, healthcare) cryptographically sign each provenance record with KMS keys to satisfy compliance and SOC2 auditing.",
    evidence: {
      source: "doc:catalog-2026 (catalog.json)",
      span: "“Payments team owns Checkout”",
      timestamp: "2026-11-19T08:00:00Z",
      authority: "0.95 (Tier 1 Authority)",
      freshness: "Fresh (Expires in 28 days)",
      conflict: "Verified",
    },
    substeps: [
      ["Source authority", "Rank sources by reliability (Catalog: 0.95 > Wiki: 0.60 > Chat: 0.35)."],
      ["Freshness & TTL", "Track observation age and flag facts past their freshness half-life."],
      ["Timestamps & hashes", "Store cryptographic content hashes to verify tamper-free history."],
      ["Composite confidence", "Calculate confidence from extraction quality and source trust."],
    ],
    quiz: {
      question: "If an unofficial wiki from yesterday contradicts an official catalog from 2 months ago, how should the system resolve it?",
      options: [
        "Always pick yesterday's wiki because newer is always better.",
        "Compare authority and freshness together, and flag for human review if authority is unclear.",
        "Silently delete both facts.",
      ],
      correctIndex: 1,
      explanation:
        "Spot on! Freshness and authority are competing signals. An unofficial wiki may be a draft or typo. The system should compare authority tiers and escalate conflicts.",
    },
    visibleNodes: ["team:payments", "service:checkout"],
    visibleEdges: ["owns"],
    activePath: ["owns"],
    packetPos: { x: 30, y: 47, label: "PROVENANCE" },
    metrics: { recall: "—", unsupported: "—", citation: "—", faithfulness: "—", coverage: "—", latency: "29ms", cost: "$0.0001" },
  },
  {
    id: "graph-storage",
    folderIndex: 2,
    file: "07_graph_storage.kg",
    label: "Graph storage",
    short: "Storage",
    kicker: "Milestone 3 · Graph Storage",
    title: "Graph storage: connected property graphs & versioned snapshots",
    hint: "Explore nodes, directed edges, and immutable snapshots",
    lead: "Validated facts are committed into a connected graph structure with forward and backward adjacency indexes and immutable versioned snapshots for safe rollbacks.",
    explanation:
      "Knowledge graphs connect entities (nodes) through directed, labeled relationships (edges). Checkout uses PostgreSQL; Payments owns Checkout; Asha works at Payments. Rather than relying on a heavy distributed graph database initially, an in-memory or SQLite adjacency model teaches fundamental traversal mechanics while keeping the storage layer swappable.",
    code: `graph = KnowledgeGraph()\ngraph.add_node("team:payments", type="Team", name="Payments")\ngraph.add_node("service:checkout", type="Service", name="Checkout")\ngraph.add_node("tech:postgresql", type="Technology", name="PostgreSQL")\n\ngraph.add_edge("team:payments", "OWNS", "service:checkout")\ngraph.add_edge("service:checkout", "USES", "tech:postgresql")\n\nsnapshot_id = graph.create_version("v1.4.2")`,
    codeLang: "PYTHON",
    codeFilename: "graph.py",
    failure:
      "Writing graph updates in place without versioning or snapshots prevents rolling back corrupt ingestion batches or tracking schema migrations.",
    scale:
      "Enterprise systems start with SQLite or in-memory models during prototyping, migrating to Neo4j or Amazon Neptune only when graph size or multi-client concurrency requires it.",
    evidence: {
      source: "Graph Version Store",
      span: "Snapshot v1.4.2: 5 nodes, 4 edges, commit hash 9a8c1f",
      timestamp: "2026-11-19T08:30:00Z",
      authority: "Committed State",
      freshness: "Immutable",
      conflict: "0",
    },
    substeps: [
      ["Nodes & properties", "Store typed nodes with key-value property bags and labels."],
      ["Directed edges", "Index forward and reverse adjacency lists for O(1) step traversal."],
      ["Graph versioning", "Create immutable snapshots (v1.0 -> v1.1) for rollback readiness."],
      ["Storage choices", "Compare in-memory, SQLite, Property Graphs (Neo4j), and RDF."],
    ],
    quiz: {
      question: "Why is it recommended to start with an in-memory or SQLite graph before deploying Neo4j?",
      options: [
        "Because Neo4j cannot store relationships.",
        "To master the data model, traversals, and schemas without distributed database complexity.",
        "Because SQLite is faster than all specialized graph engines in every benchmark.",
      ],
      correctIndex: 1,
      explanation:
        "Exactly! Mastering the domain schema, graph traversals, and citation mechanics in Python standard library code ensures the design remains modular and testable.",
    },
    visibleNodes: ["team:payments", "service:checkout", "tech:postgresql", "person:asha"],
    visibleEdges: ["owns", "uses", "works"],
    activePath: [],
    packetPos: { x: 50, y: 47, label: "SNAPSHOT" },
    metrics: { recall: "—", unsupported: "—", citation: "—", faithfulness: "—", coverage: "—", latency: "31ms", cost: "$0.0001" },
  },
  {
    id: "querying",
    folderIndex: 3,
    file: "08_querying.kg",
    label: "Querying",
    short: "Query",
    kicker: "Milestone 4 · Retrieval & Reasoning",
    title: "Querying: multi-hop graph traversal with access control",
    hint: "Follow directed edges to extract evidence subgraphs",
    lead: "User questions are parsed into target entities, relationship constraints, and traversal depth, retrieving a compact evidence subgraph while enforcing role-based permissions.",
    explanation:
      "When a user asks: 'Who owns Checkout and what database does it use?', the query engine parses the intent: Entity = service:checkout; Step 1 = follow incoming OWNS edge (-> Payments Team); Step 2 = follow outgoing USES edge (-> PostgreSQL). Traversal checks authorization boundaries and freshness filters before returning the exact evidence path.",
    code: `# Intent parsing & traversal:\nquery = parse_intent("Who owns Checkout and what does it use?")\n# query -> target: service:checkout, hops: [<-OWNS, -USES->]\n\nsubgraph = graph.traverse(\n    start="service:checkout",\n    incoming=["OWNS"],\n    outgoing=["USES"],\n    max_depth=2,\n    user_role="engineer"  # RBAC check\n)`,
    codeLang: "PYTHON",
    codeFilename: "querying.py",
    failure:
      "Unbounded graph traversals without depth limits or cycle detection cause infinite loops and memory exhaustion on circular dependencies.",
    scale:
      "Production query engines set strict depth caps (typically 2-3 hops), index edge types with bitmap filters, and apply row/edge-level security (RLS).",
    evidence: {
      source: "Graph Traversal Engine",
      span: "Path: Payments <-[OWNS]- Checkout -[USES]-> PostgreSQL",
      timestamp: "2026-11-19T08:35:00Z",
      authority: "RBAC Approved",
      freshness: "Verified",
      conflict: "0",
    },
    substeps: [
      ["Intent parsing", "Translate natural language questions into formal graph queries."],
      ["Graph traversal", "Follow named, directed edges rather than relying on keyword similarity."],
      ["Access control", "Filter edges and nodes according to the user's RBAC role."],
      ["Time & freshness", "Restrict traversal to facts valid within the target time range."],
    ],
    quiz: {
      question: "How does graph retrieval fundamentally differ from vector database similarity search?",
      options: [
        "Vector search only works on numbers, while graphs only store words.",
        "Vector search finds semantically similar text chunks, while graph traversal follows explicit, deterministic relationships.",
        "There is no difference; both perform identical searches.",
      ],
      correctIndex: 1,
      explanation:
        "Correct! Vector search matches text by approximate semantic similarity, which frequently returns irrelevant chunks. Knowledge graphs follow verifiable relationship paths with logical precision.",
    },
    visibleNodes: ["team:payments", "service:checkout", "tech:postgresql", "person:asha"],
    visibleEdges: ["owns", "uses", "works"],
    activePath: ["owns", "uses"],
    packetPos: { x: 50, y: 47, label: "QUERY" },
    metrics: { recall: "100%", unsupported: "0.0%", citation: "100%", faithfulness: "100%", coverage: "95.4%", latency: "38ms", cost: "$0.0002" },
  },
  {
    id: "evidence-answering",
    folderIndex: 3,
    file: "09_evidence_answering.kg",
    label: "Evidence answer",
    short: "Answer",
    kicker: "Milestone 4 · Retrieval & Reasoning",
    title: "Evidence answering: synthesized claims with verifiable citations",
    hint: "Every claim is backed by a graph citation; missing facts trigger safe refusals",
    lead: "The system generates natural language answers strictly grounded in the retrieved evidence subgraph, attaching clickable citations and safely refusing when evidence is absent.",
    explanation:
      "The assistant synthesizes: 'Checkout is owned by the Payments team [1] and uses PostgreSQL [2].' If asked: 'Does Checkout use Redis?', the engine scans the retrieved subgraph, finds no supporting USES edge, and activates its safe refusal guardrail: 'I do not have evidence in the knowledge graph that Checkout uses Redis.'",
    code: `answer = synthesize_answer(\n    question="Who owns Checkout and what does it use?",\n    subgraph=retrieved_subgraph,\n    strict_mode=True\n)\n# Output: "Checkout is owned by the Payments team [1] \n#          and uses PostgreSQL as its primary database [2]."\n# Citations:\n# [1] catalog.json (observed 2026-11-19)\n# [2] inventory.json (observed 2026-11-19)`,
    codeLang: "PYTHON",
    codeFilename: "answering.py",
    failure:
      "Allowing an LLM to guess or fabricate facts when graph paths are missing results in dangerous hallucinations presented with false confidence.",
    scale:
      "Enterprise QA assistants inject retrieved graph triples directly into the model context with strict refusal system prompts, rejecting answers failing NLI entailment checks.",
    evidence: {
      source: "catalog.json [1] · inventory.json [2]",
      span: "Full grounding: 2 claims synthesized, 2 citations verified",
      timestamp: "2026-11-19T08:40:00Z",
      authority: "Fully Verified",
      freshness: "Fresh",
      conflict: "0",
    },
    substeps: [
      ["Claim synthesis", "Generate clear sentences strictly bounded by retrieved graph facts."],
      ["Citation generation", "Attach explicit [1], [2] citations pointing to source files & spans."],
      ["Safe refusal guardrail", "Say 'I don't know' when facts are missing rather than hallucinating."],
      ["Faithfulness check", "Verify that every claim mathematically entails from evidence."],
    ],
    quiz: {
      question: "If a user asks 'Does Checkout use Redis?' and no supporting edge exists in the graph, what should happen?",
      options: [
        "The model should assume yes because Redis is popular.",
        "The system should safely refuse and state that no evidence exists in the knowledge graph.",
        "The system should invent a runbook citation.",
      ],
      correctIndex: 1,
      explanation:
        "Spot on! Safe refusal is a foundational requirement of enterprise AI. Saying 'I don't know' builds trust, whereas hallucinating creates production outages.",
    },
    visibleNodes: ["team:payments", "service:checkout", "tech:postgresql", "person:asha"],
    visibleEdges: ["owns", "uses", "works"],
    activePath: ["owns", "uses"],
    packetPos: { x: 50, y: 72, label: "ANSWER" },
    metrics: { recall: "100%", unsupported: "0.0%", citation: "100%", faithfulness: "100%", coverage: "95.4%", latency: "42ms", cost: "$0.0003" },
  },
  {
    id: "conflict-handling",
    folderIndex: 3,
    file: "10_conflict_handling.kg",
    label: "Conflict handling",
    short: "Conflicts",
    kicker: "Milestone 4 · Retrieval & Reasoning",
    title: "Conflict handling: resolving competing sources with authority & freshness",
    hint: "Compare contradictory claims instead of silently overwriting",
    lead: "When two sources disagree about a fact, the system evaluates source authority, freshness decay, and human review instead of silently picking an arbitrary winner.",
    explanation:
      "Consider a real production scenario: 'catalog.json' asserts Payments owns Checkout (Authority: 0.95, Age: 2 hours), while a legacy 'runbook-2024.md' asserts Core Platform owns Checkout (Authority: 0.40, Age: 180 days). The conflict engine compares authority and freshness, selecting the catalog while logging an auditable conflict note. If two sources have equal authority, it escalates to human review.",
    code: `conflicts = detect_conflicts(graph, entity="service:checkout", predicate="OWNS")\n# Source A: Payments Team (catalog.json | Auth: 0.95 | Fresh: 2h) -> WINNER\n# Source B: Core Platform (runbook.md  | Auth: 0.40 | Age: 180d) -> STALE\n\nif abs(source_a.authority - source_b.authority) < 0.10:\n    flag_for_human_review(conflicts, urgency="HIGH")\nelse:\n    resolve_with_audit_trail(winner=source_a, superseded=source_b)`,
    codeLang: "PYTHON",
    codeFilename: "conflicts.py",
    failure:
      "Silently overwriting facts with whatever document was ingested last ('last-write-wins') allows stale or unauthorized files to corrupt production data.",
    scale:
      "Production knowledge graphs maintain a multi-tenant conflict resolution dashboard where engineering leads review disputed ownership and approve canonical claims.",
    evidence: {
      source: "catalog.json (Winner) vs runbook.md (Stale)",
      span: "Resolved: Payments Team (Auth: 0.95 vs 0.40, Fresh vs 180d)",
      timestamp: "2026-11-19T08:45:00Z",
      authority: "Authority + Freshness Matrix",
      freshness: "Evaluated",
      conflict: "1 Resolved / 0 Unresolved",
    },
    substeps: [
      ["Conflicting claims", "Detect competing values for single-valued predicates like OWNS."],
      ["Source authority", "Compare publisher credibility (Official catalog vs scratch wiki)."],
      ["Freshness comparison", "Evaluate timestamp age and staleness half-life."],
      ["Human escalation", "Halt and alert human reviewers when authority is tied."],
    ],
    quiz: {
      question: "Why is 'last-write-wins' dangerous for knowledge graph ingestion?",
      options: [
        "It uses too much memory.",
        "An old, stale file ingested today will overwrite the correct, authoritative fact.",
        "It only works with SQL databases.",
      ],
      correctIndex: 1,
      explanation:
        "Exactly right! If a developer re-indexes an archived 2024 wiki today, 'last-write-wins' would overwrite fresh 2026 facts. Provenance, authority, and timestamps prevent this disaster.",
    },
    visibleNodes: ["team:payments", "service:checkout"],
    visibleEdges: ["owns"],
    activePath: ["owns"],
    packetPos: { x: 30, y: 47, label: "CONFLICT" },
    metrics: { recall: "100%", unsupported: "0.0%", citation: "100%", faithfulness: "100%", coverage: "95.4%", latency: "45ms", cost: "$0.0003" },
  },
  {
    id: "evaluation",
    folderIndex: 4,
    file: "11_evaluation.kg",
    label: "Evaluation",
    short: "Evaluate",
    kicker: "Milestone 5 · Evaluation & Quality",
    title: "Evaluation: continuous quality benchmarking on gold datasets",
    hint: "Measure recall, hallucination rate, citation precision, latency & cost",
    lead: "Production readiness requires continuous evaluation against curated gold datasets, measuring retrieval recall, unsupported claims, citation accuracy, latency, and cost.",
    explanation:
      "A plausible-sounding answer is not necessarily correct. Evaluation runs continuous test suites against gold benchmark questions with known entities and sources. We measure: (1) Did retrieval find all required facts? (Recall = 1.0); (2) Did the answer add ungrounded claims? (Unsupported Rate = 0.0); (3) Do citations point to legitimate evidence? (Citation Precision = 1.0).",
    code: `# Gold benchmark evaluation test:\ndef test_checkout_ownership_evaluation():\n    eval_result = run_evaluation(gold_dataset="data/evaluation.json")\n    assert eval_result.retrieval_recall == 1.0\n    assert eval_result.unsupported_claim_rate == 0.0\n    assert eval_result.citation_precision == 1.0\n    assert eval_result.p95_latency_ms < 50\n    assert eval_result.cost_per_query < 0.001`,
    codeLang: "PYTHON",
    codeFilename: "evaluation.py",
    failure:
      "Evaluating only on plain language readability without checking citation precision and unsupported claims allows hallucinations to pass into production.",
    scale:
      "CI/CD pipelines run automated regression benchmarks on every schema change, blocking releases if unsupported-claim rate rises above 0.0% or recall drops.",
    evidence: {
      source: "data/evaluation.json",
      span: "Gold Set: 50 benchmark cases evaluated · 100% verified",
      timestamp: "2026-11-19T08:50:00Z",
      authority: "1.00 (Gold Standard)",
      freshness: "Continuous CI",
      conflict: "0",
    },
    substeps: [
      ["Retrieval recall", "Verify that every gold fact needed was retrieved (100%)."],
      ["Unsupported claims", "Verify zero fabricated or ungrounded assertions (0.0%)."],
      ["Citation precision", "Verify that all citations directly back their stated claim (100%)."],
      ["Answer faithfulness", "Verify logical entailment from evidence subgraph (100%)."],
      ["Query coverage", "Measure percentage of organization questions answerable (95.4%)."],
      ["Latency & cost", "Maintain p95 response time < 50ms and cost < $0.0004 per query."],
    ],
    quiz: {
      question: "Can an answer have 100% retrieval recall but still fail an evaluation test?",
      options: [
        "No, 100% recall guarantees complete perfection.",
        "Yes, if the language model hallucinates extra unsupported claims not present in the evidence.",
        "No, evaluation only measures recall.",
      ],
      correctIndex: 1,
      explanation:
        "Spot on! Perfect recall means all needed facts were retrieved, but the synthesis model could still hallucinate additional ungrounded claims. Both recall and unsupported-claim rate must be tested.",
    },
    visibleNodes: ["team:payments", "service:checkout", "tech:postgresql", "person:asha", "incident:inc-842"],
    visibleEdges: ["owns", "uses", "works", "affected"],
    activePath: ["owns", "uses", "works", "affected"],
    packetPos: { x: 50, y: 47, label: "EVALUATED" },
    metrics: { recall: "100%", unsupported: "0.0%", citation: "100%", faithfulness: "100%", coverage: "95.4%", latency: "38ms", cost: "$0.0003" },
  },
];

// 3. Explorer Folders Hierarchy (VS Code IDE Style)
const folderHierarchy = [
  {
    name: "01 · Foundations",
    icon: "📂",
    badge: "1",
    stageIndices: [0],
  },
  {
    name: "02 · Ingestion & Extraction",
    icon: "📁",
    badge: "5",
    stageIndices: [1, 2, 3, 4, 5],
  },
  {
    name: "03 · Graph Storage",
    icon: "🗄️",
    badge: "1",
    stageIndices: [6],
  },
  {
    name: "04 · Retrieval & Reasoning",
    icon: "🔎",
    badge: "3",
    stageIndices: [7, 8, 9],
  },
  {
    name: "05 · Evaluation & Quality",
    icon: "📊",
    badge: "1",
    stageIndices: [10],
  },
];

// 4. Application State
const state = {
  currentStageIndex: 0,
  currentSubstepIndex: 0,
  openFolders: new Set([0]),
  selectedMetricKey: "recall",
  sidebarOpen: false,
  isDark: false,
};

// Helper: Selector shorthand
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// 5. Stage & Substep Overlay HTML Renderers
function renderStageOverlay(stage, substepIndex = state.currentSubstepIndex) {
  const overlay = $("#stage-overlay");
  overlay.innerHTML = "";

  switch (stage.id) {
    case "data-sources":
      if (substepIndex === 0) {
        // Substep 0: Unstructured Docs Scanner
        overlay.innerHTML = `
          <div class="md-runbook-card">
            <div class="md-header">
              <span>📄 checkout-runbook.md</span>
              <span class="md-badge">UNSTRUCTURED DOC</span>
            </div>
            <div class="md-content">
              <div class="scan-laser-line"></div>
              <p style="margin:0 0 4px 0; color:var(--muted)"># Architecture Runbook</p>
              <p style="margin:0 0 4px 0;" class="md-line-active">“The Payments team owns the Checkout service.”</p>
              <p style="margin:0; color:var(--muted)">Persistence layer is backed by primary PostgreSQL database.</p>
            </div>
            <div class="extracted-tokens-row">
              <span style="font-weight:800; color:var(--muted)">EXTRACTED TOKENS →</span>
              <span class="token-pill">Payments team</span>
              <span class="token-pill">owns</span>
              <span class="token-pill">Checkout service</span>
            </div>
          </div>
        `;
      } else if (substepIndex === 1) {
        // Substep 1: Structured JSON Data Tree
        overlay.innerHTML = `
          <div class="json-tree-card">
            <div class="json-header">
              <span>{ } service-catalog.json</span>
              <span style="font-size:8.5px; background:rgba(255,255,255,0.15); padding:1px 5px; border-radius:3px;">STRUCTURED REGISTRY</span>
            </div>
            <div class="json-body">
              <div>{</div>
              <div style="padding-left:14px;"><span class="json-k">"service"</span>: <span class="json-v">"checkout"</span>, <span class="json-val-check">✓ STRING [VALID]</span></div>
              <div style="padding-left:14px;"><span class="json-k">"owner_team"</span>: <span class="json-v">"payments"</span>, <span class="json-val-check">✓ FK -> team:payments</span></div>
              <div style="padding-left:14px;"><span class="json-k">"tier"</span>: <span class="json-v">1</span>, <span class="json-val-check">✓ INT [CRITICAL TIER]</span></div>
              <div style="padding-left:14px;"><span class="json-k">"db"</span>: <span class="json-v">"postgresql"</span> <span class="json-val-check">✓ DEP -> tech:postgresql</span></div>
              <div>}</div>
            </div>
          </div>
        `;
      } else if (substepIndex === 2) {
        // Substep 2: Incident Telemetry Terminal
        overlay.innerHTML = `
          <div class="incident-terminal-card">
            <div class="terminal-header">
              <span>⬛ incident-stream.log [REAL-TIME TELEMETRY]</span>
              <span class="p1-beacon-pill">🚨 P1 CRITICAL</span>
            </div>
            <div class="terminal-logs-body">
              <div class="log-entry-red">[14:22:01 UTC] [ALERT] INC-842: Checkout p99 latency spiked > 4200ms</div>
              <div class="log-entry-yellow">[14:22:18 UTC] [DIAG] Root Cause: PostgreSQL connection pool exhausted</div>
              <div class="log-entry-green">[14:22:45 UTC] [DISPATCH] PagerDuty alert sent to Payments On-Call (Asha Patel) <span class="blinking-cursor"></span></div>
            </div>
          </div>
        `;
      } else {
        // Substep 3: Cryptographic Provenance Attacher
        overlay.innerHTML = `
          <div class="crypto-meta-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <strong style="font-size:11px; color:var(--ink);">SOURCE METADATA & PROVENANCE SEAL</strong>
              <span class="tamper-proof-seal">VERIFIED & SIGNED ✓</span>
            </div>
            <div class="crypto-row">
              <span>Target Source:</span>
              <strong>doc:service-catalog-2026.json</strong>
            </div>
            <div class="crypto-row">
              <span>Content SHA-256:</span>
              <span class="hash-spinner">e3b0c44298fc1c149afbf4c8...</span>
            </div>
            <div class="crypto-row">
              <span>Access Permissions:</span>
              <strong style="color:var(--green-3)">RBAC [read: eng, write: lead]</strong>
            </div>
            <div class="crypto-row">
              <span>Observation Age:</span>
              <span>2026-11-19T08:00Z · <strong>Fresh (TTL: 30d)</strong></span>
            </div>
          </div>
        `;
      }
      break;

    case "extraction":
      if (substepIndex === 0) {
        // Substep 0: Named Entity Recognition
        overlay.innerHTML = `
          <div class="extraction-scanner">
            <div class="scanner-label">Entity Detection Scanner</div>
            <div class="scanner-text">
              “The <span class="hl-entity"><span class="target-bracket">[</span> Payments team <span class="target-bracket">]</span></span> owns the <span class="hl-entity"><span class="target-bracket">[</span> Checkout service <span class="target-bracket">]</span></span>.”
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:10.5px;">
              <span>Entity 1: <strong>Payments (Team)</strong></span>
              <span>Entity 2: <strong>Checkout (Service)</strong></span>
              <span style="color:var(--green-3); font-weight:800;">✓ Typed Mentions Found</span>
            </div>
          </div>
        `;
      } else if (substepIndex === 1) {
        // Substep 1: Relationship Predicate
        overlay.innerHTML = `
          <div class="extraction-scanner">
            <div class="scanner-label">Predicate / Relation Extraction</div>
            <div class="scanner-text">
              Payments team <span class="hl-rel">--[ OWNS ]--></span> Checkout service
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:10.5px;">
              <span>Directed Verb: <strong>OWNS</strong></span>
              <span>Domain: <strong>Team</strong></span>
              <span>Range: <strong>Service</strong></span>
              <span style="color:var(--green-3); font-weight:800;">✓ Predicate Mapped</span>
            </div>
          </div>
        `;
      } else if (substepIndex === 2) {
        // Substep 2: Source Span
        overlay.innerHTML = `
          <div class="extraction-scanner">
            <div class="scanner-label">Source Character Span Grounding</div>
            <div class="scanner-text">
              “The <span class="hl-entity">Payments team owns the Checkout service</span>.”
            </div>
            <div class="offset-ruler-tape">
              <span>Char Start: <strong>4</strong></span>
              <span>Char End: <strong>43</strong></span>
              <span>Exact Byte Offset: <strong>0x04..0x2B</strong></span>
              <span style="color:var(--green-3); font-weight:800;">✓ Auditable Span Pinned</span>
            </div>
          </div>
        `;
      } else {
        // Substep 3: Confidence Scoring
        overlay.innerHTML = `
          <div class="extraction-scanner">
            <div class="scanner-label">Extraction Quality & Confidence Meter</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px;">
              <div style="background:var(--sheet); padding:6px 8px; border-radius:4px; border:1px solid var(--line);">
                <div style="font-size:9.5px; color:var(--muted)">Rule-based Extractor:</div>
                <div style="font-size:14px; font-weight:800; color:var(--green-3)">0.98 (High Confidence)</div>
              </div>
              <div style="background:var(--sheet); padding:6px 8px; border-radius:4px; border:1px solid var(--line);">
                <div style="font-size:9.5px; color:var(--muted)">Zero-shot LLM Parser:</div>
                <div style="font-size:14px; font-weight:800; color:var(--amber-strong)">0.85 (Needs Review)</div>
              </div>
            </div>
          </div>
        `;
      }
      break;

    case "entity-linking":
      if (substepIndex === 0) {
        // Substep 0: Aliases
        overlay.innerHTML = `
          <div class="linking-overlay">
            <div style="font-size:9.5px; font-weight:800; color:var(--muted); text-transform:uppercase;">Mention Aliases Normalization</div>
            <div class="alias-pills-row">
              <span class="alias-pill">“Checkout API”</span>
              <span class="alias-pill">“checkout-service”</span>
              <span class="alias-pill">“chk-v2”</span>
              <span class="alias-pill">“Checkout”</span>
            </div>
            <div style="font-size:9.5px; color:var(--muted); margin-top:4px;">
              Magnetic convergence: 4 distinct spellings -> 1 real entity.
            </div>
          </div>
        `;
      } else if (substepIndex === 1) {
        // Substep 1: Canonical ID
        overlay.innerHTML = `
          <div class="linking-overlay">
            <div style="font-size:9.5px; font-weight:800; color:var(--muted); text-transform:uppercase;">Canonical Resolution Gateway</div>
            <div class="canonical-target-tag">
              <span>↳ Target URN:</span>
              <strong>urn:acme:service:checkout</strong>
            </div>
            <div style="font-size:9.5px; color:var(--muted); margin-top:4px;">
              Node created once with stable URI. Foreign references bind here.
            </div>
          </div>
        `;
      } else if (substepIndex === 2) {
        // Substep 2: Ambiguity Collision
        overlay.innerHTML = `
          <div class="linking-overlay">
            <div style="font-size:9.5px; font-weight:800; color:var(--rust); text-transform:uppercase;">⚠️ Polysemous Ambiguity Alert</div>
            <div class="ambiguity-banner">
              Mention <strong>“Atlas”</strong> found in 2 contexts:<br>
              • Branch A: <em>MongoDB Atlas (Database)</em><br>
              • Branch B: <em>Project Atlas (Internal Workflow)</em><br>
              Automated linking suspended to prevent corruption!
            </div>
          </div>
        `;
      } else {
        // Substep 3: Human Review Queue
        overlay.innerHTML = `
          <div class="linking-overlay">
            <div style="font-size:9.5px; font-weight:800; color:var(--muted); text-transform:uppercase;">Human Review Escalation Queue</div>
            <div style="padding:6px; background:var(--card-2); border-radius:4px; margin-top:4px; font-size:10px;">
              <strong>Ticket #4812:</strong> Disambiguate 'Atlas' mention<br>
              Confidence: <strong>0.72 (< 0.85 threshold)</strong><br>
              Routed to: <strong>Payments Domain Steward</strong>
            </div>
          </div>
        `;
      }
      break;

    case "validation":
      if (substepIndex === 0) {
        // Substep 0: Schema Rules
        overlay.innerHTML = `
          <div class="validation-gate">
            <div style="font-size:9.5px; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:4px;">Schema Shape Checker</div>
            <div class="rule-check-item">
              <span>(Team) -[OWNS]-> (Service)</span>
              <span class="rule-ok">✓ ALLOWED IN SCHEMA</span>
            </div>
            <div class="rule-check-item">
              <span>(Service) -[USES]-> (Technology)</span>
              <span class="rule-ok">✓ ALLOWED IN SCHEMA</span>
            </div>
          </div>
        `;
      } else if (substepIndex === 1) {
        // Substep 1: Required Fields
        overlay.innerHTML = `
          <div class="validation-gate">
            <div style="font-size:9.5px; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:4px;">Required Fields Checklist</div>
            <div class="rule-check-item"><span>Subject ID present</span><span class="rule-ok">✓</span></div>
            <div class="rule-check-item"><span>Predicate typed</span><span class="rule-ok">✓</span></div>
            <div class="rule-check-item"><span>Object ID present</span><span class="rule-ok">✓</span></div>
            <div class="rule-check-item"><span>Source Doc URI pinned</span><span class="rule-ok">✓</span></div>
            <div class="rule-check-item"><span>Timestamp ISO 8601</span><span class="rule-ok">✓</span></div>
          </div>
        `;
      } else if (substepIndex === 2) {
        // Substep 2: Type Constraints Violation
        overlay.innerHTML = `
          <div class="validation-gate">
            <div style="font-size:9.5px; font-weight:800; color:var(--rust); text-transform:uppercase; margin-bottom:4px;">Type Constraint Violation</div>
            <div class="rule-check-item">
              <span>(Tech: PostgreSQL) -[OWNS]-> (Person: Asha)</span>
              <span class="rule-bad">✗ REJECTED</span>
            </div>
            <div style="font-size:9.5px; color:var(--muted); margin-top:4px;">
              Reason: Technology cannot be the subject of predicate 'OWNS'.
            </div>
          </div>
        `;
      } else {
        // Substep 3: Error Queue (DLQ)
        overlay.innerHTML = `
          <div class="validation-gate">
            <div style="font-size:9.5px; font-weight:800; color:var(--rust); text-transform:uppercase; margin-bottom:4px;">Dead-Letter Queue (DLQ)</div>
            <div class="dlq-box">
              🚨 <strong>Diverted to DLQ:</strong><br>
              <code>PostgreSQL --OWNS--> Asha</code><br>
              Status: Held in SQS dead-letter buffer for engineer audit.
            </div>
          </div>
        `;
      }
      break;

    case "deduplication":
      if (substepIndex === 0) {
        overlay.innerHTML = `
          <div class="dedup-card">
            <span>Deterministic Fact Key:</span>
            <div style="font-size:12px; margin-top:4px; font-family:var(--font)">SHA256("team:payments" + "OWNS" + "service:checkout")</div>
          </div>
        `;
      } else if (substepIndex === 1) {
        overlay.innerHTML = `
          <div class="dedup-card">
            <span>Idempotency Barrier:</span>
            <div style="font-size:10px; margin-top:4px;">2 incoming identical claims -> 1 graph edge write (Zero duplicate nodes)</div>
          </div>
        `;
      } else if (substepIndex === 2) {
        overlay.innerHTML = `
          <div class="dedup-card">
            <span>✓ Multi-Source Evidence Accumulation:</span>
            <div style="font-size:11px; margin-top:4px;"><strong>2 Verified Sources</strong> (catalog.json + checkout-runbook.md)</div>
          </div>
        `;
      } else {
        overlay.innerHTML = `
          <div class="dedup-card">
            <span>Merge Audit History:</span>
            <div style="font-size:10px; margin-top:4px;">Catalog ingested 08:00 UTC · Runbook merged 08:25 UTC</div>
          </div>
        `;
      }
      break;

    case "provenance":
      if (substepIndex === 0) {
        overlay.innerHTML = `
          <div class="provenance-card">
            <strong style="font-size:11px; color:var(--ink);">SOURCE AUTHORITY COMPARISON SCALE</strong>
            <div class="prov-grid" style="grid-template-columns:repeat(3, 1fr); margin-top:6px;">
              <div class="prov-item"><strong>Official Catalog</strong><span style="color:var(--green-3)">0.95 Tier 1</span></div>
              <div class="prov-item"><strong>Team Wiki</strong><span style="color:var(--amber-strong)">0.60 Tier 2</span></div>
              <div class="prov-item"><strong>Slack Chat</strong><span style="color:var(--rust)">0.35 Tier 3</span></div>
            </div>
          </div>
        `;
      } else if (substepIndex === 1) {
        overlay.innerHTML = `
          <div class="provenance-card">
            <strong style="font-size:11px; color:var(--ink);">FRESHNESS MONITOR & TIME-TO-LIVE (TTL)</strong>
            <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:10.5px;">
              <span>Fact Age: <strong>2 hours</strong></span>
              <span>TTL Half-Life: <strong>30 days</strong></span>
              <span style="color:var(--green-3); font-weight:800;">● FRESH (100% Weight)</span>
            </div>
          </div>
        `;
      } else if (substepIndex === 2) {
        overlay.innerHTML = `
          <div class="provenance-card">
            <strong style="font-size:11px; color:var(--ink);">CRYPTOGRAPHIC AUDIT PROOF</strong>
            <div style="font-size:10px; margin-top:6px; font-family:var(--font)">
              Source SHA-256: <code>e3b0c44298fc1c149afbf4c8996fb92427ae41e4</code><br>
              Timestamp: 2026-11-19T08:00:00Z · Signature: <strong>MATCHED ✓</strong>
            </div>
          </div>
        `;
      } else {
        overlay.innerHTML = `
          <div class="provenance-card">
            <strong style="font-size:11px; color:var(--ink);">COMPOSITE CONFIDENCE CALCULATION</strong>
            <div style="font-size:10.5px; margin-top:6px;">
              Score = Extractor (0.98) × Authority (0.95) × Freshness (1.0) = <strong>0.93 Composite</strong>
            </div>
          </div>
        `;
      }
      break;

    case "graph-storage":
      if (substepIndex === 0) {
        overlay.innerHTML = `
          <div class="snapshot-banner">
            <span>Property Bag: <strong>Checkout</strong> [tier=1, lang=Go, repo=acme/checkout]</span>
          </div>
        `;
      } else if (substepIndex === 1) {
        overlay.innerHTML = `
          <div class="snapshot-banner">
            <span>Adjacency Lists: <strong>Checkout</strong> [In: OWNS(Payments), Out: USES(PostgreSQL)]</span>
          </div>
        `;
      } else if (substepIndex === 2) {
        overlay.innerHTML = `
          <div class="snapshot-banner">
            <span>SNAPSHOT: <strong>v1.4.2 [COMMITTED]</strong> · Rollback Target: <strong>v1.4.1</strong></span>
          </div>
        `;
      } else {
        overlay.innerHTML = `
          <div class="snapshot-banner">
            <span>Storage Engine: <strong>In-Memory LPG / SQLite</strong> · Interchangeable Interface</span>
          </div>
        `;
      }
      break;

    case "querying":
      if (substepIndex === 0) {
        overlay.innerHTML = `
          <div class="query-intent-card">
            <div style="font-size:9px; font-weight:800; color:var(--blue-strong); text-transform:uppercase;">Natural Language Intent Parser</div>
            <div style="font-size:11px; font-weight:700; color:var(--ink); margin:2px 0;">Q: “Who owns Checkout and what does it use?”</div>
            <div style="font-size:9.5px; color:var(--muted)">Target: <strong>service:checkout</strong> | Traverse: <strong><-OWNS-, -USES-></strong></div>
          </div>
        `;
      } else if (substepIndex === 1) {
        overlay.innerHTML = `
          <div class="query-intent-card">
            <div style="font-size:9px; font-weight:800; color:var(--blue-strong); text-transform:uppercase;">Multi-Hop Graph Traversal</div>
            <div style="font-size:11px; font-weight:700; color:var(--green-3); margin:2px 0;">Hop 1: Payments <-[OWNS]- Checkout</div>
            <div style="font-size:11px; font-weight:700; color:var(--green-3); margin:2px 0;">Hop 2: Checkout -[USES]-> PostgreSQL</div>
          </div>
        `;
      } else if (substepIndex === 2) {
        overlay.innerHTML = `
          <div class="query-intent-card">
            <div style="font-size:9px; font-weight:800; color:var(--green-3); text-transform:uppercase;">RBAC Access Control Gate</div>
            <div style="font-size:11px; font-weight:700; color:var(--ink); margin:2px 0;">User Role: <strong>engineer</strong></div>
            <div style="font-size:9.5px; color:var(--green-3); font-weight:800;">✓ Access Permitted to Service & Ownership Metadata</div>
          </div>
        `;
      } else {
        overlay.innerHTML = `
          <div class="query-intent-card">
            <div style="font-size:9px; font-weight:800; color:var(--blue-strong); text-transform:uppercase;">Temporal & Freshness Filter</div>
            <div style="font-size:11px; font-weight:700; color:var(--ink); margin:2px 0;">Filter Window: <strong>Last 6 Months</strong></div>
            <div style="font-size:9.5px; color:var(--muted)">Stale edges (> 180 days) excluded from answer subgraph.</div>
          </div>
        `;
      }
      break;

    case "evidence-answering":
      if (substepIndex === 0) {
        overlay.innerHTML = `
          <div class="answer-dialog">
            <div class="answer-head-row">
              <span class="answer-pill">GROUNDED SYNTHESIS</span>
              <span class="refusal-badge">Strictly Bound to Graph</span>
            </div>
            <p class="answer-text">
              “The Checkout service is owned by the <strong>Payments team</strong> <span class="cite-link">[1]</span> and uses <strong>PostgreSQL</strong> <span class="cite-link">[2]</span>.”
            </p>
          </div>
        `;
      } else if (substepIndex === 1) {
        overlay.innerHTML = `
          <div class="answer-dialog">
            <div class="answer-head-row">
              <span class="answer-pill">CITATIONS ANCHORED</span>
              <span class="refusal-badge">Audit Proof Attached</span>
            </div>
            <div style="font-size:10.5px; line-height:1.5;">
              <strong>[1]</strong> <code>catalog.json</code> (The Payments team owns the Checkout service)<br>
              <strong>[2]</strong> <code>inventory.json</code> (Checkout uses PostgreSQL)
            </div>
          </div>
        `;
      } else if (substepIndex === 2) {
        overlay.innerHTML = `
          <div class="answer-dialog" style="border-color:var(--rust)">
            <div class="answer-head-row">
              <span class="answer-pill" style="background:var(--rust-bg); color:var(--rust)">SAFE REFUSAL GUARDRAIL</span>
              <span style="color:var(--rust); font-weight:800; font-size:9px">PROMPT: “Does Checkout use Redis?”</span>
            </div>
            <p class="answer-text" style="color:var(--rust)">
              “I do not have supporting evidence in the knowledge graph that Checkout uses Redis.”
            </p>
          </div>
        `;
      } else {
        overlay.innerHTML = `
          <div class="answer-dialog">
            <div class="answer-head-row">
              <span class="answer-pill">NLI ENTAILMENT VERIFIED</span>
              <span class="refusal-badge">100% Entailment Score</span>
            </div>
            <div style="font-size:10.5px; color:var(--ink-2)">
              Every claim mathematically follows from the retrieved subgraph. Zero hallucinations.
            </div>
          </div>
        `;
      }
      break;

    case "conflict-handling":
      if (substepIndex === 0) {
        overlay.innerHTML = `
          <div class="conflict-matrix">
            <div class="conflict-col winner">
              <div class="conflict-head"><span>Claim A: Payments</span><span class="conflict-tag-win">T1 SOURCE</span></div>
              <div class="conflict-claim">Payments -[OWNS]-> Checkout</div>
              <div class="conflict-meta">Source: <strong>catalog.json</strong> · 2 hours old</div>
            </div>
            <div class="conflict-col stale">
              <div class="conflict-head"><span>Claim B: Core Platform</span><span class="conflict-tag-stale">T3 SOURCE</span></div>
              <div class="conflict-claim">Core -[OWNS]-> Checkout</div>
              <div class="conflict-meta">Source: <strong>wiki-2024.md</strong> · 180 days stale</div>
            </div>
          </div>
        `;
      } else if (substepIndex === 1) {
        overlay.innerHTML = `
          <div class="conflict-matrix">
            <div class="conflict-col winner">
              <div class="conflict-head"><span>Authority Evaluation</span><span class="conflict-tag-win">WINNER</span></div>
              <div class="conflict-claim">Official Service Catalog: <strong>0.95 Authority</strong></div>
              <div class="conflict-meta">Decisively supersedes informal wiki notes (0.40).</div>
            </div>
            <div class="conflict-col stale">
              <div class="conflict-head"><span>Low Authority</span><span class="conflict-tag-stale">DEFEATED</span></div>
              <div class="conflict-claim">Engineering Wiki: <strong>0.40 Authority</strong></div>
              <div class="conflict-meta">Marked as superseded in conflict ledger.</div>
            </div>
          </div>
        `;
      } else if (substepIndex === 2) {
        overlay.innerHTML = `
          <div class="conflict-matrix">
            <div class="conflict-col winner">
              <div class="conflict-head"><span>Freshness Showdown</span><span class="conflict-tag-win">ACTIVE</span></div>
              <div class="conflict-claim">Age: <strong>2 Hours</strong> (Active TTL)</div>
              <div class="conflict-meta">Matches current deployment state.</div>
            </div>
            <div class="conflict-col stale">
              <div class="conflict-head"><span>Expired TTL</span><span class="conflict-tag-stale">EXPIRED</span></div>
              <div class="conflict-claim">Age: <strong>180 Days</strong> (Stale)</div>
              <div class="conflict-meta">Staleness decay penalizes legacy assertions.</div>
            </div>
          </div>
        `;
      } else {
        overlay.innerHTML = `
          <div class="conflict-matrix">
            <div class="conflict-col" style="grid-column:1 / -1; border-color:var(--amber-strong)">
              <div class="conflict-head"><span>Human Review Escalation Trigger</span><span style="background:var(--amber); color:var(--amber-strong); padding:1px 6px; border-radius:3px; font-size:8.5px;">TIE-BREAK DISPATCH</span></div>
              <div class="conflict-claim">When two Tier 1 sources disagree with equal authority, automated writes freeze and generate a Review Ticket.</div>
            </div>
          </div>
        `;
      }
      break;

    case "evaluation":
      overlay.innerHTML = `
        <div class="eval-scorecard">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:11px; color:var(--ink);">CONTINUOUS EVALUATION BENCHMARK SUITE · SUBSTEP ${substepIndex + 1}</strong>
            <span style="font-size:9px; font-weight:800; color:var(--green-3);">100% PASSING</span>
          </div>
          <div class="eval-metrics-row">
            <div class="eval-stat-box" style="${substepIndex === 0 ? "border-color:var(--green-3); box-shadow:0 0 8px var(--green-glow)" : ""}"><strong>1.0</strong><span>Recall</span></div>
            <div class="eval-stat-box" style="${substepIndex === 1 ? "border-color:var(--green-3); box-shadow:0 0 8px var(--green-glow)" : ""}"><strong>0.0</strong><span>Unsupported</span></div>
            <div class="eval-stat-box" style="${substepIndex === 2 ? "border-color:var(--green-3); box-shadow:0 0 8px var(--green-glow)" : ""}"><strong>1.0</strong><span>Citation Prec</span></div>
            <div class="eval-stat-box" style="${substepIndex === 5 ? "border-color:var(--green-3); box-shadow:0 0 8px var(--green-glow)" : ""}"><strong>38ms</strong><span>P95 Latency</span></div>
          </div>
        </div>
      `;
      break;
  }
}

// 6. SVG Paths Renderer (Curves, Markers, Glows)
function renderSvgEdges(stage) {
  const group = $("#svg-paths-group");
  group.innerHTML = "";

  // Edge definitions connecting architectural nodes
  const edgeDefs = [
    {
      id: "owns",
      path: "M 220 220 L 325 220",
      label: "OWNS",
    },
    {
      id: "uses",
      path: "M 465 220 L 590 220",
      label: "USES",
    },
    {
      id: "works",
      path: "M 230 330 Q 180 300 160 255",
      label: "WORKS_AT",
    },
    {
      id: "affected",
      path: "M 515 115 Q 460 140 420 185",
      label: "AFFECTED",
    },
  ];

  edgeDefs.forEach((def) => {
    const isVisible = stage.visibleEdges.includes(def.id);
    const isActive = stage.activePath.includes(def.id);

    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", def.path);
    pathEl.classList.add("graph-edge");
    if (isVisible) pathEl.classList.add("visible");
    if (isActive) pathEl.classList.add("active-path");
    pathEl.setAttribute("marker-end", isActive ? "url(#arrow-highlight)" : "url(#arrow-default)");
    pathEl.dataset.edgeId = def.id;

    group.appendChild(pathEl);
  });
}

// 7. Render Topbar Pipeline Scrubber
function renderPipelineScrubber() {
  const nav = $("#pipeline-nav");
  nav.innerHTML = stages
    .map(
      (stage, index) => `
        <button class="pipe-chip ${index === state.currentStageIndex ? "active" : ""}" 
                data-pipeline-index="${index}" 
                type="button" 
                aria-label="Stage ${index + 1}: ${stage.label}">
          <span class="pipe-num">${String(index + 1).padStart(2, "0")}</span>
          <span>${stage.short}</span>
        </button>
      `
    )
    .join("");

  nav.querySelectorAll("[data-pipeline-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      goToStage(Number(btn.dataset.pipelineIndex));
    });
  });
}

// 8. Render IDE Explorer Sidebar Tree
function renderExplorerTree() {
  const tree = $("#file-tree");
  tree.innerHTML = folderHierarchy
    .map((folder, folderIdx) => {
      const isExpanded = state.openFolders.has(folderIdx);
      return `
        <div class="tree-folder ${isExpanded ? "expanded" : ""}" data-folder-idx="${folderIdx}">
          <button class="folder-row" type="button" aria-expanded="${isExpanded}">
            <span class="folder-caret">▶</span>
            <span class="folder-icon">${folder.icon}</span>
            <span class="folder-label">${folder.name}</span>
            <span class="folder-badge">${folder.badge}</span>
          </button>
          <div class="folder-children" role="group">
            ${folder.stageIndices
              .map((stgIdx) => {
                const stg = stages[stgIdx];
                const isActive = stgIdx === state.currentStageIndex;
                return `
                  <button class="tree-file ${isActive ? "active" : ""}" 
                          data-stage-index="${stgIdx}" 
                          type="button"
                          aria-selected="${isActive}">
                    <span class="file-icon">kg</span>
                    <span class="file-title">${stg.file}</span>
                    <span class="file-status">${isActive ? "●" : ""}</span>
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  // Attach folder toggle handlers
  tree.querySelectorAll(".folder-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const folderEl = btn.closest(".tree-folder");
      const idx = Number(folderEl.dataset.folderIdx);
      if (state.openFolders.has(idx)) {
        state.openFolders.delete(idx);
      } else {
        state.openFolders.add(idx);
      }
      renderExplorerTree();
    });
  });

  // Attach file click handlers
  tree.querySelectorAll(".tree-file").forEach((btn) => {
    btn.addEventListener("click", () => {
      goToStage(Number(btn.dataset.stageIndex));
    });
  });
}

// 9. Render Substeps Strip
function renderSubsteps(stage) {
  const strip = $("#substeps-strip");
  strip.innerHTML = stage.substeps
    .map(
      ([label], idx) => `
        <button class="substep-pill ${idx === state.currentSubstepIndex ? "active" : ""}" 
                data-substep-idx="${idx}" 
                type="button"
                role="tab"
                aria-selected="${idx === state.currentSubstepIndex}">
          <span class="substep-num">${idx + 1}</span>
          <span>${label}</span>
        </button>
      `
    )
    .join("");

  strip.querySelectorAll("[data-substep-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.currentSubstepIndex = Number(btn.dataset.substepIdx);
      updateSubstepDetails(stage);
      renderSubsteps(stage);
      renderStageOverlay(stage, state.currentSubstepIndex);
    });
  });

  updateSubstepDetails(stage);
}

function updateSubstepDetails(stage) {
  const currentSubstep = stage.substeps[state.currentSubstepIndex];
  if (!currentSubstep) return;

  $("#substep-detail-title").textContent = `Substep ${state.currentSubstepIndex + 1} · ${currentSubstep[0]}`;
  $("#substep-detail-text").textContent = currentSubstep[1];
}

// 10. Render Interactive Prediction Quiz
function renderPredictionQuiz(stage) {
  const quiz = stage.quiz;
  $("#quiz-question").textContent = quiz.question;
  $("#quiz-status").textContent = "Select an option";
  $("#quiz-status").style.color = "var(--muted)";

  const feedbackBox = $("#quiz-feedback");
  feedbackBox.className = "quiz-feedback";
  feedbackBox.style.display = "none";
  feedbackBox.textContent = "";

  const optionsContainer = $("#quiz-options");
  const letters = ["A", "B", "C"];

  optionsContainer.innerHTML = quiz.options
    .map(
      (opt, idx) => `
        <button class="quiz-option-btn" data-option-idx="${idx}" type="button">
          <span class="quiz-letter">${letters[idx]}</span>
          <span>${opt}</span>
        </button>
      `
    )
    .join("");

  optionsContainer.querySelectorAll(".quiz-option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedIdx = Number(btn.dataset.optionIdx);
      const isCorrect = selectedIdx === quiz.correctIndex;

      // Update button styles
      optionsContainer.querySelectorAll(".quiz-option-btn").forEach((b, bIdx) => {
        b.classList.remove("selected-correct", "selected-incorrect");
        if (bIdx === selectedIdx) {
          b.classList.add(isCorrect ? "selected-correct" : "selected-incorrect");
        }
      });

      // Update status and feedback
      if (isCorrect) {
        $("#quiz-status").textContent = "✓ Correct prediction!";
        $("#quiz-status").style.color = "var(--green-3)";
        feedbackBox.className = "quiz-feedback show-correct";
        feedbackBox.innerHTML = `<strong>Correct! 🎉</strong> ${quiz.explanation}`;
      } else {
        $("#quiz-status").textContent = "✗ Rethink this";
        $("#quiz-status").style.color = "var(--rust)";
        feedbackBox.className = "quiz-feedback show-incorrect";
        feedbackBox.innerHTML = `<strong>Not quite:</strong> ${quiz.explanation}`;
      }
    });
  });
}

// 11. Render Live Evaluation Metrics Scorecard
function renderMetrics(stage) {
  const grid = $("#metrics-grid");
  const metricKeys = ["recall", "unsupported", "citation", "faithfulness", "coverage", "latency"];

  grid.innerHTML = metricKeys
    .map((key) => {
      const val = stage.metrics[key] || "—";
      const isActive = state.selectedMetricKey === key;
      return `
        <div class="metric-tile ${isActive ? "active" : ""}" data-metric-key="${key}" role="button" tabindex="0">
          <span class="metric-value">${val}</span>
          <span class="metric-label">${key}</span>
        </div>
      `;
    })
    .join("");

  grid.querySelectorAll(".metric-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      state.selectedMetricKey = tile.dataset.metricKey;
      renderMetrics(stage);
      updateMetricExplainer();
    });
  });

  updateMetricExplainer();
}

function updateMetricExplainer() {
  const def = metricGlossary[state.selectedMetricKey];
  if (!def) return;
  $("#metric-explainer-name").textContent = `${def.name} · Target: ${def.target}`;
  $("#metric-explainer-desc").textContent = `${def.desc} Formula: ${def.formula}.`;
}

// 12. Main Render Function
function render() {
  const stage = stages[state.currentStageIndex];

  // Auto-expand folder containing current stage
  state.openFolders.add(stage.folderIndex);

  // Topbar
  $("#progress-chip").textContent = `Stage ${String(state.currentStageIndex + 1).padStart(2, "0")} / ${stages.length}`;

  // Stage Header
  $("#stage-kicker").textContent = stage.kicker;
  $("#stage-title").textContent = stage.title;
  $("#status-pill").textContent = stage.label;
  $("#canvas-hint").textContent = stage.hint;

  // Packet Animation Position
  const packet = $("#request-packet");
  packet.style.left = `${stage.packetPos.x}%`;
  packet.style.top = `${stage.packetPos.y}%`;
  $("#packet-text").textContent = stage.packetPos.label;

  // Nodes visibility and highlight states
  $$(".graph-node").forEach((node) => {
    const nodeId = node.dataset.nodeId;
    const isVisible = stage.visibleNodes.includes(nodeId);
    node.classList.toggle("visible", isVisible);
    node.classList.toggle("highlight", stage.activePath.length > 0 && isVisible);
  });

  // Edge labels visibility
  $("#tag-owns").classList.toggle("visible", stage.visibleEdges.includes("owns"));
  $("#tag-uses").classList.toggle("visible", stage.visibleEdges.includes("uses"));
  $("#tag-works").classList.toggle("visible", stage.visibleEdges.includes("works"));
  $("#tag-affected").classList.toggle("visible", stage.visibleEdges.includes("affected"));

  // Guide Rail Content
  $("#guide-stage-badge").textContent = `${String(state.currentStageIndex + 1).padStart(2, "0")} / ${stages.length}`;
  $("#guide-title").textContent = stage.label;
  $("#guide-lead").textContent = stage.lead;
  $("#guide-explanation").textContent = stage.explanation;

  // Code Snippet
  $("#snippet-lang").textContent = stage.codeLang;
  $("#snippet-filename").textContent = stage.codeFilename;
  $("#code-content").textContent = stage.code;

  // Failure Mode & Scale
  $("#failure-text").textContent = stage.failure;
  $("#scale-text").textContent = stage.scale;

  // Evidence Grid
  $("#evidence-grid").innerHTML = `
    <div class="evidence-cell"><strong>Source Doc</strong><span>${stage.evidence.source}</span></div>
    <div class="evidence-cell"><strong>Authority</strong><span>${stage.evidence.authority}</span></div>
    <div class="evidence-cell"><strong>Freshness</strong><span>${stage.evidence.freshness}</span></div>
    <div class="evidence-cell"><strong>Timestamp</strong><span>${stage.evidence.timestamp}</span></div>
  `;

  // Controls State
  $("#prev-btn").disabled = state.currentStageIndex === 0;
  $("#next-btn").disabled = state.currentStageIndex === stages.length - 1;
  $("#next-btn").querySelector("span:first-child").textContent =
    state.currentStageIndex === stages.length - 1 ? "Course complete ✓" : "Next stage";

  // Step dots
  $("#stage-dots").innerHTML = stages
    .map(
      (_, idx) =>
        `<span class="dot ${idx === state.currentStageIndex ? "active" : ""}" data-dot-idx="${idx}"></span>`
    )
    .join("");

  $("#stage-dots").querySelectorAll(".dot").forEach((dot) => {
    dot.addEventListener("click", () => goToStage(Number(dot.dataset.dotIdx)));
  });

  // Footer status bar
  $("#footer-status").textContent = `Stage ${state.currentStageIndex + 1}: ${stage.label} · ${stage.visibleNodes.length} Entities active · ${stage.visibleEdges.length} Edges verified`;

  // Dynamic overlays, SVGs, and interactive widgets
  renderStageOverlay(stage);
  renderSvgEdges(stage);
  renderPipelineScrubber();
  renderExplorerTree();
  renderSubsteps(stage);
  renderPredictionQuiz(stage);
  renderMetrics(stage);
}

// 13. Navigation Functions
function goToStage(index) {
  if (index < 0 || index >= stages.length) return;
  state.currentStageIndex = index;
  state.currentSubstepIndex = 0;
  render();

  // On mobile, close drawer if open
  if (state.sidebarOpen) {
    toggleSidebar(false);
  }
}

function nextStage() {
  if (state.currentStageIndex < stages.length - 1) {
    goToStage(state.currentStageIndex + 1);
  }
}

function prevStage() {
  if (state.currentStageIndex > 0) {
    goToStage(state.currentStageIndex - 1);
  }
}

function toggleSidebar(open) {
  state.sidebarOpen = typeof open === "boolean" ? open : !state.sidebarOpen;
  $("#explorer-sidebar").classList.toggle("open", state.sidebarOpen);
  $("#drawer-backdrop").classList.toggle("open", state.sidebarOpen);
  $("#menu-toggle").setAttribute("aria-expanded", String(state.sidebarOpen));
}

// 14. Event Listeners Setup
function initEventListeners() {
  // Navigation buttons
  $("#next-btn").addEventListener("click", nextStage);
  $("#prev-btn").addEventListener("click", prevStage);

  // Replay animation button
  $("#replay-anim-btn").addEventListener("click", () => {
    const packet = $("#request-packet");
    packet.style.transform = "scale(1.4)";
    setTimeout(() => {
      packet.style.transform = "scale(1)";
    }, 300);
    render();
  });

  // Node click inspection
  $$(".graph-node").forEach((node) => {
    node.addEventListener("click", () => {
      const name = node.querySelector(".node-name")?.textContent || "Entity";
      const meta = node.querySelector(".node-meta")?.textContent || "";
      $("#canvas-status").textContent = `Inspecting: ${name} (${meta})`;
      node.style.transform = "scale(1.08)";
      setTimeout(() => {
        node.style.transform = "";
      }, 250);
    });
  });

  // Collapse all folders in explorer
  $("#collapse-all-btn").addEventListener("click", () => {
    state.openFolders.clear();
    state.openFolders.add(stages[state.currentStageIndex].folderIndex);
    renderExplorerTree();
  });

  // Theme toggle
  $("#theme-toggle").addEventListener("click", () => {
    state.isDark = !state.isDark;
    document.documentElement.dataset.theme = state.isDark ? "dark" : "light";
    localStorage.setItem("kg-lab-theme", state.isDark ? "dark" : "light");
  });

  // Mobile menu toggle
  $("#menu-toggle").addEventListener("click", () => toggleSidebar());
  $("#drawer-backdrop").addEventListener("click", () => toggleSidebar(false));
  const drawerClose = $("#drawer-close-btn");
  if (drawerClose) {
    drawerClose.addEventListener("click", () => toggleSidebar(false));
  }

  // Copy code snippet
  $("#copy-snippet-btn").addEventListener("click", () => {
    const code = stages[state.currentStageIndex].code;
    navigator.clipboard.writeText(code).then(() => {
      const btn = $("#copy-snippet-btn");
      btn.textContent = "Copied! ✓";
      setTimeout(() => {
        btn.textContent = "Copy";
      }, 1800);
    });
  });

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    // Ignore key events when user is typing in an input
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

    if (e.key === "ArrowRight" || e.key.toLowerCase() === "j") {
      nextStage();
    } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "k") {
      prevStage();
    } else if (e.key.toLowerCase() === "t") {
      $("#theme-toggle").click();
    } else if (e.key.toLowerCase() === "m") {
      toggleSidebar();
    }
  });
}

// 15. Initial Bootstrapping
function init() {
  // Load saved theme
  const savedTheme = localStorage.getItem("kg-lab-theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    state.isDark = true;
    document.documentElement.dataset.theme = "dark";
  }

  initEventListeners();
  render();
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
