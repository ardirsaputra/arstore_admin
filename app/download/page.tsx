"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppRelease } from "@/lib/types";

export default function DownloadPage() {
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"features" | "changelog">("features");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/download")
      .then((r) => r.json())
      .then((data) => {
        setReleases(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const release = releases.length > 0 ? releases[0] : null;
  const olderReleases = releases.slice(1);

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
                <img src="https://ik.imagekit.io/ardirsaputra/ic_launcher.png" alt="" />
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

              <div className="shrink-0 flex flex-col gap-3 min-w-[240px]">
                {release.apk_url_arm64 && (
                  <a
                    href={release.apk_url_arm64}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-900/50"
                  >
                    ⬇ Unduh APK (ARM64)
                    <span className="text-[10px] font-normal opacity-80 block -mt-1 leading-none">Untuk HP Modern</span>
                  </a>
                )}

                {release.apk_url_arm32 && (
                  <a
                    href={release.apk_url_arm32}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex flex-col items-center justify-center gap-1 border border-gray-700"
                  >
                    <span>⬇ Unduh APK (ARM32)</span>
                    <span className="text-[10px] font-normal opacity-70">Untuk HP Keluaran Lama</span>
                  </a>
                )}

                {release.apk_url_x86 && (
                  <a
                    href={release.apk_url_x86}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex flex-col items-center justify-center gap-1 border border-gray-700"
                  >
                    <span>⬇ Unduh APK (x86)</span>
                    <span className="text-[10px] font-normal opacity-70">Untuk Emulator PC</span>
                  </a>
                )}

                {release.apk_url && (
                  <a
                    href={release.apk_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex flex-col items-center justify-center gap-1 border border-gray-700"
                  >
                    <span>⬇ Unduh APK (Universal)</span>
                    <span className="text-[10px] font-normal opacity-70">Cocok untuk Semua Perangkat (Lebih Besar)</span>
                  </a>
                )}
              </div>
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
                    className={`px-6 py-3.5 text-sm font-medium transition-colors ${activeTab === "features"
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
                    className={`px-6 py-3.5 text-sm font-medium transition-colors ${activeTab === "changelog"
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
                  <button
                    key={i}
                    onClick={() => setSelectedImage(url)}
                    className="shrink-0 cursor-zoom-in"
                  >
                    <img
                      src={url}
                      alt={`Screenshot ${i + 1}`}
                      className="h-80 w-auto rounded-xl border border-gray-800 hover:border-brand-600 transition-colors"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center py-8 border-t border-gray-800">
            <h2 className="text-xl font-bold mb-6">Pilih Versi APK</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap">
              {release.apk_url_arm64 && (
                <a
                  href={release.apk_url_arm64}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 rounded-2xl font-semibold text-sm transition-colors flex flex-col items-center justify-center gap-1 shadow-xl shadow-brand-900/50 min-w-[220px]"
                >
                  <span>⬇ Unduh (ARM64)</span>
                  <span className="text-[11px] font-normal opacity-80">Untuk HP Modern</span>
                </a>
              )}

              {release.apk_url_arm32 && (
                <a
                  href={release.apk_url_arm32}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-2xl font-semibold text-sm transition-colors flex flex-col items-center justify-center gap-1 border border-gray-700 min-w-[220px]"
                >
                  <span>⬇ Unduh (ARM32)</span>
                  <span className="text-[11px] font-normal opacity-70">Untuk HP Lama</span>
                </a>
              )}

              {release.apk_url_x86 && (
                <a
                  href={release.apk_url_x86}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-2xl font-semibold text-sm transition-colors flex flex-col items-center justify-center gap-1 border border-gray-700 min-w-[220px]"
                >
                  <span>⬇ Unduh (x86)</span>
                  <span className="text-[11px] font-normal opacity-70">Untuk Emulator PC</span>
                </a>
              )}

              {release.apk_url && (
                <a
                  href={release.apk_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-2xl font-semibold text-sm transition-colors flex flex-col items-center justify-center gap-1 border border-gray-700 min-w-[220px]"
                >
                  <span>⬇ Unduh (Universal)</span>
                  <span className="text-[11px] font-normal opacity-70">Semua Perangkat</span>
                </a>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-6">
              {release.file_size && `${release.file_size} · `}
              {release.min_android} · Gratis
            </p>
          </div>

          {/* Older releases section */}
          {olderReleases.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-800">
              <h2 className="text-xl font-bold mb-6">Versi Sebelumnya</h2>
              <div className="space-y-4">
                {olderReleases.map((old) => (
                  <div key={old.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-200">v{old.version_name}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(old.release_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {old.file_size && ` · ${old.file_size}`}
                        {` · ${old.min_android}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {old.apk_url_arm64 && (
                        <a href={old.apk_url_arm64} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors border border-gray-700">
                          ARM64
                        </a>
                      )}
                      {old.apk_url_arm32 && (
                        <a href={old.apk_url_arm32} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors border border-gray-700">
                          ARM32
                        </a>
                      )}
                      {old.apk_url_x86 && (
                        <a href={old.apk_url_x86} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors border border-gray-700">
                          x86
                        </a>
                      )}
                      {old.apk_url && (
                        <a href={old.apk_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors border border-gray-700">
                          Universal
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Modal Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Screenshot diperbesar" 
            className="max-w-full max-h-full object-contain rounded-xl" 
          />
          <button 
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            ✕
          </button>
        </div>
      )}

      <footer className="border-t border-gray-800 px-6 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} ArStore. All rights reserved.
      </footer>
    </div>
  );
}
