const stages = [
  {
    label: "Data sources",
    short: "Sources",
    title: "Everything starts outside the graph",
    kicker: "Stage 1 · Data sources",
    hint: "Documents and structured records enter",
    prediction: "Which systems might contain ownership information?",
    explanation:
      "A knowledge graph does not create facts from nowhere. It receives documents, JSON, CSV, APIs, tickets, and databases.",
    code: "engineering-catalog.json\nservice-inventory.json\nincident-2026-04.md",
    scale:
      "At production scale, ingest many sources with IDs, timestamps, access rules, and checksums so the same document is not processed twice.",
    evidence: "engineering-catalog.json · source document registered",
    substeps: [
      ["Documents", "Read wiki pages, tickets, incident reports, and runbooks."],
      ["Structured data", "Read JSON, CSV, SQL rows, and service-catalog APIs."],
      ["Metadata", "Keep source ID, author, timestamp, permissions, and version."],
    ],
    visibleNodes: [],
    visibleEdges: [],
    metrics: ["—", "—", "—"],
  },
  {
    label: "Extraction",
    short: "Extract",
    title: "Find entities and relationships",
    kicker: "Stage 2 · Extraction",
    hint: "Text becomes candidate facts",
    prediction: "Which words are entities, and which word is the relationship?",
    explanation:
      "Extraction identifies entities and relations in a source. The result is only a candidate fact until it is validated.",
    code:
      "Entity: Payments team\nEntity: Checkout service\nRelation: Payments --OWNS--> Checkout",
    scale:
      "Start with deterministic rules and typed output. Add an LLM only when it solves a measured extraction problem, and retain the original text span.",
    evidence: "engineering-catalog.json · source span preserved",
    substeps: [
      ["Entities", "Find names such as Payments, Checkout, PostgreSQL, and Incident-42."],
      ["Relations", "Find verbs such as OWNS, USES, DEPENDS_ON, and AFFECTED."],
      ["Source span", "Save the exact words that support the extracted fact."],
    ],
    visibleNodes: ["payments-team", "checkout"],
    visibleEdges: [],
    metrics: ["—", "—", "—"],
  },
  {
    label: "Entity linking",
    short: "Link",
    title: "Names become canonical IDs",
    kicker: "Stage 3 · Entity linking",
    hint: "Aliases point to one real entity",
    prediction: "Should “Checkout API” create a second node?",
    explanation:
      "Entity linking decides whether different mentions refer to the same real-world entity. This prevents duplicate nodes.",
    code:
      '"Checkout API" -> Service: checkout\n"Checkout service" -> Service: checkout',
    scale:
      "Use IDs and aliases for high-confidence matches. If Atlas could mean a database or project, stop and request human review.",
    evidence: "canonical ID: checkout · aliases retained",
    substeps: [
      ["Aliases", "Collect names, abbreviations, and old service names."],
      ["Canonical ID", "Map each accepted mention to one stable entity ID."],
      ["Human review", "Escalate unknown or ambiguous mentions instead of guessing."],
    ],
    visibleNodes: ["payments-team", "checkout"],
    visibleEdges: [],
    metrics: ["—", "—", "—"],
  },
  {
    label: "Validation",
    short: "Validate",
    title: "The schema checks the fact",
    kicker: "Stage 4 · Validation",
    hint: "Only allowed shapes continue",
    prediction: "Does Team --OWNS--> Service fit the schema?",
    explanation:
      "A schema is a rulebook. It checks node types, relationship direction, required fields, dates, and valid IDs.",
    code:
      "Allowed: Team --OWNS--> Service\nRejected: Technology --OWNS--> Person",
    scale:
      "Reject malformed records loudly and put them in an error queue. Never silently turn bad input into a believable graph fact.",
    evidence: "schema.py · Team OWNS Service accepted",
    substeps: [
      ["Schema", "Define allowed node types and relationship shapes."],
      ["Required fields", "Check IDs, types, dates, and source metadata."],
      ["Error queue", "Preserve invalid records for repair and reprocessing."],
    ],
    visibleNodes: ["payments-team", "checkout"],
    visibleEdges: ["owns"],
    metrics: ["—", "—", "—"],
  },
  {
    label: "Deduplication",
    short: "Deduplicate",
    title: "Repeated facts become one clean claim",
    kicker: "Stage 5 · Deduplication",
    hint: "Merge repeats, preserve sources",
    prediction: "What should happen when two files say the same thing?",
    explanation:
      "Deduplication prevents repeated nodes and edges. It should merge identical claims while preserving every supporting source.",
    code:
      "Payments --OWNS--> Checkout\n+ Payments team --OWNS--> Checkout service\n= one fact, two sources",
    scale:
      "Use stable IDs and idempotent ingestion. Do not merge two entities merely because their names look similar.",
    evidence: "2 source claims · 1 canonical fact · no conflict",
    substeps: [
      ["Stable key", "Use subject ID + predicate + object ID as a fact key."],
      ["Idempotency", "Reprocessing the same file should not duplicate data."],
      ["Conflict check", "Different objects for one claim become a conflict."],
    ],
    visibleNodes: ["payments-team", "checkout"],
    visibleEdges: ["owns"],
    metrics: ["—", "—", "—"],
  },
  {
    label: "Provenance",
    short: "Provenance",
    title: "Every fact carries its evidence",
    kicker: "Stage 6 · Provenance",
    hint: "Record why the graph believes it",
    prediction: "Could we prove where this ownership fact came from?",
    explanation:
      "Provenance records the source, exact text span, observation time, confidence, and sometimes the extractor version.",
    code:
      "source: engineering-catalog.json\nspan: \"Payments owns Checkout\"\nobserved_at: 2026-11-19\nconfidence: 0.98",
    scale:
      "Provenance makes answers auditable. Confidence is a review signal, not proof; freshness and source authority also matter.",
    evidence: "source + span + timestamp + confidence attached",
    substeps: [
      ["Source authority", "Prefer official catalogs over unofficial notes when both disagree."],
      ["Freshness", "Check whether a fact is still within its allowed age."],
      ["Confidence", "Combine extraction quality, match quality, authority, and conflict signals."],
    ],
    visibleNodes: ["payments-team", "checkout"],
    visibleEdges: ["owns"],
    metrics: ["—", "—", "—"],
  },
  {
    label: "Graph storage",
    short: "Store",
    title: "Validated facts become connected graph data",
    kicker: "Stage 7 · Graph storage",
    hint: "Write nodes, edges, and versions",
    prediction: "What is the difference between a node and an edge here?",
    explanation:
      "Nodes represent entities. Directed, named edges represent facts between them. Properties store useful details.",
    code:
      "(Payments: Team) --OWNS--> (Checkout: Service)\n(Checkout) --USES--> (PostgreSQL: Technology)",
    scale:
      "Start in memory or SQLite to understand the model. Add a graph database only when scale, concurrency, or query needs justify it.",
    evidence: "graph version v1 · 3 nodes · 2 edges",
    substeps: [
      ["Nodes", "Store entities such as Team, Service, Technology, and Incident."],
      ["Edges", "Store direction, predicate, properties, and source evidence."],
      ["Versions", "Write a new snapshot so bad ingestion can be rolled back."],
    ],
    visibleNodes: ["payments-team", "checkout", "postgresql"],
    visibleEdges: ["owns", "uses"],
    metrics: ["—", "—", "—"],
  },
  {
    label: "Querying",
    short: "Query",
    title: "A question becomes a graph path",
    kicker: "Stage 8 · Querying",
    hint: "Follow relationships, filters, and time",
    prediction: "What relationship answers “What does Checkout use?”",
    explanation:
      "Querying translates a question into entities, relationships, filters, and time constraints, then follows a small evidence subgraph.",
    code:
      "Checkout --USES--> PostgreSQL\nFilter: current and permitted\nPath: Checkout → PostgreSQL",
    scale:
      "Check permissions before returning facts. Use bounded traversals and indexes so a question cannot accidentally scan the entire graph.",
    evidence: "path found · Checkout USES PostgreSQL",
    substeps: [
      ["Parse intent", "Identify the entity, relationship, filter, and time range."],
      ["Traverse", "Follow named edges rather than relying only on text similarity."],
      ["Filter", "Apply permissions, freshness, and time constraints."],
    ],
    visibleNodes: ["payments-team", "checkout", "postgresql", "asha"],
    visibleEdges: ["owns", "uses", "works"],
    metrics: ["100%", "0%", "100%"],
  },
  {
    label: "Evidence answer",
    short: "Answer",
    title: "Only supported facts become an answer",
    kicker: "Stage 9 · Evidence-backed answering",
    hint: "Explain the path and cite sources",
    prediction: "What should happen if the graph has no supporting fact?",
    explanation:
      "The assistant turns retrieved facts into plain language, shows the graph path and sources, and says “I don't know” when evidence is missing.",
    code:
      "Answer: Checkout uses PostgreSQL.\nEvidence: service-inventory.json\nUnsupported claims: none",
    scale:
      "Conflicting sources should be preserved and investigated. A safe refusal is better than a plausible hallucination.",
    evidence: "service-inventory.json · source-backed answer",
    substeps: [
      ["Citations", "Attach the source that supports each material claim."],
      ["Conflict handling", "Compare authority, freshness, and ask for human review when needed."],
      ["Safe refusal", "Do not guess when no supported path exists."],
    ],
    visibleNodes: ["payments-team", "checkout", "postgresql", "asha"],
    visibleEdges: ["owns", "uses", "works"],
    metrics: ["100%", "0%", "100%"],
    answer: true,
  },
  {
    label: "Evaluation",
    short: "Evaluate",
    title: "Measure whether the answer is trustworthy",
    kicker: "Stage 10 · Evaluation",
    hint: "Compare behavior with a gold set",
    prediction: "Is high recall enough to trust an answer?",
    explanation:
      "Evaluation uses known questions and expected facts. A good system retrieves what is needed, makes no unsupported claims, and cites relevant sources.",
    code:
      "retrieval recall = required facts retrieved / required facts\nunsupported-claim rate = unsupported claims / all claims\ncitation precision = relevant citations / all citations",
    scale:
      "Track coverage, faithfulness, citation precision, freshness, p95 latency, and cost. Test ambiguity, stale data, conflicts, permissions, and unknown questions.",
    evidence: "gold question set · recall 1.0 · unsupported 0.0 · citation 1.0",
    substeps: [
      ["Recall", "Did retrieval contain every fact required for the answer?"],
      ["Unsupported claims", "Did the answer say anything not present in retrieved evidence?"],
      ["Citation precision", "Do cited sources actually support the specific claims?"],
    ],
    visibleNodes: ["payments-team", "checkout", "postgresql", "asha"],
    visibleEdges: ["owns", "uses", "works"],
    metrics: ["100%", "0%", "100%"],
    answer: true,
  },
];

