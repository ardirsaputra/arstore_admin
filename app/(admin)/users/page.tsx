"use client";
import { useEffect, useState, useCallback } from "react";

type User = {
  id: number;
  email: string;
  status: string;
  active_device_id: string | null;
  trial_start_date: string | null;
  expiry_date: string | null;
  is_permanent?: boolean;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [days, setDays] = useState<number | "">("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(q.toLowerCase())
  );

  async function handleAddTime() {
    if (!selectedUser || typeof days !== "number" || days <= 0) return;
    setActionLoading(true);

    const res = await fetch(`/api/admin/users/${selectedUser.id}/add-time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });

    if (res.ok) {
      setSelectedUser(null);
      setDays("");
      loadUsers();
    } else {
      const err = await res.json();
      alert("Gagal menambah waktu: " + (err.error || "Unknown error"));
    }
    setActionLoading(false);
  }

  async function handleGrantLifetime() {
    if (!selectedUser) return;
    if (!confirm(`Jadikan akun ${selectedUser.email} LIFETIME (permanen, tanpa kedaluwarsa)?`)) return;
    setActionLoading(true);

    const res = await fetch(`/api/admin/users/${selectedUser.id}/add-time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permanent: true }),
    });

    if (res.ok) {
      setSelectedUser(null);
      setDays("");
      loadUsers();
    } else {
      const err = await res.json();
      alert("Gagal menjadikan lifetime: " + (err.error || "Unknown error"));
    }
    setActionLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Pengguna Aplikasi</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Daftar pengguna terdaftar dan kelola masa aktif mereka.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          placeholder="Cari berdasarkan email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
        />
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Memuat...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-sm">Belum ada pengguna terdaftar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-gray-900 border border-gray-800 rounded-xl">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Device Aktif</th>
                <th className="px-4 py-3 font-medium">Tanggal Kedaluwarsa</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-semibold text-white">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_permanent ? (
                      <span className="text-xs px-2 py-1 rounded font-medium bg-purple-900/30 text-purple-400">
                        LIFETIME
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        u.status === 'active' ? 'bg-green-900/30 text-green-400' :
                        u.status === 'trial' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {u.status ? u.status.toUpperCase() : "UNKNOWN"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {u.active_device_id ? (
                       u.active_device_id.length > 20 ? u.active_device_id.slice(0, 20) + '...' : u.active_device_id
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.is_permanent
                      ? <span className="text-purple-400 font-semibold">Selamanya ♾️</span>
                      : u.expiry_date ? new Date(u.expiry_date).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="text-xs bg-brand-700 hover:bg-brand-600 text-white px-3 py-1.5 rounded flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Waktu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Time Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-lg mb-2">
              Tambah Waktu Akses
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Masukkan jumlah hari tambahan untuk pengguna <span className="font-semibold text-white">{selectedUser.email}</span>. Waktu tambahan akan diteruskan dari masa trial (jika masih aktif) atau dari masa kedaluwarsa saat ini.
            </p>
            
            <div className="mb-4">
               <label className="block text-xs text-gray-400 mb-1">Jumlah Hari Tambahan</label>
               <input
                 type="number"
                 min="1"
                 value={days}
                 onChange={(e) => setDays(e.target.value ? parseInt(e.target.value, 10) : "")}
                 placeholder="Misal: 30"
                 className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
               />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddTime}
                disabled={actionLoading || !days || typeof days !== 'number' || days <= 0}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading ? "Memproses..." : "Konfirmasi"}
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm"
              >
                Batal
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800">
              <button
                onClick={handleGrantLifetime}
                disabled={actionLoading}
                className="w-full bg-purple-700 hover:bg-purple-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading ? "Memproses..." : "♾️ Jadikan Lifetime (Permanen)"}
              </button>
              <p className="text-[11px] text-gray-500 mt-1 text-center">
                Akses selamanya, tanpa tanggal kedaluwarsa.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
