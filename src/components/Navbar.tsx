import React from "react";
import { Database, TableProperties, Upload, RefreshCw } from "lucide-react";

interface NavbarProps {
  aiConfigured: boolean;
  aiProvider: string;
  databaseReady: boolean;
  onOpenSchema: () => void;
  onOpenUpload: () => void;
  onReset: () => void;
  customTablesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  aiConfigured,
  aiProvider,
  databaseReady,
  onOpenSchema,
  onOpenUpload,
  onReset,
  customTablesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FBF6F4]/90 border-b border-[#EFE4E0] px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity matching Superdesign Factotum header */}
        <div className="flex items-center gap-3">
          {/* Circular Red/Coral Monogram Emblem */}
          <div className="w-10 h-10 rounded-full bg-[#E25C47] flex items-center justify-center text-white shadow-md shadow-[#E25C47]/20 font-bold text-lg tracking-tighter">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[#141519]">
                SQL-Refinery
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FADCD6] text-[#C84A37] border border-[#F3C9C0]">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-[#696C77] font-medium">
              Intelligent Optimization & DuckDB Benchmarking
            </p>
          </div>
        </div>

        {/* Center / Right Navigation Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* DuckDB Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#EFE4E0] text-xs text-[#575A65] shadow-xs">
            <Database className="w-3.5 h-3.5 text-[#287452]" />
            <span>DuckDB:</span>
            <span className="font-semibold text-[#141519]">
              {databaseReady ? (customTablesCount > 0 ? `Active (${customTablesCount} custom)` : "50k records") : "Initializing..."}
            </span>
          </div>


          {/* Schema Explorer */}
          <button
            onClick={onOpenSchema}
            className="chip-interactive flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white hover:bg-[#F8EFEA] border border-[#EFE4E0] text-[#141519] cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-[#E25C47]/40 focus-visible:outline-none"
            title="Inspect DuckDB Tables and Columns"
          >
            <TableProperties className="w-3.5 h-3.5 text-[#E25C47]" />
            <span className="hidden sm:inline">Schema</span>
          </button>

          {/* Upload CSV */}
          <button
            onClick={onOpenUpload}
            className="chip-interactive flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white hover:bg-[#F8EFEA] border border-[#EFE4E0] text-[#141519] cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-[#E25C47]/40 focus-visible:outline-none"
            title="Import custom CSV tables"
          >
            <Upload className="w-3.5 h-3.5 text-[#E25C47]" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          {/* Dark Pill "Reset / New" Action Button matching Superdesign "Get in touch" */}
          <button
            onClick={onReset}
            className="btn-ink flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
            title="Reset Queries & Report"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