const state = { index: 0, substep: 0, dark: false };
const $ = (selector) => document.querySelector(selector);

function renderPipeline() {
  $("#pipeline-strip").innerHTML = stages
    .map(
      (stage, index) => `
        <button class="pipeline-stage ${index === state.index ? "active" : ""}" data-pipeline-step="${index}" type="button">
          <span class="pipeline-number">0${index + 1}</span>${stage.short}
        </button>
      `,
    )
    .join("");
  document.querySelectorAll("[data-pipeline-step]").forEach((button) => {
    button.addEventListener("click", () => {
      state.index = Number(button.dataset.pipelineStep);
      state.substep = 0;
      render();
    });
  });
}

function renderStepList() {
  $("#step-list").innerHTML = stages
    .map(
      (stage, index) => `
        <li class="step-item ${index === state.index ? "active" : ""}" data-step="${index}">
          <span class="step-number">${index + 1}</span>
          <span>${stage.label}</span>
        </li>
      `,
    )
    .join("");
  document.querySelectorAll("[data-step]").forEach((item) => {
    item.addEventListener("click", () => {
      state.index = Number(item.dataset.step);
      state.substep = 0;
      render();
    });
  });
}

function renderSubsteps(stage) {
  $("#substep-list").innerHTML = stage.substeps
    .map(
      ([label], index) => `
        <button class="substep-button ${index === state.substep ? "active" : ""}" data-substep="${index}" type="button">
          <span class="substep-bullet">${index + 1}</span>${label}
        </button>
      `,
    )
    .join("");
  $("#substep-detail").textContent = stage.substeps[state.substep][1];
  document.querySelectorAll("[data-substep]").forEach((button) => {
    button.addEventListener("click", () => {
      state.substep = Number(button.dataset.substep);
      renderSubsteps(stage);
    });
  });
}

