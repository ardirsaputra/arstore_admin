'use client';

import { useState } from 'react';
import Link from 'next/link';

type Lang = 'en' | 'id';

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<Lang>('id');

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: May 28, 2026',
      intro: 'Thank you for using UtilitasKu. Your privacy is very important to us. This policy explains how we collect, use, and protect your information.',
      sections: [
        {
          title: '1. Data Collection',
          desc: 'This app is designed to operate offline as much as possible. We do not track your personal activity or secretly collect sensitive data. Basic information such as IP addresses or device metadata may be temporarily collected when you use online features like the browser or download AI models.'
        },
        {
          title: '2. Local Storage',
          desc: 'Files you download, convert, or secure via the Private Vault are stored locally on your device. We do not upload these files to our servers.'
        },
        {
          title: '3. App Permissions',
          desc: 'UtilitasKu requests certain permissions (like Storage and Camera Access) purely to run its features optimally. You are free to manage these permissions anytime via device settings.'
        },
        {
          title: '4. Data Security',
          desc: 'We use PIN systems and local encryption to protect your App Lock and Private Vault, meaning only you can access them directly from your device.'
        },
        {
          title: '5. Changes to Policy',
          desc: 'We may update this Privacy Policy from time to time. Updates will be notified through the app or upon the release of a new version.'
        },
        {
          title: '6. Contact Us',
          desc: 'If you have any questions about this Privacy Policy, please contact us via the "Submit Feedback" feature within the app or email us at fluzzzer@gmail.com.'
        }
      ],
      back: 'Back to Home'
    },
    id: {
      title: 'Kebijakan Privasi',
      lastUpdated: 'Terakhir diperbarui: 28 Mei 2026',
      intro: 'Terima kasih telah menggunakan UtilitasKu. Privasi Anda sangat penting bagi kami. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda.',
      sections: [
        {
          title: '1. Pengumpulan Data',
          desc: 'Aplikasi ini dirancang untuk beroperasi secara offline sebanyak mungkin. Kami tidak melacak aktivitas pribadi Anda atau mengumpulkan data sensitif secara diam-diam. Informasi dasar seperti alamat IP atau metadata perangkat mungkin terkumpul sementara saat Anda menggunakan fitur online seperti browser atau mengunduh model AI.'
        },
        {
          title: '2. Penyimpanan Lokal',
          desc: 'File yang Anda unduh, konversi, atau amankan melalui Brankas Pribadi (Hidden Vault) disimpan secara lokal di perangkat Anda. Kami tidak mengunggah file-file tersebut ke server kami.'
        },
        {
          title: '3. Perizinan Aplikasi',
          desc: 'UtilitasKu meminta izin tertentu (seperti Akses Penyimpanan dan Kamera) murni untuk menjalankan fitur-fiturnya secara optimal. Anda bebas untuk mengelola izin ini kapan saja lewat pengaturan perangkat.'
        },
        {
          title: '4. Keamanan Data',
          desc: 'Kami menggunakan sistem PIN dan enkripsi lokal untuk melindungi fitur Kunci Aplikasi dan Brankas Pribadi Anda, yang berarti hanya Anda yang dapat mengaksesnya secara langsung dari perangkat tersebut.'
        },
        {
          title: '5. Perubahan Kebijakan',
          desc: 'Kami mungkin akan memperbarui Kebijakan Privasi ini dari waktu ke waktu. Pembaruan akan diberitahukan melalui aplikasi atau rilis pembaruan versi terbaru.'
        },
        {
          title: '6. Hubungi Kami',
          desc: 'Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui fitur "Kirim Saran" di dalam aplikasi atau melalui email ke fluzzzer@gmail.com.'
        }
      ],
      back: 'Kembali ke Beranda'
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header & Lang Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
          <Link 
            href="/"
            className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors"
          >
            ← {t.back}
          </Link>

          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit">
            <button
              onClick={() => setLang('id')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                lang === 'id' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              ID
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                lang === 'en' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="space-y-10">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              {t.title}
            </h1>
            <p className="text-slate-500 text-sm">
              {t.lastUpdated}
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              {t.intro}
            </p>

            <div className="space-y-8">
              {t.sections.map((section, idx) => (
                <div key={idx} className="group">
                  <h2 className="text-xl font-semibold text-indigo-300 mb-3 group-hover:text-indigo-200 transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                    {section.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} UtilitasKu. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
