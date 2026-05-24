"use client";
import { useEffect, useState } from "react";
import type { AdminStats } from "@/lib/types";

type StatConfig = {
  label: string;
  key: keyof AdminStats;
  icon: React.ReactNode;
  ring: string;
  iconBg: string;
  iconColor: string;
};

const STATS: StatConfig[] = [
  {
    label: "Total Perangkat",
    key: "total",
    ring: "ring-gray-700",
    iconBg: "bg-gray-800",
    iconColor: "text-gray-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Trial",
    key: "trial",
    ring: "ring-yellow-700/60",
    iconBg: "bg-yellow-900/40",
    iconColor: "text-yellow-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Lisensi Aktif",
    key: "active",
    ring: "ring-green-700/60",
    iconBg: "bg-green-900/40",
    iconColor: "text-green-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          strokeLinejoin="round"
        />
        <polyline
          points="9 12 11 14 15 10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Expired",
    key: "expired",
    ring: "ring-red-700/60",
    iconBg: "bg-red-900/40",
    iconColor: "text-red-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
        <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Total Kode",
    key: "total_codes",
    ring: "ring-brand-700/60",
    iconBg: "bg-brand-900/40",
    iconColor: "text-brand-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <circle cx="7.5" cy="15.5" r="5" />
        <path d="m21 2-9.6 9.6M15.5 7.5l3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Kode Terpakai",
    key: "used_codes",
    ring: "ring-gray-700",
    iconBg: "bg-gray-800",
    iconColor: "text-gray-400",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <polyline
          points="20 6 9 17 4 12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/stats");
    if (r.ok) {
      setStats(await r.json());
      setRefreshedAt(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <div className="text-gray-500 text-sm animate-pulse">
        Memuat statistik…
      </div>
    );
  if (!stats)
    return <div className="text-red-400 text-sm">Gagal memuat data.</div>;

  const activeRate =
    stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const usedRate =
    stats.total_codes > 0
      ? Math.round((stats.used_codes / stats.total_codes) * 100)
      : 0;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          {refreshedAt && (
            <p className="text-xs text-gray-500 mt-0.5">
              Diperbarui {refreshedAt.toLocaleTimeString("id-ID")}
            </p>
          )}
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              d="M1 4v6h6M23 20v-6h-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {STATS.map((s) => (
          <div
            key={s.key}
            className={`bg-gray-900 ring-1 ${s.ring} rounded-xl p-4 flex items-start gap-3`}
          >
            <div
              className={`${s.iconBg} ${s.iconColor} p-2 rounded-lg shrink-0`}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">{s.label}</p>
              <p className="text-2xl font-bold leading-none">
                {(stats[s.key] as number).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary strip */}
      <div className="bg-gray-900 ring-1 ring-gray-800 rounded-xl px-5 py-4 flex flex-wrap gap-6 mb-4">
        <div className="text-sm">
          <span className="text-gray-500">Rasio aktif: </span>
          <span
            className={`font-semibold ${activeRate >= 50 ? "text-green-400" : "text-yellow-400"}`}
          >
            {activeRate}%
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Kode terpakai: </span>
          <span className="font-semibold text-brand-400">{usedRate}%</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Kode tersisa: </span>
          <span className="font-semibold text-white">
            {(stats.total_codes - stats.used_codes).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Unread banner */}
      {stats.unread_feature_requests > 0 && (
        <a
          href="/feature-requests"
          className="flex items-center gap-3 bg-yellow-900/25 border border-yellow-700/60 rounded-xl p-4 text-sm hover:bg-yellow-900/40 transition-colors"
        >
          <svg
            className="w-4 h-4 text-yellow-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-yellow-300">
            Ada <strong>{stats.unread_feature_requests}</strong> permintaan
            fitur yang belum dibaca.
          </span>
          <svg
            className="w-4 h-4 text-yellow-600 ml-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline
              points="9 18 15 12 9 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      )}
    </div>
  );
}
