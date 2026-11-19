const steps = [
  {
    label: "Source",
    title: "A fact begins as a sentence",
    kicker: "Milestone 1 · Graph fundamentals",
    hint: "Read the source statement",
    prediction: "What entities can you find in this sentence?",
    explanation:
      "A document is the starting point. Before a graph exists, people write facts in text, tickets, spreadsheets, or APIs.",
    code: '"The Payments team owns the Checkout service."',
    scale:
      "At scale, sources arrive from many systems. Store document IDs and timestamps so every extracted fact can be audited.",
    evidence: "engineering-catalog.json · source span preserved",
    visibleNodes: [],
    visibleEdges: [],
  },
  {
    label: "Extract",
    title: "Find entities and a relationship",
    kicker: "Milestone 2 · Extraction",
    hint: "Turn words into candidate facts",
    prediction: "Which word becomes the relationship?",
    explanation:
      "Extraction identifies the things and the action connecting them. These are candidate facts, not yet guaranteed truth.",
    code:
      "Entity: Payments team\nEntity: Checkout service\nRelation: Payments --OWNS--> Checkout",
    scale:
      "At scale, extraction may use rules, structured fields, or an LLM. Validate the output because extraction can be wrong.",
    evidence: "engineering-catalog.json · candidate relation",
    visibleNodes: ["payments-team", "checkout"],
    visibleEdges: [],
  },
  {
    label: "Link",
    title: "Names become canonical entities",
    kicker: "Milestone 3 · Entity linking",
    hint: "Prevent duplicate nodes",
    prediction: "Should “Checkout API” create a second node?",
    explanation:
      "Entity linking maps different mentions to one stable ID. “Checkout”, “Checkout API”, and “checkout service” can refer to one node.",
    code:
      '"Checkout API" -> Service: checkout\n"Checkout service" -> Service: checkout',
    scale:
      "At scale, aliases may be ambiguous. High-confidence matches can be automatic; uncertain matches need review.",
    evidence: "canonical ID: checkout · aliases retained",
    visibleNodes: ["payments-team", "checkout"],
    visibleEdges: [],
  },
  {
    label: "Validate",
    title: "The schema checks the fact",
    kicker: "Milestone 4 · Validation",
    hint: "Reject an invalid relationship",
    prediction: "Does Team --OWNS--> Service fit the schema?",
    explanation:
      "A schema is a rulebook. It prevents confusing facts such as a Technology owning a Person or a Service using an unknown node.",
    code:
      "Allowed: Team --OWNS--> Service\nRejected: Technology --OWNS--> Person",
    scale:
      "At scale, validation protects downstream retrieval. Invalid records should fail loudly and enter an error queue.",
    evidence: "schema.py · relationship shape accepted",
    visibleNodes: ["payments-team", "checkout"],
    visibleEdges: ["owns"],
  },
  {
    label: "Query",
    title: "A path becomes an answer",
    kicker: "Milestone 5 · Querying and evidence",
    hint: "Follow the graph path",
    prediction: "What does Checkout use?",
    explanation:
      "A query follows named edges. The answer is useful because the path and source evidence are shown, not hidden.",
    code:
      "Checkout --USES--> PostgreSQL\nAnswer: Checkout uses PostgreSQL.",
    scale:
      "At scale, retrieve a small evidence subgraph, check permissions and freshness, then refuse unsupported claims.",
    evidence: "service-inventory.json · Checkout USES PostgreSQL",
    visibleNodes: ["payments-team", "checkout", "postgresql", "asha"],
    visibleEdges: ["owns", "uses", "works"],
    answer: true,
  },
];

const state = { index: 0, dark: false };
const $ = (selector) => document.querySelector(selector);

function renderStepList() {
  $("#step-list").innerHTML = steps
    .map(
      (step, index) => `
        <li class="step-item ${index === state.index ? "active" : ""}" data-step="${index}">
          <span class="step-number">${index + 1}</span>
          <span>${step.label}</span>
        </li>
      `,
    )
    .join("");

  document.querySelectorAll("[data-step]").forEach((item) => {
    item.addEventListener("click", () => {
      state.index = Number(item.dataset.step);
      render();
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

function renderLines(step) {
  const svg = $("#graph-lines");
  svg.querySelectorAll("line").forEach((line) => line.remove());
  const lines = [
    makeLine("210", "240", "355", "240", "owns"),
    makeLine("475", "240", "610", "240", "uses"),
    makeLine("270", "300", "330", "270", "works"),
  ];
  lines.forEach((line) => {
    if (step.visibleEdges.includes(line.dataset.edge)) line.classList.add("visible");
    svg.appendChild(line);
  });
}

function render() {
  const step = steps[state.index];
  $("#progress-label").textContent = `Step ${state.index + 1} of ${steps.length}`;
  $("#stage-kicker").textContent = step.kicker;
  $("#stage-title").textContent = step.title;
  $("#status-pill").textContent = step.label;
  $("#toolbar-hint").textContent = step.hint;
  $("#prediction").textContent = step.prediction;
  $("#explanation-title").textContent = step.label;
  $("#explanation-text").textContent = step.explanation;
  $("#explanation-code").textContent = step.code;
  $("#scale-text").textContent = step.scale;
  $("#evidence-text").textContent = step.evidence;
  $("#footer-status").textContent = step.answer
    ? "Answer generated with 2 source-backed facts"
    : "No answer generated yet";

  document.querySelectorAll(".graph-node").forEach((node) => {
    const visible = step.visibleNodes.includes(node.dataset.node);
    node.classList.toggle("visible", visible);
    node.classList.toggle("highlight", step.answer && node.dataset.node === "checkout");
  });

  document.querySelectorAll(".edge-label").forEach((label) => {
    const edge = label.className.split("edge-")[1];
    label.classList.toggle("visible", step.visibleEdges.includes(edge));
  });
  renderLines(step);
  $("#previous").disabled = state.index === 0;
  $("#next").disabled = state.index === steps.length - 1;
  $("#next").textContent = state.index === steps.length - 1 ? "Lesson complete ✓" : "Next step →";
  $("#step-dots").innerHTML = steps
    .map((_, index) => `<span class="step-dot ${index === state.index ? "active" : ""}"></span>`)
    .join("");
  renderStepList();
}

$("#previous").addEventListener("click", () => {
  if (state.index > 0) {
    state.index -= 1;
    render();
  }
});

$("#next").addEventListener("click", () => {
  if (state.index < steps.length - 1) {
    state.index += 1;
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
