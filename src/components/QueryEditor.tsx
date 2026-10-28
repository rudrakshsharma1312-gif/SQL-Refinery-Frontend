import React from "react";
import { Code2, Play, Sparkles, Layers, Sliders, Trash2, Copy, Check } from "lucide-react";

interface QueryEditorProps {
  sql: string;
  onChange: (val: string) => void;
  onGenerateAiRewrite: () => void;
  onRunComparison: () => void;
  isAiLoading: boolean;
  isComparing: boolean;
  aiConfigured: boolean;
  batchLimit: number;
  onBatchLimitChange: (limit: number) => void;
  warmupRuns: number;
  onWarmupRunsChange: (runs: number) => void;
  timedRuns: number;
  onTimedRunsChange: (runs: number) => void;
  onSelectPreset: (sql: string) => void;
}

export const PRESETS = [
  {
    name: "Customer Spend (US Filter)",
    description: "Aggregation join between 10k customers and 50k orders",
    sql: `SELECT
    c.name,
    SUM(o.amount) AS total_spent
FROM customers c
JOIN orders o
    ON c.customer_id = o.customer_id
WHERE c.country = 'US'
GROUP BY c.name
ORDER BY total_spent DESC;`,
  },
  {
    name: "Revenue by Country & Completed Orders",
    description: "3-table join across orders, items, and customers",
    sql: `SELECT
    c.country,
    COUNT(DISTINCT o.order_id) AS total_orders,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status = 'completed'
GROUP BY c.country
ORDER BY revenue DESC;`,
  },
  {
    name: "Order Status Metrics",
    description: "Multi-aggregate grouping over 50,000 orders",
    sql: `SELECT
    status,
    COUNT(*) AS total_orders,
    ROUND(SUM(amount), 2) AS total_amount,
    ROUND(AVG(amount), 2) AS avg_amount
FROM orders
GROUP BY status
ORDER BY total_orders DESC;`,
  },
  {
    name: "Batch Statements (2 Queries)",
    description: "Multiple semicolon-separated statements for batch optimization",
    sql: `SELECT c.country, COUNT(*) as cust_count FROM customers c GROUP BY c.country ORDER BY cust_count DESC;

SELECT p.category, ROUND(AVG(p.price), 2) as avg_price, COUNT(*) as product_count FROM products p GROUP BY p.category ORDER BY avg_price DESC;`,
  },
];

