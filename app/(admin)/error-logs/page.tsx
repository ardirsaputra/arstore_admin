"use client";
import { useEffect, useState } from "react";

type ErrorLog = {
  id: number;
  device_id: string;
  app_version: string;
  error: string;
  stack_trace: string;
  created_at: string;
};

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/error-logs");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Laporan Error (Crash Logs)</h1>
          <p className="text-sm text-gray-400 mt-1">
            Menampilkan 100 laporan error terbaru dari aplikasi
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      {/* List */}
      {loading && logs.length === 0 ? (
        <div className="text-gray-500 text-sm animate-pulse">Memuat laporan error...</div>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-sm bg-gray-900/50 p-6 rounded-xl border border-gray-800/50 text-center">
          Belum ada laporan error yang terekam. Aplikasi berjalan lancar!
        </p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-gray-900/80 rounded-xl p-5 border border-red-900/30 hover:border-red-700/50 transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-red-400 font-mono text-sm break-words whitespace-pre-wrap">
                    {log.error || "Unknown Error"}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded-md">
                      <span className="text-gray-400">App Ver:</span>
                      <span className="text-gray-300 font-mono">{log.app_version || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded-md">
                      <span className="text-gray-400">Device ID:</span>
                      <span className="text-gray-300 font-mono">{log.device_id ? \`\${log.device_id.slice(0, 12)}...\` : "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded-md">
                      <span className="text-gray-400">Waktu:</span>
                      <span className="text-gray-300">
                        {new Date(log.created_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "medium",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {log.stack_trace && (
                  <button
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="text-xs shrink-0 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors border border-gray-700"
                  >
                    {expandedId === log.id ? "Sembunyikan Stack" : "Lihat Stack Trace"}
                  </button>
                )}
              </div>

              {/* Stack Trace Expandable Section */}
              {expandedId === log.id && log.stack_trace && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="bg-black/50 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-[11px] text-gray-400 font-mono leading-relaxed">
                      {log.stack_trace}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
