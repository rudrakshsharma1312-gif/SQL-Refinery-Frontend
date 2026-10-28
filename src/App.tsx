import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { RefineryHero3D } from "./components/RefineryHero3D";
import { QueryEditor, PRESETS } from "./components/QueryEditor";
import { AiRewriteDrawer, AiRewriteItem } from "./components/AiRewriteDrawer";
import { PerformanceReport, BenchmarkReport } from "./components/PerformanceReport";
import { SchemaModal } from "./components/SchemaModal";
import { CsvUploadModal } from "./components/CsvUploadModal";
import { Info, CheckCircle2, AlertCircle } from "lucide-react";

export const App: React.FC = () => {
  const [sql, setSql] = useState<string>(PRESETS[0].sql);
  const [candidateSql, setCandidateSql] = useState<string>(PRESETS[0].sql);
  const [aiRewrites, setAiRewrites] = useState<AiRewriteItem[]>([]);
  const [report, setReport] = useState<BenchmarkReport | null>(null);

  // Machine 3D State
  const [machineState, setMachineState] = useState<"idle" | "refining" | "done">("idle");

  // Loading States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  // App Settings
  const [warmupRuns, setWarmupRuns] = useState(1);
  const [timedRuns, setTimedRuns] = useState(5);
  const [batchLimit, setBatchLimit] = useState(10);

  // Backend Status
  const [backendStatus, setBackendStatus] = useState({
    databaseReady: false,
    aiConfigured: false,
    aiProvider: "Checking...",
    customTablesCount: 0,
  });

  // Modals
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Toast banner
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Check backend status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setBackendStatus({
            databaseReady: data.databaseReady,
            aiConfigured: data.aiConfigured,
            aiProvider: data.aiProvider,
            customTablesCount: data.stats?.customTablesCount || 0,
          });
        }
      } catch (err) {
        console.warn("Backend status check failed:", err);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Split multiple queries
  const getQueriesFromInput = (inputSql: string): string[] => {
    return inputSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  // Action: Generate AI Rewrite
  const handleGenerateAiRewrite = async () => {
    if (isAiLoading || isComparing) return;
    const rawSql = sql.trim();
    if (!rawSql) {
      showToast("error", "Enter at least one SQL query first.");
      return;
    }

    const queries = getQueriesFromInput(rawSql);
    if (queries.length > batchLimit) {
      showToast("error", `You submitted ${queries.length} queries, exceeding the batch limit of ${batchLimit}.`);
      return;
    }

    setIsAiLoading(true);
    setMachineState("refining");
    showToast("info", `Analyzing & refining ${queries.length} query statement(s)...`);

    try {
      const rewrites: AiRewriteItem[] = [];

      for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        const res = await fetch("/api/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sql: q }),
        });

        const data = await res.json();
        if (data.ok && data.optimized_sql) {
          rewrites.push({
            index: i + 1,
            originalSql: q,
            rewrittenSql: data.optimized_sql,
            rationale: data.rationale,
            provider: data.provider,
          });
        } else {
          rewrites.push({
            index: i + 1,
            originalSql: q,
            rewrittenSql: q,
            error: data.error || "Model rewrite failed",
            rationale: "Could not safely optimize this statement.",
          });
        }
      }

      setAiRewrites(rewrites);
      if (rewrites.length === 1 && rewrites[0].rewrittenSql) {
        setCandidateSql(rewrites[0].rewrittenSql);
      } else if (rewrites.length > 1) {
        setCandidateSql(rewrites.map((r) => r.rewrittenSql).join(";\n\n") + ";");
      }

      setMachineState("idle");
      showToast("success", `AI rewrites generated successfully! Review below.`);
    } catch (err: any) {
      setMachineState("idle");
      showToast("error", `AI rewrite request failed: ${err?.message || err}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Action: Run Comparison
  const handleRunComparison = async () => {
    if (isComparing || isAiLoading) return;
    const rawSql = sql.trim();
    if (!rawSql) {
      showToast("error", "Enter a query before running comparison.");
      return;
    }

    const queries = getQueriesFromInput(rawSql);
    setIsComparing(true);
    setMachineState("refining");

    try {
      // Single query comparison
      if (queries.length === 1) {
        const baseline = queries[0];
        const candidate = candidateSql.trim() || baseline;

        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baselineSql: baseline,
            candidateSql: candidate,
            warmupRuns,
            timedRuns,
          }),
        });

        const data: BenchmarkReport = await res.json();
        setReport(data);

        if (data.stage === "complete" && data.equivalent) {
          setMachineState("done");
          showToast("success", "Benchmarking complete! Results verified equivalent.");
        } else if (data.stage === "mismatch") {
          setMachineState("idle");
          showToast("error", "Queries returned different results. Benchmarking skipped.");
        } else if (data.error) {
          setMachineState("idle");
          showToast("error", data.error);
        } else {
          setMachineState("idle");
        }
      } else {
        // Batch query comparison
        const batchItems = queries.map((q, idx) => {
          const matchingRewrite = aiRewrites.find((r) => r.index === idx + 1);
          return {
            originalSql: q,
            rewrittenSql: matchingRewrite?.rewrittenSql || q,
          };
        });

        const res = await fetch("/api/batch-compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchItems,
            warmupRuns,
            timedRuns,
          }),
        });

        const data: BenchmarkReport = await res.json();
        setReport(data);

        if (data.stage === "complete" && data.equivalent) {
          setMachineState("done");
          showToast("success", `All ${queries.length} batch queries verified and benchmarked!`);
        } else {
          setMachineState("idle");
          if (data.error) showToast("error", data.error);
        }
      }
    } catch (err: any) {
      setMachineState("idle");
      showToast("error", `Comparison failed: ${err?.message || err}`);
    } finally {
      setIsComparing(false);
    }
  };

  // Reset
  const handleReset = () => {
    setSql(PRESETS[0].sql);
    setCandidateSql(PRESETS[0].sql);
    setAiRewrites([]);
    setReport(null);
    setMachineState("idle");
    showToast("info", "Workspace reset to default.");
  };

  const handleApplyCandidate = (rewrittenSql: string) => {
    setCandidateSql(rewrittenSql);
    showToast("info", "Candidate SQL applied to comparison target.");
  };

  return (
    <div className="min-h-screen bg-[#FBF6F4] text-[#141519] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        aiConfigured={backendStatus.aiConfigured}
        aiProvider={backendStatus.aiProvider}
        databaseReady={backendStatus.databaseReady}
        onOpenSchema={() => setIsSchemaModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onReset={handleReset}
        customTablesCount={backendStatus.customTablesCount}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Factotum-inspired Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-full border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200 text-xs font-semibold ${
              toast.type === "success"
                ? "bg-[#E8F5EF] border-[#BDE3D1] text-[#287452]"
                : toast.type === "error"
                ? "bg-[#FDECE9] border-[#F5C7BE] text-[#C84A37]"
                : "bg-white border-[#EFE4E0] text-[#141519]"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-[#287452]" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 text-[#C84A37]" />}
            {toast.type === "info" && <Info className="w-4 h-4 text-[#E25C47]" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* 3D Isometric Hero Scene in Factotum Blush Frame */}
        <RefineryHero3D
          machineState={machineState}
          onStateChange={setMachineState}
          onTriggerRefine={handleGenerateAiRewrite}
        />

        {/* Query Workspace & Editor */}
        <QueryEditor
          sql={sql}
          onChange={(newSql) => {
            setSql(newSql);
            if (!candidateSql) setCandidateSql(newSql);
          }}
          onGenerateAiRewrite={handleGenerateAiRewrite}
          onRunComparison={handleRunComparison}
          isAiLoading={isAiLoading}
          isComparing={isComparing}
          aiConfigured={backendStatus.aiConfigured}
          batchLimit={batchLimit}
          onBatchLimitChange={setBatchLimit}
          warmupRuns={warmupRuns}
          onWarmupRunsChange={setWarmupRuns}
          timedRuns={timedRuns}
          onTimedRunsChange={setTimedRuns}
          onSelectPreset={(presetSql) => {
            setSql(presetSql);
            setCandidateSql(presetSql);
            setAiRewrites([]);
            setReport(null);
            setMachineState("idle");
          }}
        />

        {/* AI Rewrite Proposals Drawer */}
        {aiRewrites.length > 0 && (
          <div className="animate-slide-up">
            <AiRewriteDrawer
              rewrites={aiRewrites}
              onApplyCandidate={handleApplyCandidate}
            />
          </div>
        )}

        {/* Benchmarking & Performance Report */}
        <div className="animate-slide-up">
          <PerformanceReport report={report} />
        </div>
      </main>

      {/* Factotum-inspired Footer */}
      <footer className="w-full border-t border-[#EFE4E0] py-8 px-4 lg:px-8 bg-[#FBF6F4] text-xs text-[#696C77] mt-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#141519]">SQL-Refinery</span>
            <span>•</span>
            <span>AI Proposes. Application Validates. DuckDB Measurements Decide.</span>
          </div>
          <div className="flex items-center gap-4 text-[#696C77]">
            <span>In-Memory DuckDB Engine</span>
            <span>•</span>
            <span>50,000 Order Dataset</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <CsvUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={(imported) => {
          setBackendStatus((prev) => ({
            ...prev,
            customTablesCount: Object.keys(imported).length,
          }));
          showToast("success", `Imported ${Object.keys(imported).length} custom CSV tables into DuckDB!`);
        }}
      />
    </div>
  );
};

export default App;
