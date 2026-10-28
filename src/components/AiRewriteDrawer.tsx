import React from "react";
import { Sparkles, ArrowRight, Check, Copy, Lightbulb, Bot } from "lucide-react";

export interface AiRewriteItem {
  index: number;
  originalSql: string;
  rewrittenSql: string;
  rationale?: string;
  error?: string | null;
  provider?: string;
}

interface AiRewriteDrawerProps {
  rewrites: AiRewriteItem[];
  onApplyCandidate: (sql: string) => void;
  onClose?: () => void;
}

export const AiRewriteDrawer: React.FC<AiRewriteDrawerProps> = ({
  rewrites,
  onApplyCandidate,
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  if (!rewrites || rewrites.length === 0) return null;

  const handleCopy = (sql: string, idx: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="factotum-card p-6 md:p-8 space-y-6 border-[#F2C5BD] bg-gradient-to-b from-[#FFF5F3] to-[#FFFFFF] animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EFE4E0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E25C47] text-white flex items-center justify-center shadow-md shadow-[#E25C47]/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-[#141519] tracking-tight">
                AI Optimization Proposals
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FADCD6] text-[#C84A37] border border-[#F3C9C0]">
                {rewrites[0]?.provider || "Nemotron Proposer"}
              </span>
            </div>
            <p className="text-xs text-[#575A65]">
              Review the model's query transformation reasoning before independent DuckDB verification.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-[#8E92A0]">
          {rewrites.length} statement{rewrites.length > 1 ? "s" : ""} optimized
        </span>
      </div>

      {/* Rewrites Grid */}
      <div className="space-y-6">
        {rewrites.map((item) => (
          <div
            key={item.index}
            className="rounded-2xl border border-[#EFE4E0] bg-white overflow-hidden shadow-xs"
          >
            {rewrites.length > 1 && (
              <div className="px-4 py-2 bg-[#FBF6F4] border-b border-[#EFE4E0] flex items-center justify-between">
                <span className="text-xs font-bold text-[#141519] font-mono">
                  Statement #{item.index}
                </span>
              </div>
            )}

            {/* Side-by-side SQL View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#EFE4E0]">
              {/* Left: Original SQL */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#575A65]">
                  <span>Original SQL</span>
                  <span className="text-[10px] bg-[#FBF6F4] text-[#8E92A0] px-2 py-0.5 rounded-full border border-[#EFE4E0]">
                    Baseline
                  </span>
                </div>
                <pre className="p-3.5 rounded-xl bg-[#16171D] text-slate-300 font-mono text-xs overflow-x-auto border border-[#2B2D38] whitespace-pre-wrap leading-relaxed max-h-64">
                  {item.originalSql}
                </pre>
              </div>

              {/* Right: Candidate Rewritten SQL */}
              <div className="p-5 space-y-2.5 bg-[#FFF9F8]">
                <div className="flex items-center justify-between text-xs font-bold text-[#141519]">
                  <span className="text-[#E25C47] flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    AI Proposed Rewrite
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item.rewrittenSql, item.index)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#EFE4E0] text-[11px] font-medium text-[#575A65] hover:text-[#141519] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-[#E25C47]/40 focus-visible:outline-none"
                    >
                      {copiedIndex === item.index ? (
                        <Check className="w-3 h-3 text-[#287452]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedIndex === item.index ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      onClick={() => onApplyCandidate(item.rewrittenSql)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F5EF] border border-[#BDE3D1] text-[11px] font-bold text-[#287452] hover:bg-[#D5EFE3] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-[#287452]/40 focus-visible:outline-none"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {item.error ? (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {item.error}
                  </div>
                ) : (
                  <pre className="p-3.5 rounded-xl bg-[#16171D] text-emerald-300 font-mono text-xs overflow-x-auto border border-emerald-900/40 whitespace-pre-wrap leading-relaxed max-h-64">
                    {item.rewrittenSql}
                  </pre>
                )}
              </div>
            </div>

            {/* Rationale Callout */}
            {item.rationale && (
              <div className="px-5 py-3.5 bg-[#FBF6F4] border-t border-[#EFE4E0] flex items-start gap-2.5 text-xs text-[#575A65]">
                <Lightbulb className="w-4 h-4 text-[#E25C47] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#141519]">Optimization Rationale: </span>
                  <span>{item.rationale}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
