import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Clock,
  Gauge,
  TrendingUp,
  TrendingDown,
  Layers,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface BenchmarkReport {
  timestamp: string;
  stage: "validation" | "execution" | "mismatch" | "benchmark" | "complete";
  error: string | null;
  baselineValidation: { ok: boolean; message: string } | null;
  candidateValidation: { ok: boolean; message: string } | null;
  baselineResult: { ok: boolean; columns: string[]; rows: any[][]; durationMs?: number } | null;
  candidateResult: { ok: boolean; columns: string[]; rows: any[][]; durationMs?: number } | null;
  equivalent: boolean | null;
  equivalenceMessage: string | null;
  baselineBenchmark: {
    ok: boolean;
    durationsMs: number[];
    medianMs: number;
    meanMs: number;
    minMs?: number;
    maxMs?: number;
    warmupRuns?: number;
    timedRuns?: number;
  } | null;
  candidateBenchmark: {
    ok: boolean;
    durationsMs: number[];
    medianMs: number;
    meanMs: number;
    minMs?: number;
    maxMs?: number;
    warmupRuns?: number;
    timedRuns?: number;
  } | null;
  benchmarkComparison: {
    faster: boolean;
    deltaMs: number;
    improvementPct: number;
    speedupRatio: number;
    message: string;
  } | null;
  batchMode?: boolean;
  queryReports?: Array<{
    index: number;
    originalSql: string;
    rewrittenSql: string;
    equivalent: boolean;
    message: string;
    baselineResult?: any;
    candidateResult?: any;
  }>;
}

interface PerformanceReportProps {
  report: BenchmarkReport | null;
}

