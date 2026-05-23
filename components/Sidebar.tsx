"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/devices", label: "Perangkat", icon: "📱" },
  { href: "/codes", label: "Kode Lisensi", icon: "🔑" },
  { href: "/products", label: "Produk & Jasa", icon: "🛍️" },
  { href: "/releases", label: "Rilis Aplikasi", icon: "📦" },
  { href: "/payment-info", label: "Info Pembayaran", icon: "💳" },
  { href: "/feature-requests", label: "Permintaan Fitur", icon: "💬" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-gray-800">
        <span className="text-brand-400 font-bold text-lg">ArStore Admin</span>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname.startsWith(item.href)
                ? "bg-brand-700 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full text-left text-sm text-gray-500 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          🚪 Keluar
        </button>
      </div>
    </aside>
  );
}