function makeLine(x1, y1, x2, y2, name) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.dataset.edge = name;
  line.setAttribute("marker-end", "url(#arrow)");
  return line;
}

function renderLines(stage) {
  const svg = $("#graph-lines");
  svg.querySelectorAll("line").forEach((line) => line.remove());
  [
    makeLine("210", "240", "355", "240", "owns"),
    makeLine("475", "240", "610", "240", "uses"),
    makeLine("270", "300", "330", "270", "works"),
  ].forEach((line) => {
    if (stage.visibleEdges.includes(line.dataset.edge)) line.classList.add("visible");
    svg.appendChild(line);
  });
}

function render() {
  const stage = stages[state.index];
  $("#progress-label").textContent = `Stage ${state.index + 1} of ${stages.length}`;
  $("#stage-kicker").textContent = stage.kicker;
  $("#stage-title").textContent = stage.title;
  $("#status-pill").textContent = stage.label;
  $("#toolbar-hint").textContent = stage.hint;
  $("#prediction").textContent = stage.prediction;
  $("#explanation-title").textContent = stage.label;
  $("#explanation-text").textContent = stage.explanation;
  $("#explanation-code").textContent = stage.code;
  $("#scale-text").textContent = stage.scale;
  $("#evidence-text").textContent = stage.evidence;
  $("#footer-status").textContent = stage.answer
    ? "Evidence-backed answer path is visible"
    : "Request is moving through the pipeline";
  $("#metric-recall").textContent = stage.metrics[0];
  $("#metric-unsupported").textContent = stage.metrics[1];
  $("#metric-citation").textContent = stage.metrics[2];
  $("#request-token").style.left = `${Math.min(78, 7 + state.index * 8)}%`;
  $("#request-token").classList.toggle("answer", Boolean(stage.answer));

  document.querySelectorAll(".graph-node").forEach((node) => {
    const visible = stage.visibleNodes.includes(node.dataset.node);
    node.classList.toggle("visible", visible);
    node.classList.toggle("highlight", stage.answer && node.dataset.node === "checkout");
  });
  document.querySelectorAll(".edge-label").forEach((label) => {
    const edge = label.className.split("edge-")[1];
    label.classList.toggle("visible", stage.visibleEdges.includes(edge));
  });
  renderLines(stage);
  renderPipeline();
  renderStepList();
  renderSubsteps(stage);
  $("#previous").disabled = state.index === 0;
  $("#next").disabled = state.index === stages.length - 1;
  $("#next").textContent =
    state.index === stages.length - 1 ? "Lesson complete ✓" : "Next stage →";
  $("#step-dots").innerHTML = stages
    .map((_, index) => `<span class="step-dot ${index === state.index ? "active" : ""}"></span>`)
    .join("");
}

$("#previous").addEventListener("click", () => {
  if (state.index > 0) {
    state.index -= 1;
    state.substep = 0;
    render();
  }
});

$("#next").addEventListener("click", () => {
  if (state.index < stages.length - 1) {
    state.index += 1;
    state.substep = 0;
    render();
  }
});

$("#theme-toggle").addEventListener("click", () => {
  state.dark = !state.dark;
  document.documentElement.dataset.theme = state.dark ? "dark" : "light";
  localStorage.setItem("kg-lab-theme", state.dark ? "dark" : "light");
});

state.dark = localStorage.getItem("kg-lab-theme") === "dark";
if (state.dark) document.documentElement.dataset.theme = "dark";
render();
