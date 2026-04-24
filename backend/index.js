const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ── helpers ──────────────────────────────────────────────────────────────────

function isValidEdge(s) {
  return /^[A-Z]->[A-Z]$/.test(s);
}

function parseEdges(raw) {
  const seen = new Set();
  const valid = [];
  const invalid = [];
  const duplicate_edges = [];

  for (const item of raw) {
    const original = String(item);
    const s = original.trim();

    if (!isValidEdge(s)) {
      invalid.push(original);
      continue;
    }

    const [from, , , to] = s; // "A->B"
    if (from === to) {        // self-loop
      invalid.push(original);
      continue;
    }

    if (seen.has(s)) {
      if (!duplicate_edges.includes(s)) duplicate_edges.push(s);
    } else {
      seen.add(s);
      valid.push(s);
    }
  }

  return { valid, invalid, duplicate_edges };
}

// Build adjacency list respecting "first parent wins"
function buildGraph(edges) {
  const children = {};   // node -> [child, ...]
  const parent = {};     // child -> first parent

  for (const edge of edges) {
    const from = edge[0];
    const to = edge[3];

    if (!children[from]) children[from] = [];
    if (!children[to]) children[to] = [];

    if (parent[to] !== undefined) continue; // already has a parent → ignore

    parent[to] = from;
    children[from].push(to);
  }

  return { children, parent };
}

// Detect cycle in a subgraph (DFS)
function hasCycle(nodes, children) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};
  for (const n of nodes) color[n] = WHITE;

  function dfs(u) {
    color[u] = GRAY;
    for (const v of (children[u] || [])) {
      if (color[v] === GRAY) return true;
      if (color[v] === WHITE && dfs(v)) return true;
    }
    color[u] = BLACK;
    return false;
  }

  for (const n of nodes) {
    if (color[n] === WHITE && dfs(n)) return true;
  }
  return false;
}

// Build nested tree object
function buildTree(node, children) {
  const obj = {};
  for (const c of (children[node] || [])) {
    obj[c] = buildTree(c, children);
  }
  return obj;
}

// Depth = longest root-to-leaf path (node count)
function depth(node, children) {
  const kids = children[node] || [];
  if (!kids.length) return 1;
  return 1 + Math.max(...kids.map(c => depth(c, children)));
}

// ── core processor ───────────────────────────────────────────────────────────

function processData(data) {
  const { valid, invalid, duplicate_edges } = parseEdges(data);
  const { children, parent } = buildGraph(valid);

  const allNodes = new Set(Object.keys(children));

  // Partition into connected components (ignoring direction for grouping)
  const undirected = {};
  for (const n of allNodes) undirected[n] = new Set();
  for (const edge of valid) {
    const f = edge[0], t = edge[3];
    undirected[f].add(t);
    undirected[t].add(f);
  }

  const visited = new Set();
  const components = [];

  function bfsComponent(start) {
    const comp = new Set();
    const q = [start];
    while (q.length) {
      const n = q.shift();
      if (comp.has(n)) continue;
      comp.add(n);
      for (const nb of (undirected[n] || [])) q.push(nb);
    }
    return comp;
  }

  for (const n of allNodes) {
    if (!visited.has(n)) {
      const comp = bfsComponent(n);
      for (const x of comp) visited.add(x);
      components.push(comp);
    }
  }

  const hierarchies = [];
  let total_trees = 0, total_cycles = 0;
  let largest_tree_root = null, largest_depth = 0;

  for (const comp of components) {
    const cycle = hasCycle(comp, children);

    // Find root(s): nodes with no parent inside this component
    let roots = [...comp].filter(n => !parent[n] || !comp.has(parent[n]));
    if (roots.length === 0) roots = [...comp]; // pure cycle: pick lex smallest
    const root = roots.sort()[0];

    if (cycle) {
      total_cycles++;
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      total_trees++;
      const tree = { [root]: buildTree(root, children) };
      const d = depth(root, children);
      hierarchies.push({ root, tree, depth: d });

      if (d > largest_depth || (d === largest_depth && (largest_tree_root === null || root < largest_tree_root))) {
        largest_depth = d;
        largest_tree_root = root;
      }
    }
  }

  return {
    user_id: "yourname_ddmmyyyy",
    email_id: "your@email.com",
    college_roll_number: "yourroll",
    hierarchies,
    invalid_entries: invalid,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root: largest_tree_root || ""
    }
  };
}

// ── route ─────────────────────────────────────────────────────────────────────

const EMPTY_RESPONSE = {
  user_id: "yourname_ddmmyyyy",
  email_id: "your@email.com",
  college_roll_number: "yourroll",
  hierarchies: [],
  invalid_entries: [],
  duplicate_edges: [],
  summary: { total_trees: 0, total_cycles: 0, largest_tree_root: "" }
};

app.post("/bfhl", (req, res) => {
  const { data } = req.body || {};
  if (!Array.isArray(data) || data.length === 0) {
    return res.json(EMPTY_RESPONSE);
  }
  res.json(processData(data));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
