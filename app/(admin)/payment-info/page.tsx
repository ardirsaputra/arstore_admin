"use client";
import { useEffect, useState } from "react";
import type { PaymentInfo } from "@/lib/types";

const FIELDS: { key: keyof PaymentInfo; label: string }[] = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "bank_name", label: "Nama Bank" },
  { key: "bank_account", label: "No. Rekening" },
  { key: "bank_holder", label: "Nama Pemilik Rekening" },
  { key: "qris_url", label: "URL Gambar QRIS" },
  { key: "note", label: "Catatan" },
];

export default function PaymentInfoPage() {
  const [form, setForm] = useState<Partial<PaymentInfo>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/payment-info")
      .then((r) => r.json())
      .then(setForm)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/payment-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
  }

  if (loading) return <div className="text-gray-500 text-sm">Memuat...</div>;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Info Pembayaran</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs text-gray-400 mb-1">{label}</label>
            {key === "note" ? (
              <textarea
                value={(form[key] as string) ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            ) : (
              <input
                type="text"
                value={(form[key] as string) ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            )}
          </div>
        ))}
        {saved && <p className="text-green-400 text-sm">Berhasil disimpan!</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
