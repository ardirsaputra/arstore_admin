"use client";
import { useEffect, useState } from "react";
import type { FeatureRequest } from "@/lib/types";

export default function FeatureRequestsPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  async function loadRequests() {
    setLoading(true);
    const res = await fetch("/api/admin/feature-requests");
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/admin/feature-requests/${id}/read`, { method: "PATCH" });
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, read: true } : r)),
    );
  }

  async function markAllRead() {
    const unread = requests.filter((r) => !r.read);
    await Promise.all(
      unread.map((r) =>
        fetch(`/api/admin/feature-requests/${r.id}/read`, { method: "PATCH" }),
      ),
    );
    setRequests((prev) => prev.map((r) => ({ ...r, read: true })));
  }

  const unreadCount = requests.filter((r) => !r.read).length;
  const visible =
    filter === "unread" ? requests.filter((r) => !r.read) : requests;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Permintaan Fitur</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-yellow-400 mt-0.5">
              {unreadCount} belum dibaca
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-900 ring-1 ring-gray-800 rounded-xl p-1 w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === f
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {f === "all"
              ? `Semua (${requests.length})`
              : `Belum Dibaca (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-gray-500 text-sm animate-pulse">Memuat…</div>
      ) : visible.length === 0 ? (
        <p className="text-gray-500 text-sm">
          {filter === "unread"
            ? "Tidak ada permintaan yang belum dibaca."
            : "Belum ada permintaan fitur."}
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => (
            <div
              key={r.id}
              className={`bg-gray-900 rounded-xl p-4 ring-1 transition-colors ${
                r.read ? "ring-gray-800" : "ring-yellow-700/70"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Unread dot */}
                <div
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${r.read ? "bg-gray-700" : "bg-yellow-500"}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{r.message}</p>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                    </svg>
                    {r.device_id ? `${r.device_id.slice(0, 16)}…` : "Anonim"}
                    <span className="text-gray-700">·</span>
                    {new Date(r.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                {!r.read ? (
                  <button
                    onClick={() => markRead(r.id)}
                    className="text-xs shrink-0 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Dibaca
                  </button>
                ) : (
                  <span className="text-xs text-gray-600 shrink-0 mt-0.5">
                    ✓
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
