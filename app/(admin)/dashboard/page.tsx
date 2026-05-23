"use client";
import { useEffect, useState } from "react";
import type { AdminStats } from "@/lib/types";

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`bg-gray-900 border rounded-xl p-5 ${color}`}>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 text-sm">Memuat...</div>;
  if (!stats)
    return <div className="text-red-400 text-sm">Gagal memuat data</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Perangkat"
          value={stats.total}
          color="border-gray-700"
        />
        <StatCard label="Trial" value={stats.trial} color="border-yellow-800" />
        <StatCard label="Aktif" value={stats.active} color="border-green-800" />
        <StatCard
          label="Expired"
          value={stats.expired}
          color="border-red-800"
        />
        <StatCard
          label="Total Kode"
          value={stats.total_codes}
          color="border-gray-700"
        />
        <StatCard
          label="Kode Terpakai"
          value={stats.used_codes}
          color="border-gray-700"
        />
      </div>
      {stats.unread_feature_requests > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-yellow-300 text-sm">
          ⚠️ Ada <strong>{stats.unread_feature_requests}</strong> permintaan
          fitur yang belum dibaca.
        </div>
      )}
    </div>
  );
}
