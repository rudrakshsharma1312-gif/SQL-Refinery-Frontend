import React, { useEffect, useState } from "react";
import { X, Table, Columns, Hash, Calendar, Type, Check, RefreshCw } from "lucide-react";

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaModal: React.FC<SchemaModalProps> = ({ isOpen, onClose }) => {
  const [tables, setTables] = useState<Record<string, { column_name: string; data_type: string }[]>>({});
  const [loading, setLoading] = useState(false);
  const [copiedCol, setCopiedCol] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/schema")
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) setTables(data.tables);
      })
      .catch((err) => console.error("Error fetching schema:", err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const copyColumn = (col: string) => {
    navigator.clipboard.writeText(col);
    setCopiedCol(col);
    setTimeout(() => setCopiedCol(null), 1500);
  };

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("int") || t.includes("decimal") || t.includes("numeric") || t.includes("double")) {
      return <Hash className="w-3.5 h-3.5 text-[#E25C47]" />;
    }
    if (t.includes("date") || t.includes("time") || t.includes("timestamp")) {
      return <Calendar className="w-3.5 h-3.5 text-sky-600" />;
    }
    return <Type className="w-3.5 h-3.5 text-[#287452]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-white border border-[#EFE4E0] rounded-[24px] shadow-2xl overflow-hidden animate-slide-down">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFE4E0] bg-[#FBF6F4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FADCD6] border border-[#F3C9C0] flex items-center justify-center text-[#E25C47]">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#141519]">DuckDB Relational Schema</h3>
              <p className="text-xs text-[#575A65]">
                Synthetic E-Commerce dataset (10k customers, 50k orders, 100k items, 500 products)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close schema modal"
            className="p-1.5 rounded-full text-[#575A65] hover:text-[#141519] hover:bg-[#F2E5E1] transition-all duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25C47] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#575A65]">
              <RefreshCw className="w-8 h-8 animate-spin text-[#E25C47] mb-3" />
              <p className="text-sm font-medium">Reading DuckDB tables...</p>
            </div>
          ) : Object.keys(tables).length === 0 ? (
            <p className="text-sm text-[#575A65] text-center py-8">No tables found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(tables).map(([tableName, cols]) => (
                <div
                  key={tableName}
                  className="rounded-2xl border border-[#EFE4E0] bg-[#FBF6F4] p-4.5 hover:border-[#E25C47]/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EFE4E0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E25C47]"></span>
                      <span className="font-mono font-bold text-sm text-[#141519]">{tableName}</span>
                    </div>
                    <span className="text-[11px] text-[#575A65] font-mono">
                      {cols.length} column{cols.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {cols.map((col) => (
                      <div
                        key={col.column_name}
                        onClick={() => copyColumn(col.column_name)}
                        className="group flex items-center justify-between px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2E5E1] transition-colors cursor-pointer text-xs border border-[#EFE4E0]"
                        title="Click to copy column name"
                      >
                        <div className="flex items-center gap-2 font-mono text-[#141519]">
                          {getTypeIcon(col.data_type)}
                          <span className="font-medium">{col.column_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono text-[#575A65] bg-[#FBF6F4] px-1.5 py-0.5 rounded border border-[#EFE4E0]">
                            {col.data_type}
                          </span>
                          {copiedCol === col.column_name ? (
                            <Check className="w-3.5 h-3.5 text-[#287452]" />
                          ) : (
                            <Columns className="w-3.5 h-3.5 text-[#8E92A0] opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#EFE4E0] bg-[#FBF6F4] flex items-center justify-between text-xs text-[#575A65]">
          <span>Click any column to copy into query editor</span>
          <button
            onClick={onClose}
            className="btn-ink text-xs font-semibold py-2 px-5 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
