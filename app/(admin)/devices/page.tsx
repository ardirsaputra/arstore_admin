"use client";
import { useEffect, useState, useCallback } from "react";
import type { Device } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  trial: "Trial",
  active: "Aktif",
  expired: "Expired",
};
const STATUS_COLOR: Record<string, string> = {
  trial: "text-yellow-400",
  active: "text-green-400",
  expired: "text-red-400",
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Device | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [permanent, setPermanent] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/devices?${params}`);
    const data = await res.json();
    setDevices(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [q, statusFilter]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  async function activate() {
    if (!selected) return;
    setActionLoading(true);

    const isDate = expiryDate.includes("-");
    const payload = {
      permanent,
      expiry_date: permanent ? undefined : (isDate && expiryDate ? expiryDate : undefined),
      days: permanent ? undefined : (!isDate && expiryDate ? parseInt(expiryDate, 10) : undefined),
    };

    await fetch(
      `/api/admin/devices/${encodeURIComponent(selected.device_id)}/activate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSelected(null);
    loadDevices();
    setActionLoading(false);
  }

  async function revoke(deviceId: string) {
    if (!confirm("Cabut akses perangkat ini?")) return;
    await fetch(`/api/admin/devices/${encodeURIComponent(deviceId)}/revoke`, {
      method: "POST",
    });
    loadDevices();
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Perangkat</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          placeholder="Cari device ID / nama / email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white flex-1 min-w-48 focus:outline-none focus:border-brand-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">Semua status</option>
          <option value="trial">Trial</option>
          <option value="active">Aktif</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Memuat...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Device ID</th>
                <th className="text-left px-4 py-3">Model</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Pengguna</th>
                <th className="text-left px-4 py-3">Kedaluwarsa</th>
                <th className="text-left px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr
                  key={d.device_id}
                  className="border-t border-gray-800 hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {d.device_id.slice(0, 20)}…
                  </td>
                  <td className="px-4 py-3">{d.device_model || "-"}</td>
                  <td
                    className={`px-4 py-3 font-semibold ${STATUS_COLOR[d.status]}`}
                  >
                    {STATUS_LABEL[d.status]} {d.is_permanent && "∞"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {d.user_name ?? "-"}
                    <br />
                    <span className="text-gray-500">{d.user_email ?? ""}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {d.is_permanent
                      ? "Permanen"
                      : d.expiry_date
                        ? new Date(d.expiry_date).toLocaleDateString("id-ID")
                        : "-"}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => {
                        setSelected(d);
                        setPermanent(false);
                        setExpiryDate("");
                      }}
                      className="text-xs bg-brand-700 hover:bg-brand-600 text-white px-2 py-1 rounded"
                    >
                      Aktifkan
                    </button>
                    {d.status === "active" && (
                      <button
                        onClick={() => revoke(d.device_id)}
                        className="text-xs bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded"
                      >
                        Cabut
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Tidak ada perangkat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Activate modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold mb-4">Aktifkan Perangkat</h2>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              {selected.device_id}
            </p>
            <label className="flex items-center gap-2 mb-4 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="accent-brand-500"
              />
              Permanen (lifetime)
            </label>
            {!permanent && (
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">
                  Pilih Opsi Tambah Waktu
                </label>
                <div className="flex gap-2 text-sm text-gray-300 mb-2">
                   <label className="flex items-center gap-1 cursor-pointer">
                     <input type="radio" name="timeOpt" className="accent-brand-500" defaultChecked onChange={(e) => {
                       if (e.target.checked) setExpiryDate("");
                     }} /> Tambah Hari
                   </label>
                   <label className="flex items-center gap-1 cursor-pointer">
                     <input type="radio" name="timeOpt" className="accent-brand-500" onChange={(e) => {
                       if (e.target.checked) {
                         const opt = document.getElementById("daysInput") as HTMLInputElement;
                         if (opt) opt.value = "";
                       }
                     }} /> Set Tanggal
                   </label>
                </div>
                
                <input
                  id="daysInput"
                  type="number"
                  min="1"
                  placeholder="Jumlah Hari (Misal: 30)"
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none mb-2"
                />
                
                <input
                  type="date"
                  onChange={(e) => {
                    setExpiryDate(e.target.value);
                    const opt = document.getElementById("daysInput") as HTMLInputElement;
                    if (opt) opt.value = "";
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Isi salah satu. Kosong = +30 Hari.
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={activate}
                disabled={actionLoading}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading ? "Memproses..." : "Aktifkan"}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
