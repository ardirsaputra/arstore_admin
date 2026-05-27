"use client";
import { useState, useEffect } from "react";

// Daftar ID tool yang tersedia di aplikasi UtilitasKu
const AVAILABLE_TOOLS = [
  "downloader", "status_wa", "video_editor", "audio_editor", "video_compress", "audio_convert",
  "manga", "video_player", "music_player", "img_compress", "img_convert", "bg_remover", "kanvas",
  "foto_pdf", "pdf_foto", "gabung_pdf", "pisah_pdf", "baca_pdf", "office", "speed_test", "fake_gps",
  "alarm_baterai", "vpn", "zip", "kompas", "scan_qr", "buat_qr", "direct_wa", "browser",
  "catatan_aman", "catatan", "noise_meter", "scan_teks", "apk_extractor", "wifi_analyzer", "info_hp"
];

export default function ToolsConfigPage() {
  const [disabledTools, setDisabledTools] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/app-config")
      .then(res => res.json())
      .then(data => {
        let disabled = [];
        if (data.disabled_tools) {
          try {
            // It might be stored as a JSON string in the DB if the GET endpoint returns stringified JSON,
            // or if GET endpoint parses it. Wait, the express GET endpoint just returns raw string.
            // Let's handle both.
            if (typeof data.disabled_tools === "string") {
              disabled = JSON.parse(data.disabled_tools);
            } else {
              disabled = data.disabled_tools;
            }
          } catch(e) {
            console.error("Failed to parse disabled_tools", e);
          }
        }
        setDisabledTools(disabled);
        setIsLoading(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoading(false);
      });
  }, []);

  const toggleTool = (toolId: string) => {
    if (disabledTools.includes(toolId)) {
      setDisabledTools(prev => prev.filter(t => t !== toolId));
    } else {
      setDisabledTools(prev => [...prev, toolId]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/app-config/disabled_tools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: disabledTools })
      });
      if (res.ok) {
        alert("Berhasil menyimpan konfigurasi tools!");
      } else {
        alert("Gagal menyimpan konfigurasi.");
      }
    } catch(e) {
      alert("Error: " + e);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="p-6 text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">Konfigurasi Tool Aplikasi</h1>
      <p className="text-gray-400 mb-8 text-sm">
        Pilih tool yang ingin <strong>dinonaktifkan (disembunyikan)</strong> dari aplikasi UtilitasKu milik pengguna.
        Tool yang dicentang tidak akan tampil di beranda aplikasi.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {AVAILABLE_TOOLS.map(tool => {
            const isDisabled = disabledTools.includes(tool);
            return (
              <label 
                key={tool} 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isDisabled ? "bg-red-950/20 border-red-900/50" : "bg-gray-800/50 border-gray-800 hover:bg-gray-800 hover:border-gray-700"
                }`}
              >
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
                  checked={isDisabled}
                  onChange={() => toggleTool(tool)}
                />
                <span className={`text-sm font-medium ${isDisabled ? "text-red-400" : "text-gray-300"}`}>
                  {tool}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
        </button>
      </div>
    </div>
  );
}
