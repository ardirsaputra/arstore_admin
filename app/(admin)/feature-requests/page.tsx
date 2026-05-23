"use client";
import { useEffect, useState } from "react";
import type { FeatureRequest } from "@/lib/types";

export default function FeatureRequestsPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRequests() {
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

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Permintaan Fitur</h1>
      {loading ? (
        <div className="text-gray-500 text-sm">Memuat...</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className={`bg-gray-900 border rounded-xl p-4 ${r.read ? "border-gray-800" : "border-yellow-700"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm">{r.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.device_id ? `📱 ${r.device_id.slice(0, 16)}…` : "Anonim"}{" "}
                    · {new Date(r.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
                {!r.read && (
                  <button
                    onClick={() => markRead(r.id)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded shrink-0"
                  >
                    Tandai Dibaca
                  </button>
                )}
                {r.read && (
                  <span className="text-xs text-gray-600 shrink-0">
                    ✓ Dibaca
                  </span>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-gray-500 text-sm">Belum ada permintaan fitur.</p>
          )}
        </div>
      )}
    </div>
  );
}