export const PerformanceReport: React.FC<PerformanceReportProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState<"candidate" | "baseline">("candidate");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  if (!report) {
    return (
      <div className="factotum-card p-12 text-center border-dashed border-[#E4D5D0]">
        <div className="w-12 h-12 rounded-full bg-[#FBF6F4] border border-[#EFE4E0] flex items-center justify-center text-[#E25C47] mx-auto mb-4 shadow-xs">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#141519]">Your performance report will appear here</h3>
        <p className="text-xs text-[#575A65] max-w-md mx-auto mt-1 leading-relaxed">
          Submit your SQL queries and select <strong className="text-[#141519] font-bold">▶ Run comparison</strong> to execute on DuckDB, verify semantic row equivalence, and measure execution speedup.
        </p>
      </div>
    );
  }

  const {
    stage,
    error,
    baselineValidation,
    candidateValidation,
    equivalent,
    equivalenceMessage,
    baselineBenchmark,
    candidateBenchmark,
    benchmarkComparison,
    baselineResult,
    candidateResult,
    batchMode,
    queryReports,
  } = report;

  const benchmarksReady =
    stage === "complete" &&
    baselineBenchmark?.ok &&
    candidateBenchmark?.ok &&
    benchmarkComparison !== null;

  // CSV download helper
  const downloadCsv = (result: typeof baselineResult, filename: string) => {
    if (!result || !result.columns || !result.rows) return;
    const header = result.columns.join(",");
    const rows = result.rows.map((r) =>
      r.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(",")
    );
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeResult = activeTab === "candidate" ? candidateResult : baselineResult;
  const totalRows = activeResult?.rows?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedRows = activeResult?.rows?.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  ) || [];

  return (
    <div className="factotum-card p-6 md:p-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#EFE4E0]">
        <div>
          <div className="text-[11px] font-bold text-[#E25C47] uppercase tracking-wider mb-1">
            02. Measurements & Validation
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#141519] tracking-tight">
            Performance & Correctness Report
          </h2>
          <p className="text-xs text-[#575A65] mt-0.5">
            Static safety validation, multiset row count checking, and repeated wall-clock timings.
          </p>
        </div>

        <div className="text-xs text-[#8E92A0] font-mono">
          Ran at {new Date(report.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* 1. Validation & Equivalence Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Baseline Validation */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            baselineValidation?.ok
              ? "bg-[#E8F5EF] border-[#BDE3D1] text-[#287452]"
              : baselineValidation
              ? "bg-[#FDECE9] border-[#F5C7BE] text-[#C84A37]"
              : "bg-[#FBF6F4] border-[#EFE4E0] text-[#575A65]"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {baselineValidation?.ok ? (
              <CheckCircle2 className="w-4 h-4 text-[#287452]" />
            ) : baselineValidation ? (
              <XCircle className="w-4 h-4 text-[#C84A37]" />
            ) : (
              <Clock className="w-4 h-4 text-[#8E92A0]" />
            )}
            <span className="text-xs font-bold text-[#141519]">
              {batchMode ? "Original Batch SQL" : "Baseline SQL Validation"}
            </span>
          </div>
          <p className="text-xs text-[#575A65]">
            {baselineValidation?.ok
              ? "Passed static read-only checks"
              : baselineValidation?.message || "Validation pending"}
          </p>
        </div>

        {/* Candidate Validation */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            candidateValidation?.ok
              ? "bg-[#E8F5EF] border-[#BDE3D1] text-[#287452]"
              : candidateValidation
              ? "bg-[#FDECE9] border-[#F5C7BE] text-[#C84A37]"
              : "bg-[#FBF6F4] border-[#EFE4E0] text-[#575A65]"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {candidateValidation?.ok ? (
              <CheckCircle2 className="w-4 h-4 text-[#287452]" />
            ) : candidateValidation ? (
              <XCircle className="w-4 h-4 text-[#C84A37]" />
            ) : (
              <Clock className="w-4 h-4 text-[#8E92A0]" />
            )}
            <span className="text-xs font-bold text-[#141519]">
              {batchMode ? "Rewritten Batch SQL" : "Candidate SQL Validation"}
            </span>
          </div>
          <p className="text-xs text-[#575A65]">
            {candidateValidation?.ok
              ? "Passed static read-only checks"
              : candidateValidation?.message || "Validation pending"}
          </p>
        </div>

        {/* Equivalence Check */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            equivalent === true
              ? "bg-[#E8F5EF] border-[#BDE3D1] text-[#287452] shadow-xs"
              : equivalent === false
              ? "bg-[#FDECE9] border-[#F5C7BE] text-[#C84A37]"
              : "bg-[#FBF6F4] border-[#EFE4E0] text-[#575A65]"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {equivalent === true ? (
              <CheckCircle2 className="w-4 h-4 text-[#287452]" />
            ) : equivalent === false ? (
              <XCircle className="w-4 h-4 text-[#C84A37]" />
            ) : (
              <Clock className="w-4 h-4 text-[#8E92A0]" />
            )}
            <span className="text-xs font-bold text-[#141519]">
              {equivalent === true
                ? "Results are Equivalent"
                : equivalent === false
                ? "Results Differ"
                : "Equivalence Check"}
            </span>
          </div>
          <p className="text-xs text-[#575A65] line-clamp-2">
            {equivalenceMessage || "Execution & row multiset check pending"}
          </p>
        </div>
      </div>

      {/* Error / Mismatch Notice */}
      {error && (
        <div
          className={`flex items-start gap-3 p-4 rounded-2xl border text-xs leading-relaxed ${
            stage === "mismatch"
              ? "bg-[#FFF8E6] border-[#FEE199] text-[#8C6000]"
              : "bg-[#FDECE9] border-[#F5C7BE] text-[#C84A37]"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {stage === "mismatch" ? "Correctness Boundary Enforced: " : "Execution Error: "}
            </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 2. Key Metrics Cards (When Benchmark Succeeded) */}
      {benchmarksReady && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Baseline Median */}
            <div className="p-5 rounded-2xl border border-[#EFE4E0] bg-[#FBF6F4] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
              <div className="text-xs font-bold text-[#575A65] mb-1 flex items-center justify-between">
                <span>{batchMode ? "Original Median" : "Baseline Median"}</span>
                <Clock className="w-3.5 h-3.5 text-[#8E92A0]" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#141519] tracking-tight">
                {baselineBenchmark.medianMs.toFixed(2)} ms
              </div>
              <div className="text-[11px] text-[#8E92A0] mt-1 font-medium">
                Mean: {baselineBenchmark.meanMs.toFixed(2)} ms ({baselineBenchmark.timedRuns || 5} runs)
              </div>
            </div>

            {/* Metric 2: Candidate Median */}
            <div className="p-5 rounded-2xl border border-[#EFE4E0] bg-[#FBF6F4] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
              <div className="text-xs font-bold text-[#575A65] mb-1 flex items-center justify-between">
                <span>{batchMode ? "Candidate Median" : "Candidate Median"}</span>
                <Clock className="w-3.5 h-3.5 text-[#287452]" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#287452] tracking-tight">
                {candidateBenchmark.medianMs.toFixed(2)} ms
              </div>
              <div className="text-[11px] text-[#8E92A0] mt-1 font-medium">
                Mean: {candidateBenchmark.meanMs.toFixed(2)} ms ({candidateBenchmark.timedRuns || 5} runs)
              </div>
            </div>

            {/* Metric 3: Performance Change */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs ${
                benchmarkComparison.faster
                  ? "bg-[#E8F5EF] border-[#BDE3D1]"
                  : "bg-[#FDECE9] border-[#F5C7BE]"
              }`}
            >
              <div className="text-xs font-bold text-[#575A65] mb-1 flex items-center justify-between">
                <span>Performance Change</span>
                {benchmarkComparison.faster ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[#287452]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[#C84A37]" />
                )}
              </div>
              <div
                className={`text-3xl font-extrabold font-mono tracking-tight ${
                  benchmarkComparison.faster ? "text-[#287452]" : "text-[#C84A37]"
                }`}
              >
                {benchmarkComparison.improvementPct > 0 ? "+" : ""}
                {benchmarkComparison.improvementPct.toFixed(2)}%
              </div>
              <div className="text-[11px] text-[#575A65] mt-1 font-medium">
                {benchmarkComparison.faster ? "Faster execution time" : "Slower on this dataset"}
              </div>
            </div>

            {/* Metric 4: Speedup Ratio */}
            <div className="p-5 rounded-2xl border border-[#EFE4E0] bg-[#FBF6F4] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
              <div className="text-xs font-bold text-[#575A65] mb-1 flex items-center justify-between">
                <span>Speedup Ratio</span>
                <Gauge className="w-3.5 h-3.5 text-[#E25C47]" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#E25C47] tracking-tight">
                {benchmarkComparison.speedupRatio.toFixed(2)}x
              </div>
              <div className="text-[11px] text-[#8E92A0] mt-1 font-medium">
                {benchmarkComparison.deltaMs.toFixed(2)} ms difference
              </div>
            </div>
          </div>

          {/* Benchmark Run-by-run breakdown */}
          <div className="p-6 rounded-2xl border border-[#EFE4E0] bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#E25C47]" />
                <h4 className="text-xs font-extrabold text-[#141519] uppercase tracking-wider">
                  Repeated Execution Timings (Wall-Clock ms)
                </h4>
              </div>
              <span className="text-xs text-[#8E92A0] font-medium">
                {baselineBenchmark.durationsMs.length} recorded runs (excluding {baselineBenchmark.warmupRuns || 1} warmup)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Baseline timings */}
              <div className="space-y-2.5">
                <span className="text-xs text-[#575A65] font-semibold">Baseline Timings:</span>
                <div className="space-y-2">
                  {baselineBenchmark.durationsMs.map((ms, idx) => {
                    const maxVal = Math.max(
                      ...baselineBenchmark.durationsMs,
                      ...candidateBenchmark.durationsMs,
                      1
                    );
                    const pct = Math.min(100, Math.max(8, (ms / maxVal) * 100));
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs font-mono">
                        <span className="w-12 text-[#8E92A0]">Run {idx + 1}</span>
                        <div className="flex-1 bg-[#FBF6F4] h-4 rounded-full overflow-hidden border border-[#EFE4E0]">
                          <div
                            className="bg-[#575A65] h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-[#141519] font-bold">
                          {ms.toFixed(2)} ms
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Candidate timings */}
              <div className="space-y-2.5">
                <span className="text-xs text-[#287452] font-semibold">Candidate Timings:</span>
                <div className="space-y-2">
                  {candidateBenchmark.durationsMs.map((ms, idx) => {
                    const maxVal = Math.max(
                      ...baselineBenchmark.durationsMs,
                      ...candidateBenchmark.durationsMs,
                      1
                    );
                    const pct = Math.min(100, Math.max(8, (ms / maxVal) * 100));
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs font-mono">
                        <span className="w-12 text-[#8E92A0]">Run {idx + 1}</span>
                        <div className="flex-1 bg-[#FBF6F4] h-4 rounded-full overflow-hidden border border-[#EFE4E0]">
                          <div
                            className="bg-[#287452] h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-[#287452] font-bold">
                          {ms.toFixed(2)} ms
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Batch Query Breakdown */}
      {batchMode && queryReports && queryReports.length > 0 && (
        <div className="rounded-2xl border border-[#EFE4E0] bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E25C47]" />
            <h4 className="text-xs font-extrabold text-[#141519] uppercase tracking-wider">
              Batch Query Verification Breakdown ({queryReports.length} Statements)
            </h4>
          </div>

          <div className="space-y-2">
            {queryReports.map((q) => (
              <div
                key={q.index}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF6F4] border border-[#EFE4E0] text-xs font-mono"
              >
                <div className="flex items-center gap-3 truncate max-w-xl">
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#EFE4E0] text-[#141519] font-bold">
                    #{q.index}
                  </span>
                  <span className="truncate text-[#575A65]">{q.originalSql}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {q.equivalent ? (
                    <span className="flex items-center gap-1 text-[#287452] bg-[#E8F5EF] px-2.5 py-0.5 rounded-full border border-[#BDE3D1] font-sans font-bold text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      Equivalent
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#C84A37] bg-[#FDECE9] px-2.5 py-0.5 rounded-full border border-[#F5C7BE] font-sans font-bold text-[11px]">
                      <XCircle className="w-3 h-3" />
                      Mismatch
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Query Result Table Inspector */}
      {activeResult && activeResult.columns && activeResult.columns.length > 0 && (
        <div className="rounded-2xl border border-[#EFE4E0] bg-white shadow-sm overflow-hidden">
          {/* Table Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#FBF6F4] border-b border-[#EFE4E0] flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-[#141519] uppercase tracking-wider">
                Result Sets:
              </span>
              <div className="flex items-center bg-white rounded-full p-1 border border-[#EFE4E0]">
                <button
                  onClick={() => {
                    setActiveTab("candidate");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-150 cursor-pointer ${
                    activeTab === "candidate"
                      ? "bg-[#287452] text-white shadow-xs"
                      : "text-[#575A65] hover:text-[#141519] hover:bg-[#F8EFEA]"
                  }`}
                >
                  Candidate Output ({candidateResult?.rows?.length || 0})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("baseline");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-150 cursor-pointer ${
                    activeTab === "baseline"
                      ? "bg-[#141519] text-white shadow-xs"
                      : "text-[#575A65] hover:text-[#141519] hover:bg-[#F8EFEA]"
                  }`}
                >
                  Baseline Output ({baselineResult?.rows?.length || 0})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#575A65] font-mono">
                {totalRows} row(s) • {activeResult.columns.length} column(s)
              </span>
              <button
                onClick={() =>
                  downloadCsv(
                    activeResult,
                    `sql_refinery_${activeTab}_result_${Date.now()}`
                  )
                }
                className="chip-interactive flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white hover:bg-[#F8EFEA] border border-[#EFE4E0] text-[#141519] cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-[#E25C47]/40 focus-visible:outline-none"
              >
                <Download className="w-3.5 h-3.5 text-[#E25C47]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="sticky top-0 bg-[#F8EFEA] border-b border-[#EFE4E0] text-[#575A65] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 w-12 text-[#8E92A0]">#</th>
                  {activeResult.columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-2.5 text-[#141519] font-bold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE4E0] text-[#141519]">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeResult.columns.length + 1}
                      className="px-4 py-8 text-center text-[#8E92A0] italic"
                    >
                      Empty result set.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-[#FBF6F4] transition-colors duration-150"
                    >
                      <td className="px-4 py-2 text-[#8E92A0] font-mono text-[10px]">
                        {(currentPage - 1) * rowsPerPage + rIdx + 1}
                      </td>
                      {row.map((cell: any, cIdx: number) => (
                        <td key={cIdx} className="px-4 py-2 whitespace-nowrap">
                          {cell === null ? (
                            <span className="text-[#8E92A0] italic">NULL</span>
                          ) : typeof cell === "number" ? (
                            <span className="text-[#E25C47] font-mono font-semibold">{cell}</span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 bg-[#FBF6F4] border-t border-[#EFE4E0] text-xs text-[#575A65]">
              <span>
                Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows} rows
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-full bg-white border border-[#EFE4E0] hover:bg-[#F8EFEA] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#E25C47]/40 focus-visible:outline-none"
                >
                  <ChevronLeft className="w-4 h-4 text-[#141519]" />
                </button>
                <span className="px-2 font-mono text-[#141519] font-bold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-full bg-white border border-[#EFE4E0] hover:bg-[#F8EFEA] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#E25C47]/40 focus-visible:outline-none"
                >
                  <ChevronRight className="w-4 h-4 text-[#141519]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
