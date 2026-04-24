# BFHL Graph Hierarchy — Full Stack

## Project Structure
```
├── backend/      Express API
└── frontend/     React (Vite) UI
```

---

## Run Locally

### Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# UI runs on http://localhost:5173
```

The frontend reads `VITE_API_URL` env var (defaults to `http://localhost:3000`).

---

## Deploy

### Backend → Render
1. Push `backend/` to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect the repo, set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Deploy — note the URL (e.g. `https://bfhl-backend.onrender.com`)

### Frontend → Vercel
1. Push `frontend/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add environment variable:
   - `VITE_API_URL` = `https://bfhl-backend.onrender.com`
4. Deploy

---

## API

**POST** `/bfhl`

```json
{ "data": ["A->B", "A->C", "B->D"] }
```

---

## Sample Test Cases

### Test 1 — Simple tree
**Input:** `["A->B", "A->C", "B->D"]`

**Output:**
```json
{
  "hierarchies": [{
    "root": "A",
    "tree": { "A": { "B": { "D": {} }, "C": {} } },
    "depth": 3
  }],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": { "total_trees": 1, "total_cycles": 0, "largest_tree_root": "A" }
}
```

### Test 2 — Invalid + duplicate
**Input:** `["A->B", "A->B", "hello", "1->2", "A->A"]`

```json
{
  "hierarchies": [{ "root": "A", "tree": { "A": { "B": {} } }, "depth": 2 }],
  "invalid_entries": ["hello", "1->2", "A->A"],
  "duplicate_edges": ["A->B"],
  "summary": { "total_trees": 1, "total_cycles": 0, "largest_tree_root": "A" }
}
```

### Test 3 — Cycle
**Input:** `["A->B", "B->C", "C->A"]`

```json
{
  "hierarchies": [{ "root": "A", "tree": {}, "has_cycle": true }],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": { "total_trees": 0, "total_cycles": 1, "largest_tree_root": "" }
}
```

### Test 4 — Multiple components
**Input:** `["A->B", "C->D"]`

```json
{
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": {} } }, "depth": 2 },
    { "root": "C", "tree": { "C": { "D": {} } }, "depth": 2 }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": { "total_trees": 2, "total_cycles": 0, "largest_tree_root": "A" }
}
```

### Test 5 — First parent wins
**Input:** `["A->B", "C->B", "A->D"]`
(B already has parent A, so C->B is ignored)

```json
{
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": {}, "D": {} } }, "depth": 2 },
    { "root": "C", "tree": { "C": {} }, "depth": 1 }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": { "total_trees": 2, "total_cycles": 0, "largest_tree_root": "A" }
}
```
