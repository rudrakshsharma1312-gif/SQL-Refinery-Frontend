import React, { useState, useRef } from "react";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (importedTables: Record<string, string[]>) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".csv"));
      if (files.length === 0) {
        setError("Only CSV files are accepted.");
        return;
      }
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one CSV file.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("csvFiles", file);
    });

    try {
      const res = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccessMsg(data.message || "CSV tables imported successfully!");
      onUploadSuccess(data.importedTables || {});
      setTimeout(() => {
        onClose();
        setSelectedFiles([]);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to upload CSV");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-[#EFE4E0] rounded-[24px] shadow-2xl overflow-hidden animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EFE4E0] bg-[#FBF6F4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FADCD6] border border-[#F3C9C0] flex items-center justify-center text-[#E25C47]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#141519]">Import CSV Tables</h3>
              <p className="text-xs text-[#575A65]">Load your own CSV files into DuckDB for benchmarking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-[#575A65] hover:text-[#141519] hover:bg-[#F2E5E1] transition-all duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E25C47] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E4D5D0] hover:border-[#E25C47] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#FBF6F4] hover:bg-[#F8EFEA] transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="w-10 h-10 text-[#E25C47] mb-3" />
            <p className="text-sm font-bold text-[#141519]">
              Click to select or drag & drop CSV files
            </p>
            <p className="text-xs text-[#575A65] mt-1">
              Each CSV becomes a table named after its filename (e.g. customers.csv → customers)
            </p>
          </div>

          {/* Selected File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-[#575A65] uppercase tracking-wider">
                Selected files ({selectedFiles.length}):
              </p>
              {selectedFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#FBF6F4] border border-[#EFE4E0] text-xs font-mono text-[#141519]"
                >
                  <span className="truncate max-w-[280px] font-medium">{f.name}</span>
                  <span className="text-[#8E92A0] font-sans">
                    {(f.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#FDECE9] border border-[#F5C7BE] text-xs text-[#C84A37]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#E8F5EF] border border-[#BDE3D1] text-xs text-[#287452]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EFE4E0] bg-[#FBF6F4] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-full text-[#575A65] hover:text-[#141519] hover:bg-[#F2E5E1] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141519]/20 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="btn-coral text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                Import to DuckDB
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
