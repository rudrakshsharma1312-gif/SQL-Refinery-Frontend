# SQL-Refinery (React + DuckDB Studio)

**AI-assisted SQL optimization with correctness verification and performance benchmarking.**

Built as a full-stack React + TypeScript application powered by an in-memory DuckDB query engine, SQL-Refinery uses AI (Google Gemini / NVIDIA Nemotron) to propose SQL rewrites, independently validates their read-only safety, verifies multiset output equivalence, and rigorously benchmarks execution speeds.

> **Core principle:** AI proposes. The application validates. Measurements decide whether a rewrite is faster.

---

## ✨ Features

- **Interactive 3D Machine Hero:** Isometric Three.js refinery machine responding dynamically to workflow states (`idle`, `refining`, `done`).
- **AI-Assisted Rewrites:** Propose query optimizations using Gemini or Nebius / Nemotron with detailed reasoning and optimization rationale.
- **SQL Safety Checks:** Static single-statement read-only SQL validation preventing destructive operations or file-system access before execution.
- **Correctness Verification:** Multi-set row comparison verifying that both baseline and candidate queries produce identical row frequencies, column types, and data types regardless of row order.
- **Performance Benchmarking:** Warmup executions (0–3), repeated timed runs (3–10), and median wall-clock runtime comparisons with speedup ratios and performance deltas.
- **Synthetic E-Commerce Database:** In-memory DuckDB database with 10,000 customers, 50,000 orders, 100,000 order items, 500 products, and 50,000 payments.
- **CSV Data Import:** Drag-and-drop CSV files to create custom DuckDB tables on the fly.
- **Batch Processing:** Support for semicolon-separated multi-statement SQL batches with individual query equivalence tracking.
- **Export Capabilities:** One-click CSV export for both baseline and candidate result sets.

---

## 🏗️ Architecture

1. **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, and Three.js for the 3D isometric refinery hero.
2. **Backend Engine:** Node.js Express server mounting Vite in development and serving static builds in production.
3. **Database Layer:** In-memory DuckDB relational database engine with automated synthetic schema population and relational schema explorer.
4. **AI Layer:** Google Gemini API (`@google/genai`) and OpenAI/Nebius client with robust fallback heuristics for offline and instant query testing.

---

## 🚀 Getting Started

### Development
```bash
npm run dev
```

### Build & Production
```bash
npm run build
npm run start
```

### Verification & Lint
```bash
npm run lint
```

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` for details.
