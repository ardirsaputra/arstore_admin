"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppRelease } from "@/lib/types";

export default function DownloadPage() {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"features" | "changelog">(
    "features",
  );

  useEffect(() => {
    fetch("/api/download")
      .then((r) => r.json())
      .then((data) => {
        setRelease(data ?? null);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <Link href="/" className="text-brand-400 font-bold text-xl">
          ArStore
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/#sewa" className="text-gray-400 hover:text-white transition-colors">
            Sewa Aplikasi
          </Link>
          <Link href="/#jasa" className="text-gray-400 hover:text-white transition-colors">
            Jasa Pembuatan
          </Link>
          <Link
            href="/login"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Admin →
          </Link>
        </div>
      </nav>

      {loading ? (
        <div className="flex items-center justify-center py-40 text-gray-500">
          Memuat...
        </div>
      ) : !release ? (
        <div className="flex flex-col items-center justify-center py-40 text-center px-6">
          <div className="text-5xl mb-4">📦</div>
          <h1 className="text-2xl font-bold mb-2">Belum Ada Rilis</h1>
          <p className="text-gray-400">
            Aplikasi sedang dalam persiapan. Cek kembali nanti.
          </p>
          <Link
            href="/"
            className="mt-6 text-brand-400 hover:text-brand-300 underline text-sm"
          >
            Kembali ke Beranda
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Hero card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* App icon placeholder */}
              <div className="w-20 h-20 bg-brand-700 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                📱
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">UtilitasKu</h1>
                <p className="text-gray-400 text-sm mb-3">
                  Aplikasi serba guna untuk Android — download, pemutar media,
                  tools, dan banyak lagi.
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    v{release.version_name}
                  </span>
                  {release.file_size && (
                    <span className="bg-gray-800 px-2 py-1 rounded">
                      {release.file_size}
                    </span>
                  )}
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    {release.min_android}
                  </span>
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    {new Date(release.release_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <a
                href={release.apk_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-brand-600 hover:bg-brand-500 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-brand-900/50"
              >
                ⬇ Unduh APK
              </a>
            </div>
          </div>

          {/* Install notice */}
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-5 py-4 mb-8 text-sm text-yellow-300/90">
            <strong>Cara install:</strong> Setelah unduhan selesai, buka file
            APK di perangkat Anda. Jika muncul peringatan "Install dari sumber
            tidak dikenal", izinkan untuk browser/pengelola file yang Anda gunakan,
            lalu coba install ulang.
          </div>

          {/* Tabs: Features & Changelog */}
          {(release.features.length > 0 || release.changelog.length > 0) && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-8">
              <div className="flex border-b border-gray-800">
                {release.features.length > 0 && (
                  <button
                    onClick={() => setActiveTab("features")}
                    className={`px-6 py-3.5 text-sm font-medium transition-colors ${
                      activeTab === "features"
                        ? "border-b-2 border-brand-400 text-brand-400"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Fitur Aplikasi
                  </button>
                )}
                {release.changelog.length > 0 && (
                  <button
                    onClick={() => setActiveTab("changelog")}
                    className={`px-6 py-3.5 text-sm font-medium transition-colors ${
                      activeTab === "changelog"
                        ? "border-b-2 border-brand-400 text-brand-400"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Changelog v{release.version_name}
                  </button>
                )}
              </div>

              <div className="p-6">
                {activeTab === "features" && release.features.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {release.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-brand-400 mt-0.5 shrink-0">✓</span>
                        <span className="text-gray-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {activeTab === "changelog" && release.changelog.length > 0 && (
                  <ul className="space-y-2">
                    {release.changelog.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-gray-500 shrink-0 mt-0.5">•</span>
                        <span className="text-gray-300">{c}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Screenshots */}
          {release.screenshots.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">Screenshot</h2>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {release.screenshots.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <img
                      src={url}
                      alt={`Screenshot ${i + 1}`}
                      className="h-80 w-auto rounded-xl border border-gray-800 hover:border-brand-600 transition-colors"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center py-8">
            <a
              href={release.apk_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-10 py-4 rounded-2xl font-semibold text-base transition-colors shadow-xl shadow-brand-900/50"
            >
              ⬇ Unduh APK v{release.version_name}
            </a>
            <p className="text-gray-500 text-xs mt-3">
              {release.file_size && `${release.file_size} · `}
              {release.min_android} · Gratis
            </p>
          </div>
        </div>
      )}

      <footer className="border-t border-gray-800 px-6 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} ArStore. All rights reserved.
      </footer>
    </div>
  );
}