export const QueryEditor: React.FC<QueryEditorProps> = ({
  sql,
  onChange,
  onGenerateAiRewrite,
  onRunComparison,
  isAiLoading,
  isComparing,
  batchLimit,
  onBatchLimitChange,
  warmupRuns,
  onWarmupRunsChange,
  timedRuns,
  onTimedRunsChange,
  onSelectPreset,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const statementCount = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length || 1;

  return (
    <div className="factotum-card p-6 md:p-8 space-y-6">
      {/* Editorial Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#EFE4E0]">
        <div>
          <div className="text-[11px] font-bold text-[#E25C47] uppercase tracking-wider mb-1">
            01. Workspace
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#141519] tracking-tight">
            Query Studio & Benchmark Lab
          </h2>
          <p className="text-xs text-[#575A65] mt-0.5">
            Enter a single analytical query or multiple semicolon-separated statements.
          </p>
        </div>

        {/* Presets Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#8E92A0]">Presets:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPreset(p.sql)}
              className="chip-interactive px-3 py-1.5 text-xs font-semibold rounded-full bg-[#FBF6F4] hover:bg-[#F2E5E1] border border-[#EFE4E0] text-[#141519] transition-all cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-[#E25C47]/40 focus-visible:outline-none"
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor Container */}
      <div className="rounded-2xl border border-[#E8DBD6] overflow-hidden bg-[#16171D] shadow-md focus-within:border-[#E25C47] transition-all">
        {/* Editor Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1F212A] border-b border-[#2C2E3B] text-xs text-slate-300">
          <div className="flex items-center gap-3 font-mono">
            <span className="flex items-center gap-1.5 text-white font-semibold">
              <Code2 className="w-4 h-4 text-[#E25C47]" />
              SQL Input
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              {statementCount} Statement{statementCount > 1 ? "s" : ""}{" "}
              {statementCount > 1 && "(Batch Mode Active)"}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{sql.length} chars</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={() => onChange("")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-red-500/20 active:scale-95 text-slate-300 hover:text-red-300 text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:outline-none"
              title="Clear SQL"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={sql}
          onChange={(e) => onChange(e.target.value)}
          rows={11}
          spellCheck={false}
          className="w-full p-4 bg-transparent text-[#F1F3F9] font-mono text-xs md:text-sm leading-relaxed resize-y focus:outline-none placeholder-slate-600"
          placeholder="SELECT ... FROM customers JOIN orders ...;"
        />
      </div>

      {/* SQL Refining In-Progress Status Banner */}
      {isAiLoading && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#FFF5F3] via-[#FDECE9] to-[#FFF5F3] border border-[#F5C7BE] animate-slide-down flex items-center justify-between gap-3 text-xs text-[#141519]">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E25C47] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E25C47]"></span>
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-[#C84A37] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#E25C47]" />
                Refining your SQL…
              </span>
              <span className="text-[11px] text-[#696C77]">
                Analyzing AST syntax, filter pushdowns & join cardinality for DuckDB
              </span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#C84A37] bg-white/80 px-2.5 py-1 rounded-full border border-[#F3C9C0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E25C47] animate-pulse"></span>
            <span>Optimizing query plan</span>
          </div>
        </div>
      )}

      {/* Configuration & Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
        {/* Settings Pill Row */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-[#575A65]">
          {/* Warmup Executions */}
          <div className="flex items-center gap-2 bg-[#FBF6F4] px-3 py-1.5 rounded-full border border-[#EFE4E0] transition-colors focus-within:border-[#E25C47]/50">
            <Sliders className="w-3.5 h-3.5 text-[#E25C47]" />
            <span className="font-semibold text-[#141519]">Warmup:</span>
            <select
              value={warmupRuns}
              onChange={(e) => onWarmupRunsChange(Number(e.target.value))}
              className="bg-transparent font-medium text-[#141519] text-xs focus:outline-none cursor-pointer"
            >
              <option value={0}>0 runs</option>
              <option value={1}>1 run</option>
              <option value={2}>2 runs</option>
              <option value={3}>3 runs</option>
            </select>
          </div>

          {/* Timed Executions */}
          <div className="flex items-center gap-2 bg-[#FBF6F4] px-3 py-1.5 rounded-full border border-[#EFE4E0] transition-colors focus-within:border-[#E25C47]/50">
            <span className="font-semibold text-[#141519]">Timed runs:</span>
            <select
              value={timedRuns}
              onChange={(e) => onTimedRunsChange(Number(e.target.value))}
              className="bg-transparent font-medium text-[#141519] text-xs focus:outline-none cursor-pointer"
            >
              <option value={3}>3 runs</option>
              <option value={5}>5 runs (recommended)</option>
              <option value={7}>7 runs</option>
              <option value={10}>10 runs</option>
            </select>
          </div>

          {/* Batch Limit */}
          <div className="flex items-center gap-2 bg-[#FBF6F4] px-3 py-1.5 rounded-full border border-[#EFE4E0] transition-colors focus-within:border-[#E25C47]/50">
            <Layers className="w-3.5 h-3.5 text-[#E25C47]" />
            <span className="font-semibold text-[#141519]">Batch limit:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={batchLimit}
              onChange={(e) => onBatchLimitChange(Math.min(100, Math.max(1, Number(e.target.value))))}
              className="w-12 bg-transparent font-medium text-[#141519] text-xs text-center focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGenerateAiRewrite}
            disabled={isAiLoading || !sql.trim()}
            aria-busy={isAiLoading}
            className="btn-coral flex items-center gap-2 text-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? "animate-spin" : ""}`} />
            <span>{isAiLoading ? "Refining your SQL…" : "✦ Generate AI Rewrite"}</span>
          </button>

          <button
            onClick={onRunComparison}
            disabled={isComparing || isAiLoading || !sql.trim()}
            aria-busy={isComparing}
            className="btn-ink flex items-center gap-2 text-xs cursor-pointer disabled:opacity-50 shadow-md"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isComparing ? "animate-pulse" : ""}`} />
            <span>{isComparing ? "Benchmarking DuckDB…" : "▶ Run Comparison"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
