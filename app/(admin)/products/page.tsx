"use client";
import { useEffect, useState, useCallback } from "react";
import type { Product } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  rental: "Sewa Aplikasi",
  development: "Jasa Pembuatan",
};

const empty: Omit<Product, "id" | "created_at"> = {
  name: "",
  category: "rental",
  description: "",
  price: 0,
  duration: "",
  features: [],
  image_url: "",
  is_active: true,
  sort_order: 0,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Omit<Product, "id" | "created_at">>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(empty);
    setFeaturesText("");
    setEditing(null);
    setError("");
    setModal("create");
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      category: p.category,
      description: p.description ?? "",
      price: p.price,
      duration: p.duration ?? "",
      features: p.features,
      image_url: p.image_url ?? "",
      is_active: p.is_active,
      sort_order: p.sort_order,
    });
    setFeaturesText(p.features.join("\n"));
    setEditing(p.id);
    setError("");
    setModal("edit");
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Nama produk wajib diisi");
      return;
    }
    setSaving(true);
    setError("");
    const body = {
      ...form,
      features: featuresText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const res =
      modal === "edit" && editing != null
        ? await fetch(`/api/admin/products/${editing}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/products", {
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
    if (!confirm("Hapus produk ini?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, is_active: !p.is_active }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Produk & Jasa</h1>
        <button
          onClick={openCreate}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Tambah Produk
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Memuat...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Nama</th>
                <th className="text-left px-4 py-3">Kategori</th>
                <th className="text-left px-4 py-3">Harga</th>
                <th className="text-left px-4 py-3">Durasi</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Urutan</th>
                <th className="text-left px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-800 hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {CATEGORY_LABEL[p.category] ?? p.category}
                  </td>
                  <td className="px-4 py-3">
                    Rp {p.price.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {p.duration || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        p.is_active
                          ? "bg-green-900/50 text-green-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {p.is_active ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{p.sort_order}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs bg-brand-700 hover:bg-brand-600 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Belum ada produk. Klik "Tambah Produk" untuk memulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-screen overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">
              {modal === "create" ? "Tambah Produk" : "Edit Produk"}
            </h2>

            <div className="space-y-4">
              <Field label="Nama Produk *">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={INPUT}
                  placeholder="Contoh: Paket Bulanan"
                />
              </Field>

              <Field label="Kategori *">
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as "rental" | "development",
                    })
                  }
                  className={INPUT}
                >
                  <option value="rental">Sewa Aplikasi</option>
                  <option value="development">Jasa Pembuatan Aplikasi</option>
                </select>
              </Field>

              <Field label="Deskripsi">
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className={INPUT}
                  placeholder="Deskripsi singkat produk..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Harga (Rp) *">
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    className={INPUT}
                    min={0}
                  />
                </Field>
                <Field label="Durasi">
                  <input
                    value={form.duration ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    className={INPUT}
                    placeholder="1 bulan, Seumur hidup..."
                  />
                </Field>
              </div>

              <Field label="Fitur (satu per baris)">
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={4}
                  className={INPUT}
                  placeholder={"Fitur A\nFitur B\nFitur C"}
                />
              </Field>

              <Field label="URL Gambar">
                <input
                  value={form.image_url ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, image_url: e.target.value })
                  }
                  className={INPUT}
                  placeholder="https://..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Urutan Tampil">
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: Number(e.target.value) })
                    }
                    className={INPUT}
                    min={0}
                  />
                </Field>
                <Field label="Status">
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm({ ...form, is_active: e.target.checked })
                      }
                      className="accent-brand-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Aktif</span>
                  </label>
                </Field>
              </div>
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

const INPUT =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
