import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import {
  getAllPackages,
  replaceAllPackages,
  type PricingPackage,
} from "@/lib/pricing";

// GET — daftar semua paket (termasuk nonaktif) untuk editor admin.
export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const packages = await getAllPackages();
    return NextResponse.json({ packages });
  } catch (err) {
    console.error("Admin get pricing error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// PUT — ganti seluruh daftar paket dengan yang dikirim admin.
export async function PUT(req: NextRequest) {
  if (!getAdminFromRequest(req))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const raw = body?.packages;
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json(
        { message: "packages harus berupa array tidak kosong" },
        { status: 400 },
      );
    }

    // Validasi & normalisasi tiap paket
    const seenIds = new Set<string>();
    const packages: PricingPackage[] = [];
    for (let i = 0; i < raw.length; i++) {
      const p = raw[i] ?? {};
      const id = String(p.id ?? "").trim();
      if (!id) {
        return NextResponse.json(
          { message: `Paket #${i + 1}: id wajib diisi` },
          { status: 400 },
        );
      }
      if (seenIds.has(id)) {
        return NextResponse.json(
          { message: `Paket id duplikat: ${id}` },
          { status: 400 },
        );
      }
      seenIds.add(id);

      const priceUsd = Number(p.priceUsd);
      if (!Number.isFinite(priceUsd) || priceUsd < 0) {
        return NextResponse.json(
          { message: `Paket ${id}: priceUsd tidak valid` },
          { status: 400 },
        );
      }

      const isLifetime = Boolean(p.isLifetime);
      const monthsRaw = p.months;
      const months =
        isLifetime || monthsRaw == null || monthsRaw === ""
          ? null
          : Number(monthsRaw);
      if (months != null && (!Number.isInteger(months) || months <= 0)) {
        return NextResponse.json(
          { message: `Paket ${id}: months harus bilangan bulat positif` },
          { status: 400 },
        );
      }

      const regularRaw = p.regularUsd;
      const regularUsd =
        regularRaw == null || regularRaw === "" ? null : Number(regularRaw);
      if (regularUsd != null && (!Number.isFinite(regularUsd) || regularUsd < 0)) {
        return NextResponse.json(
          { message: `Paket ${id}: regularUsd tidak valid` },
          { status: 400 },
        );
      }

      packages.push({
        id,
        months,
        priceUsd,
        regularUsd,
        isPopular: Boolean(p.isPopular),
        isLifetime,
        isActive: p.isActive !== false,
        sortOrder: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : i + 1,
      });
    }

    await replaceAllPackages(packages);
    const saved = await getAllPackages();
    return NextResponse.json({ packages: saved });
  } catch (err) {
    console.error("Admin update pricing error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
