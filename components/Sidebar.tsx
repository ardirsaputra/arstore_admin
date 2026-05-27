"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* ── Inline SVG icon set ───────────────────────────────────────────── */
const I = {
  Dashboard: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Devices: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Keys: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <circle cx="7.5" cy="15.5" r="5" />
      <path d="m21 2-9.6 9.6M15.5 7.5l3 3" strokeLinecap="round" />
    </svg>
  ),
  Products: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
        strokeLinejoin="round"
      />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Releases: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        d="M12 3v12m0-12-4 4m4-4 4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Payment: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Chat: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Logout: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
      <polyline
        points="16 17 21 12 16 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
    </svg>
  ),
  Announce: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path d="M22 8.5C22 5.46 19.54 3 16.5 3S11 5.46 11 8.5c0 2.34 1.43 4.35 3.5 5.2V21l2-2 2 2v-7.3c2.07-.85 3.5-2.86 3.5-5.2z" strokeLinejoin="round" />
      <path d="M6 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h3l4 3V9l-4 3z" strokeLinejoin="round" />
    </svg>
  Config: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

type NavItem = {
  href: string;
  label: string;
  iconKey: keyof typeof I;
  badge?: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard",        label: "Dashboard",         iconKey: "Dashboard" },
  { href: "/devices",          label: "Perangkat",          iconKey: "Devices" },
  { href: "/codes",            label: "Kode Lisensi",       iconKey: "Keys" },
  { href: "/license-requests", label: "Request Lisensi",    iconKey: "Payment" },
  { href: "/products",         label: "Produk & Jasa",      iconKey: "Products" },
  { href: "/releases",         label: "Rilis Aplikasi",     iconKey: "Releases" },
  { href: "/announcements",    label: "Pengumuman",         iconKey: "Announce" },
  { href: "/payment-info",     label: "Info Pembayaran",    iconKey: "Payment" },
  {
    href: "/feature-requests",
    label: "Permintaan Fitur",
    iconKey: "Chat",
    badge: true,
  },
  { href: "/tools-config",     label: "Konfigurasi Tool",   iconKey: "Config" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  /* Refresh unread badge whenever the active route changes */
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.unread_feature_requests) setUnread(d.unread_feature_requests);
        else setUnread(0);
      })
      .catch(() => {});
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800/80 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand-700 flex items-center justify-center shrink-0 shadow-sm">
          <svg
            className="w-4 h-4 text-brand-200"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="leading-none">
          <p className="text-brand-400 font-bold text-sm">ArStore</p>
          <p className="text-gray-500 text-[10px] mt-0.5 font-medium tracking-wide uppercase">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-brand-700/70 text-white shadow-sm"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              }`}
            >
              <span
                className={`shrink-0 transition-colors ${active ? "text-brand-300" : "text-gray-500"}`}
              >
                {I[item.iconKey]}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && unread > 0 && (
                <span className="shrink-0 bg-yellow-500 text-yellow-950 text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full leading-none">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-gray-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
        >
          <span className="shrink-0">{I.Logout}</span>
          Keluar
        </button>
      </div>
    </aside>
  );
}
