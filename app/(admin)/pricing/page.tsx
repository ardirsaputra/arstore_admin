"use client";
import { useEffect, useState } from "react";

type Pkg = {
  id: string;
  months: number | null;
  priceUsd: number;
  regularUsd: number | null;
  isPopular: boolean;
  isLifetime: boolean;
  isActive: boolean;
  sortOrder: number;
};

// Preview IDR (perkiraan) — kurs asli dihitung live di server saat aplikasi fetch.
const PREVIEW_RATE = 16500;
function roundIdr(amount: number): number {
  if (amount < 5000) return Math.round(amount / 500) * 500;
  if (amount < 20000) return Math.round(amount / 1000) * 1000;
  if (amount < 50000) return Math.round(amount / 2000) * 2000;
  return Math.round(amount / 5000) * 5000;
}
function fmtIdr(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function PricingPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/pricing")
      .then((r) => r.json())
      .then((d) => setPackages(d.packages ?? []))
      .catch(() => setError("Gagal memuat data harga"))
      .finally(() => setLoading(false));
  }, []);

  function update(i: number, patch: Partial<Pkg>) {
    setSaved(false);
    setPackages((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function remove(i: number) {
    setSaved(false);
    setPackages((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addPackage() {
    setSaved(false);
    const nextOrder = packages.reduce((m, p) => Math.max(m, p.sortOrder), 0) + 1;
    setPackages((prev) => [
      ...prev,
      {
        id: `paket-${nextOrder}`,
        months: 1,
        priceUsd: 1.0,
        regularUsd: null,
        isPopular: false,
        isLifetime: false,
        isActive: true,
        sortOrder: nextOrder,
      },
    ]);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? "Gagal menyimpan");
      } else {
        setPackages(data.packages ?? packages);
        setSaved(true);
      }
    } catch {
      setError("Gagal menyimpan (jaringan)");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-gray-500 text-sm">Memuat...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Harga Langganan</h1>
          <p className="text-gray-500 text-xs mt-1 max-w-lg leading-relaxed">
            Harga diatur dalam <span className="text-gray-300 font-medium">USD</span>. Aplikasi otomatis
            mengonversi ke Rupiah memakai kurs live saat ditampilkan ke pengguna (nilai di bawah hanya
            perkiraan dengan kurs {fmtIdr(PREVIEW_RATE)}/USD).
          </p>
        </div>
        <button
          onClick={addPackage}
          className="shrink-0 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-3 py-2 rounded-lg text-sm font-medium"
        >
          + Tambah Paket
        </button>
      </div>

      <div className="space-y-3 mt-5">
        {packages.map((p, i) => {
          const idr = roundIdr(p.priceUsd * PREVIEW_RATE);
          const regIdr = p.regularUsd ? roundIdr(p.regularUsd * PREVIEW_RATE) : null;
          const saving = regIdr ? Math.round((1 - idr / regIdr) * 100) : 0;
          return (
            <div
              key={i}
              className={`rounded-xl border p-4 ${
                p.isActive ? "bg-gray-900 border-gray-800" : "bg-gray-900/40 border-gray-800/60 opacity-70"
              }`}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* ID */}
                <Field label="ID Paket">
                  <input
                    type="text"
                    value={p.id}
                    onChange={(e) => update(i, { id: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                {/* Months */}
                <Field label={p.isLifetime ? "Durasi (seumur hidup)" : "Durasi (bulan)"}>
                  <input
                    type="number"
                    min={1}
                    disabled={p.isLifetime}
                    value={p.isLifetime ? "" : p.months ?? ""}
                    placeholder={p.isLifetime ? "∞" : ""}
                    onChange={(e) =>
                      update(i, { months: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    className={inputCls + (p.isLifetime ? " opacity-50" : "")}
                  />
                </Field>
                {/* Price USD */}
                <Field label="Harga (USD)">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={p.priceUsd}
                    onChange={(e) => update(i, { priceUsd: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
                {/* Regular USD */}
                <Field label="Harga Coret (USD, opsional)">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={p.regularUsd ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      update(i, { regularUsd: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Preview IDR */}
              <div className="flex items-center gap-2 mt-3 text-xs">
                <span className="text-gray-500">Perkiraan tampil:</span>
                <span className="text-emerald-400 font-semibold">{fmtIdr(idr)}</span>
                {regIdr && (
                  <>
                    <span className="text-gray-600 line-through">{fmtIdr(regIdr)}</span>
                    <span className="text-amber-400">hemat {saving}%</span>
                  </>
                )}
              </div>

              {/* Toggles + sort + delete */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <Toggle
                  label="Populer"
                  checked={p.isPopular}
                  onChange={(v) => update(i, { isPopular: v })}
                />
                <Toggle
                  label="Seumur hidup"
                  checked={p.isLifetime}
                  onChange={(v) =>
                    update(i, { isLifetime: v, months: v ? null : p.months ?? 1 })
                  }
                />
                <Toggle
                  label="Aktif"
                  checked={p.isActive}
                  onChange={(v) => update(i, { isActive: v })}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Urutan</span>
                  <input
                    type="number"
                    value={p.sortOrder}
                    onChange={(e) => update(i, { sortOrder: Number(e.target.value) })}
                    className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <button
                  onClick={() => remove(i)}
                  className="ml-auto text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 px-2 py-1 rounded"
                >
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 mt-6 sticky bottom-0 bg-gray-950/80 backdrop-blur py-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        {saved && <span className="text-green-400 text-sm">Tersimpan! Aktif dalam ±10 menit di aplikasi.</span>}
        {error && <span className="text-red-400 text-sm">{error}</span>}
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-xs"
    >
      <span
        className={`w-9 h-5 rounded-full relative transition-colors ${
          checked ? "bg-brand-600" : "bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
      <span className={checked ? "text-gray-200" : "text-gray-500"}>{label}</span>
    </button>
  );
}
