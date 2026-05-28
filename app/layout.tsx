import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArStore | Solusi Aplikasi Mobile Terbaik",
  description: "Download aplikasi UtilitasKu, sewa aplikasi siap pakai, atau pesan aplikasi custom sesuai kebutuhan bisnis Anda.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
