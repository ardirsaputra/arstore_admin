"use client";
import { useEffect, useState, useCallback } from "react";

type LicenseRequest = {
  id: number;
  user_id: number;
  email: string;
  requested_months: number;
  proof_image: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
};

export default function LicenseRequestsPage() {
  const [items, setItems] = useState<LicenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [modal, setModal] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/license-requests");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpdateStatus() {
    if (!modal) return;
    setSaving(true);
    const res = await fetch("/api/admin/license-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: modal.id,
        status: modal.action === "approve" ? "approved" : "rejected",
        adminNote: adminNote
      }),
    });

    if (res.ok) {
      setModal(null);
      setAdminNote("");
      load();
    } else {
      alert("Gagal mengupdate status");
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Request Lisensi (Bukti Transfer)</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Daftar pengajuan perpanjangan lisensi dari pengguna.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-sm">Belum ada request lisensi.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-gray-900 border border-gray-800 rounded-xl">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">Pengguna</th>
                <th className="px-4 py-3 font-medium">Request</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{r.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.requested_months} Bulan
                    {r.proof_image && (
                      <button 
                        onClick={() => setSelectedProof(r.proof_image)}
                        className="block mt-1 text-xs text-brand-400 hover:underline"
                      >
                        Lihat Bukti
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(r.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      r.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                      r.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setModal({ id: r.id, action: "approve" })}
                          className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => setModal({ id: r.id, action: "reject" })}
                          className="text-xs bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Proof Image Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProof(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedProof(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              Tutup (X)
            </button>
            <img src={selectedProof} alt="Bukti Transfer" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-lg mb-2">
              {modal.action === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {modal.action === 'approve' ? 'Waktu aktif pengguna akan bertambah secara otomatis.' : 'Pengajuan akan ditolak. Masukkan alasan jika perlu.'}
            </p>
            
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Catatan admin (opsional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none mb-4"
              rows={3}
            />

            <div className="flex gap-2">
              <button
                onClick={handleUpdateStatus}
                disabled={saving}
                className={`flex-1 text-white py-2 rounded-lg text-sm disabled:opacity-50 ${modal.action === 'approve' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
              >
                {saving ? "Memproses..." : "Konfirmasi"}
              </button>
              <button
                onClick={() => setModal(null)}
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
