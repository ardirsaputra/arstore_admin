"use client";
import { useEffect, useState } from "react";
import type { LicenseCode } from "@/lib/types";

const TYPE_OPTIONS = ["monthly", "6months", "yearly", "2years", "lifetime"];

export default function CodesPage() {
  const [codes, setCodes] = useState<LicenseCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedFilter, setUsedFilter] = useState("");
  const [genType, setGenType] = useState("monthly");
  const [genCount, setGenCount] = useState(1);
  const [genLoading, setGenLoading] = useState(false);
  const [newCodes, setNewCodes] = useState<string[]>([]);

  async function loadCodes() {
    setLoading(true);
    const params = new URLSearchParams();
    if (usedFilter !== "") params.set("used", usedFilter);
    const res = await fetch(`/api/admin/codes?${params}`);
    const data = await res.json();
    setCodes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadCodes();
  }, [usedFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setGenLoading(true);
    setNewCodes([]);
    const res = await fetch("/api/admin/codes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: genType, count: genCount }),
    });
    const data = await res.json();
    if (data.codes) setNewCodes(data.codes);
    loadCodes();
    setGenLoading(false);
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Kode Lisensi</h1>

      {/* Generate */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h2 className="font-semibold text-sm mb-3">Generate Kode Baru</h2>
        <div className="flex gap-2 flex-wrap items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tipe</label>
            <select
              value={genType}
              onChange={(e) => setGenType(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Jumlah (maks 100)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={genCount}
              onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-24 focus:outline-none"
            />
          </div>
          <button
            onClick={generate}
            disabled={genLoading}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {genLoading ? "Generating..." : "Generate"}
          </button>
        </div>
        {newCodes.length > 0 && (
          <div className="mt-3 bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">
              Kode baru ({newCodes.length}):
            </p>
            <pre className="text-xs text-green-400 whitespace-pre-wrap">
              {newCodes.join("\n")}
            </pre>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={usedFilter}
          onChange={(e) => setUsedFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">Semua kode</option>
          <option value="false">Belum dipakai</option>
          <option value="true">Sudah dipakai</option>
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Memuat...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Kode</th>
                <th className="text-left px-4 py-3">Tipe</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Dipakai oleh</th>
                <th className="text-left px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-t border-gray-800">
                  <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-3 text-xs">{c.type}</td>
                  <td
                    className={`px-4 py-3 text-xs font-semibold ${c.used ? "text-gray-500" : "text-green-400"}`}
                  >
                    {c.used ? "Terpakai" : "Tersedia"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {c.used_by_device_id ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Tidak ada kode
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
