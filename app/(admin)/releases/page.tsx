"use client";
import { useEffect, useState, useCallback } from "react";
import type { AppRelease } from "@/lib/types";

type ReleaseForm = Omit<AppRelease, "id" | "created_at"> & {
  changelogText: string;
  featuresText: string;
  screenshotsText: string;
};

function emptyForm(): ReleaseForm {
  return {
    version_name: "",
    version_code: 1,
    apk_url: "",
    changelog: [],
    features: [],
    screenshots: [],
    min_android: "Android 7.0+",
    file_size: "",
    is_published: false,
    release_date: new Date().toISOString().slice(0, 10),
    changelogText: "",
    featuresText: "",
    screenshotsText: "",
  };
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

export default function ReleasesPage() {
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<ReleaseForm>(emptyForm());
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/releases");
    const data = await res.json();
    setReleases(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm());
    setEditing(null);
    setError("");
    setModal("create");
  }

  function openEdit(r: AppRelease) {
    setForm({
      version_name: r.version_name,
      version_code: r.version_code,
      apk_url: r.apk_url,
      changelog: r.changelog,
      features: r.features,
      screenshots: r.screenshots,
      min_android: r.min_android,
      file_size: r.file_size ?? "",
      is_published: r.is_published,
      release_date: r.release_date
        ? new Date(r.release_date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      changelogText: r.changelog.join("\n"),
      featuresText: r.features.join("\n"),
      screenshotsText: r.screenshots.join("\n"),
    });
    setEditing(r.id);
    setError("");
    setModal("edit");
  }

  function parseLines(text: string): string[] {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSave() {
    if (!form.version_name.trim()) {
      setError("Nama versi wajib diisi");
      return;
    }
    if (!form.apk_url.trim()) {
      setError("URL APK wajib diisi");
      return;
    }
    setSaving(true);
    setError("");

    const body = {
      version_name: form.version_name,
      version_code: form.version_code,
      apk_url: form.apk_url,
      changelog: parseLines(form.changelogText),
      features: parseLines(form.featuresText),
      screenshots: parseLines(form.screenshotsText),
      min_android: form.min_android,
      file_size: form.file_size || null,
      is_published: form.is_published,
      release_date: form.release_date,
    };

    const res =
      modal === "edit" && editing != null
        ? await fetch(`/api/admin/releases/${editing}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/releases", {
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
    if (!confirm("Hapus rilis ini?")) return;
    await fetch(`/api/admin/releases/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(r: AppRelease) {
    await fetch(`/api/admin/releases/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...r,
        is_published: !r.is_published,
        release_date: r.release_date,
        changelogText: "",
        featuresText: "",
        screenshotsText: "",
      }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Rilis Aplikasi</h1>
        <div className="flex items-center gap-3">
          <a
            href="/download"
            target="_blank"
            className="text-xs text-brand-400 hover:text-brand-300 underline"
          >
            Lihat Halaman Download ↗
          </a>
          <button
            onClick={openCreate}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Tambah Rilis
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Memuat...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">Versi</th>
                <th className="text-left px-4 py-3">Kode</th>
                <th className="text-left px-4 py-3">Tanggal Rilis</th>
                <th className="text-left px-4 py-3">Ukuran</th>
                <th className="text-left px-4 py-3">Min Android</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-gray-800 hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 font-mono font-medium">
                    v{r.version_name}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{r.version_code}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(r.release_date).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {r.file_size || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.min_android}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(r)}
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        r.is_published
                          ? "bg-green-900/50 text-green-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {r.is_published ? "Dipublikasi" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => openEdit(r)}
                      className="text-xs bg-brand-700 hover:bg-brand-600 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {releases.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Belum ada rilis. Klik "Tambah Rilis" untuk memulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">
              {modal === "create" ? "Tambah Rilis" : "Edit Rilis"}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Nama Versi *">
                  <input
                    value={form.version_name}
                    onChange={(e) =>
                      setForm({ ...form, version_name: e.target.value })
                    }
                    className={INPUT}
                    placeholder="1.2.3"
                  />
                </Field>
                <Field label="Kode Versi *">
                  <input
                    type="number"
                    value={form.version_code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        version_code: Number(e.target.value),
                      })
                    }
                    className={INPUT}
                    min={1}
                  />
                </Field>
                <Field label="Tanggal Rilis">
                  <input
                    type="date"
                    value={form.release_date}
                    onChange={(e) =>
                      setForm({ ...form, release_date: e.target.value })
                    }
                    className={INPUT}
                  />
                </Field>
              </div>

              <Field label="URL APK (link unduhan langsung) *">
                <input
                  value={form.apk_url}
                  onChange={(e) =>
                    setForm({ ...form, apk_url: e.target.value })
                  }
                  className={INPUT}
                  placeholder="https://drive.google.com/... atau https://..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Min Android">
                  <input
                    value={form.min_android}
                    onChange={(e) =>
                      setForm({ ...form, min_android: e.target.value })
                    }
                    className={INPUT}
                    placeholder="Android 7.0+"
                  />
                </Field>
                <Field label="Ukuran File">
                  <input
                    value={form.file_size ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, file_size: e.target.value })
                    }
                    className={INPUT}
                    placeholder="28 MB"
                  />
                </Field>
              </div>

              <Field label="Fitur Aplikasi (satu per baris)">
                <textarea
                  value={form.featuresText}
                  onChange={(e) =>
                    setForm({ ...form, featuresText: e.target.value })
                  }
                  rows={4}
                  className={INPUT}
                  placeholder={"Download video dari YouTube\nFake GPS\nBattery Alarm"}
                />
              </Field>

              <Field label="Changelog / Perubahan (satu per baris)">
                <textarea
                  value={form.changelogText}
                  onChange={(e) =>
                    setForm({ ...form, changelogText: e.target.value })
                  }
                  rows={4}
                  className={INPUT}
                  placeholder={"Perbaikan bug login\nTambah fitur dark mode\nPerforma lebih cepat"}
                />
              </Field>

              <Field label="Screenshot URLs (satu per baris)">
                <textarea
                  value={form.screenshotsText}
                  onChange={(e) =>
                    setForm({ ...form, screenshotsText: e.target.value })
                  }
                  rows={3}
                  className={INPUT}
                  placeholder="https://i.imgur.com/abc.png"
                />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm({ ...form, is_published: e.target.checked })
                  }
                  className="accent-brand-500 w-4 h-4"
                />
                <span className="text-sm text-gray-300">
                  Publikasikan (tampil di halaman download)
                </span>
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
