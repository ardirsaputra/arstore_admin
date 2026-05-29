"use client";
import { useState, useEffect } from "react";

// Daftar ID tool beserta nama fiturnya yang tersedia di aplikasi UtilitasKu
const AVAILABLE_TOOLS = [
  { id: "downloader", name: "Downloader" },
  { id: "status_wa", name: "Status WA" },
  { id: "video_editor", name: "Video Editor" },
  { id: "audio_editor", name: "Audio Editor" },
  { id: "video_compress", name: "Kompres Video" },
  { id: "audio_convert", name: "Konversi Audio" },
  { id: "manga", name: "Manga Reader" },
  { id: "video_player", name: "Pemutar Video" },
  { id: "music_player", name: "Pemutar Musik" },
  { id: "img_compress", name: "Kompres Gambar" },
  { id: "img_convert", name: "Konversi Gambar" },
  { id: "bg_remover", name: "Penghapus Background" },
  { id: "kanvas", name: "Kanvas Gambar" },
  { id: "foto_pdf", name: "Foto ke PDF" },
  { id: "pdf_foto", name: "PDF ke Foto" },
  { id: "gabung_pdf", name: "Gabung PDF" },
  { id: "pisah_pdf", name: "Pisah PDF" },
  { id: "baca_pdf", name: "Pembaca PDF" },
  { id: "office", name: "Office Reader" },
  { id: "speed_test", name: "Speed Test" },
  { id: "fake_gps", name: "Fake GPS" },
  { id: "alarm_baterai", name: "Alarm Baterai" },
  { id: "vpn", name: "VPN WARP" },
  { id: "zip", name: "Ekstrak ZIP" },
  { id: "kompas", name: "Kompas" },
  { id: "scan_qr", name: "Scan QR/Barcode" },
  { id: "buat_qr", name: "Pembuat QR" },
  { id: "direct_wa", name: "Direct WhatsApp" },
  { id: "browser", name: "Browser AdBlock" },
  { id: "catatan_aman", name: "Catatan Aman" },
  { id: "catatan", name: "Catatan Biasa" },
  { id: "noise_meter", name: "Noise Meter" },
  { id: "scan_teks", name: "Scan Teks (OCR)" },
  { id: "apk_extractor", name: "APK Extractor" },
  { id: "wifi_analyzer", name: "WiFi Analyzer" },
  { id: "info_hp", name: "Info Perangkat" },
  { id: "volume_booster", name: "Volume Booster" },
  { id: "network_lock", name: "Pengunci 4G/5G" },
  { id: "settings", name: "Pengaturan" }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AVAILABLE_TOOLS.map(tool => {
            const isDisabled = disabledTools.includes(tool.id);
            return (
              <label 
                key={tool.id} 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isDisabled ? "bg-red-950/20 border-red-900/50" : "bg-gray-800/50 border-gray-800 hover:bg-gray-800 hover:border-gray-700"
                }`}
              >
                <input 
                  type="checkbox" 
                  className="w-5 h-5 mt-0.5 rounded bg-gray-900 border-gray-700 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
                  checked={isDisabled}
                  onChange={() => toggleTool(tool.id)}
                />
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${isDisabled ? "text-red-400" : "text-gray-200"}`}>
                    {tool.name}
                  </span>
                  <span className="text-xs text-gray-500 font-mono mt-0.5">
                    {tool.id}
                  </span>
                </div>
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
