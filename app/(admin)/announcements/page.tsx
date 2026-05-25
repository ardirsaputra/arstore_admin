"use client";
import { useEffect, useState, useCallback } from "react";

type Announcement = {
  id: number;
  title: string;
  body: string;
  type: "info" | "warning" | "promo";
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

type AnnouncementForm = {
  title: string;
  body: string;
  type: "info" | "warning" | "promo";
  is_active: boolean;
  starts_at: string;
  ends_at: string;
};

function emptyForm(): AnnouncementForm {
  return {
    title: "",
    body: "",
    type: "info",
    is_active: true,
    starts_at: "",
    ends_at: "",
  };
}

const TYPE_META: Record<string, { label: string; color: string; emoji: string }> = {
  info:    { label: "Info",      color: "text-blue-400 bg-blue-900/30",   emoji: "ℹ️" },
  warning: { label: "Peringatan", color: "text-yellow-400 bg-yellow-900/30", emoji: "⚠️" },
  promo:   { label: "Promo",     color: "text-green-400 bg-green-900/30", emoji: "🎉" },
};

const INPUT =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500";

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm());
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(emptyForm());
    setEditing(null);
    setError("");
    setModal("create");
  }

  function openEdit(a: Announcement) {
    setForm({
      title: a.title,
      body: a.body,
      type: a.type,
      is_active: a.is_active,
      starts_at: a.starts_at ? new Date(a.starts_at).toISOString().slice(0, 16) : "",
      ends_at: a.ends_at ? new Date(a.ends_at).toISOString().slice(0, 16) : "",
    });
    setEditing(a.id);
    setError("");
    setModal("edit");
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Judul wajib diisi"); return; }
    if (!form.body.trim())  { setError("Isi pengumuman wajib diisi"); return; }
    setSaving(true);
    setError("");

    const body = {
      title: form.title,
      body: form.body,
      type: form.type,
      is_active: form.is_active,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };

    const res =
      modal === "edit" && editing != null
        ? await fetch(`/api/admin/announcements/${editing}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

    if (!res.ok) {
      const d = await res.json();
      setError(d.message ?? "Gagal menyimpan");
      setSaving(false);
      return;
    }
    setModal(null);
    setSaving(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus pengumuman ini?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleActive(a: Announcement) {
    await fetch(`/api/admin/announcements/${a.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, is_active: !a.is_active }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Pengumuman</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Pengumuman aktif akan tampil di aplikasi Android pengguna
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Tambah Pengumuman
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-4xl mb-3">📢</div>
          <p className="text-sm">Belum ada pengumuman. Klik &quot;Tambah Pengumuman&quot; untuk memulai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const meta = TYPE_META[a.type] ?? TYPE_META.info;
            return (
              <div
                key={a.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4 items-start"
              >
                {/* Type Badge */}
                <span className={`text-xs px-2 py-1 rounded font-medium shrink-0 mt-0.5 ${meta.color}`}>
                  {meta.emoji} {meta.label}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        a.is_active
                          ? "bg-green-900/40 text-green-400"
                          : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      {a.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.body}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-600">
                    <span>Dibuat: {new Date(a.created_at).toLocaleDateString("id-ID")}</span>
                    {a.ends_at && (
                      <span>Berakhir: {new Date(a.ends_at).toLocaleDateString("id-ID")}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(a)}
                    className={`text-xs px-2 py-1 rounded ${
                      a.is_active
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-green-800 hover:bg-green-700 text-white"
                    }`}
                  >
                    {a.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="text-xs bg-brand-700 hover:bg-brand-600 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-xs bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">
              {modal === "create" ? "Tambah Pengumuman" : "Edit Pengumuman"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Judul *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={INPUT}
                  placeholder="Contoh: Pemeliharaan Terjadwal"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Isi Pengumuman *</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={4}
                  className={INPUT}
                  placeholder="Tulis pesan pengumuman di sini..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipe</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "info" | "warning" | "promo" })}
                  className={INPUT}
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Peringatan</option>
                  <option value="promo">🎉 Promo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Mulai Tampil (opsional)</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Berhenti Tampil (opsional)</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    className={INPUT}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="accent-brand-500 w-4 h-4"
                />
                <span className="text-sm text-gray-300">Aktifkan sekarang</span>
              </label>
            </div>

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
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
