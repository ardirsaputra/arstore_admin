"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product, AppRelease } from "@/lib/types";

interface Contact {
  whatsapp: string | null;
  email: string | null;
  note: string | null;
}

function formatPrice(price: number) {
  if (price === 0) return "Hubungi Kami";
  return "Rp " + price.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
}

function ProductCard({ p, whatsapp }: { p: Product; whatsapp: string | null }) {
  const waLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Halo, saya tertarik dengan ${p.name}. Bisa info lebih lanjut?`,
      )}`
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-brand-600 transition-colors">
      {p.image_url && (
        <img
          src={p.image_url}
          alt={p.name}
          className="w-full h-40 object-cover rounded-xl mb-4"
        />
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-lg font-bold text-white">{p.name}</h3>
        {p.duration && (
          <span className="text-xs bg-brand-700/40 text-brand-300 px-2 py-1 rounded-full whitespace-nowrap">
            {p.duration}
          </span>
        )}
      </div>
      {p.description && (
        <p className="text-gray-400 text-sm mb-4">{p.description}</p>
      )}
      {p.features.length > 0 && (
        <ul className="space-y-1 mb-4 flex-1">
          {p.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-brand-400 mt-0.5">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-4 border-t border-gray-800">
        <p className="text-2xl font-bold text-brand-400 mb-3">
          {formatPrice(p.price)}
        </p>
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Pesan Sekarang
          </a>
        ) : (
          <button className="block w-full text-center bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
            Pesan Sekarang
          </button>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/contact").then((r) => r.json()),
      fetch("/api/download").then((r) => r.json()),
    ]).then(([prods, cont, rel]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setContact(cont);
      setRelease(rel ?? null);
      setLoading(false);
    });
  }, []);

  const rental = products.filter((p) => p.category === "rental");
  const development = products.filter((p) => p.category === "development");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <span className="text-brand-400 font-bold text-xl">ArStore</span>
        <div className="flex items-center gap-5 text-sm">
          <a href="#sewa" className="text-gray-400 hover:text-white transition-colors hidden sm:block">
            Sewa Aplikasi
          </a>
          <a href="#jasa" className="text-gray-400 hover:text-white transition-colors hidden sm:block">
            Jasa Pembuatan
          </a>
          <Link
            href="/download"
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
          >
            Download
          </Link>
          <Link
            href="/login"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Admin →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Solusi Aplikasi{" "}
          <span className="text-brand-400">Mobile Terbaik</span>
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Sewa aplikasi siap pakai atau pesan aplikasi custom sesuai kebutuhan
          bisnis Anda. Terjangkau, andal, dan penuh fitur.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/download"
            className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            ⬇ Download Aplikasi
          </Link>
          <a
            href="#sewa"
            className="border border-gray-700 hover:border-brand-600 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Lihat Paket Sewa
          </a>
          <a
            href="#jasa"
            className="border border-gray-700 hover:border-brand-600 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Jasa Pembuatan
          </a>
        </div>
      </section>

      {/* Download app banner */}
      {!loading && release && (
        <section className="max-w-4xl mx-auto px-6 pb-4">
          <div className="bg-gradient-to-r from-brand-900/60 to-brand-800/30 border border-brand-700/50 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-brand-300 text-xs font-medium mb-1">
                TERSEDIA SEKARANG
              </p>
              <h3 className="font-bold text-white">
                UtilitasKu v{release.version_name}
              </h3>
              <p className="text-gray-400 text-sm mt-0.5">
                {release.file_size && `${release.file_size} · `}
                {release.min_android}
              </p>
            </div>
            <Link
              href="/download"
              className="shrink-0 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              ⬇ Unduh APK
            </Link>
          </div>
        </section>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Memuat...</div>
      ) : (
        <>
          {/* Rental section */}
          {rental.length > 0 && (
            <section id="sewa" className="max-w-6xl mx-auto px-6 py-16">
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-2">Sewa Aplikasi</h2>
                <p className="text-gray-400">
                  Gunakan aplikasi kami langsung — tanpa biaya pengembangan,
                  langsung aktif.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rental.map((p) => (
                  <ProductCard key={p.id} p={p} whatsapp={contact?.whatsapp ?? null} />
                ))}
              </div>
            </section>
          )}

          {/* Development section */}
          {development.length > 0 && (
            <section id="jasa" className="max-w-6xl mx-auto px-6 py-16">
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-2">
                  Jasa Pembuatan Aplikasi
                </h2>
                <p className="text-gray-400">
                  Butuh aplikasi custom? Kami siap membangun sesuai kebutuhan
                  bisnis Anda.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {development.map((p) => (
                  <ProductCard key={p.id} p={p} whatsapp={contact?.whatsapp ?? null} />
                ))}
              </div>
            </section>
          )}

          {rental.length === 0 && development.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              Produk akan segera tersedia.
            </div>
          )}
        </>
      )}

      {/* Contact section */}
      <section className="border-t border-gray-800 bg-gray-900 mt-8">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Hubungi Kami</h2>
          <p className="text-gray-400 mb-8">
            Punya pertanyaan? Kami siap membantu.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {contact?.whatsapp && (
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                WhatsApp
              </a>
            )}
            {contact?.email && (
              <a
                href={`mailto:${contact.email}`}
                className="border border-gray-700 hover:border-brand-600 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                {contact.email}
              </a>
            )}
          </div>
          {contact?.note && (
            <p className="text-gray-500 text-sm mt-8 max-w-lg mx-auto">
              {contact.note}
            </p>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} ArStore. All rights reserved.
      </footer>
    </div>
  );
}
