import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Auto-migrate tables lazily (ignore if already exists)
async function ensureColumns() {
  try {
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS referral_uses INTEGER DEFAULT 0`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS has_claimed_referral BOOLEAN DEFAULT FALSE`;
  } catch (err) {
    console.error("Migration error:", err);
  }
}

// Ensure columns when this module is loaded (if possible) or just let it happen on the first request
let migrationRan = false;

function generateCode(): string {
  // Generates UTK-XXXXXX
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "UTK-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function deterministicCode(deviceId: string): string {
  // Generate a stable 6-char suffix from device ID hash
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let hash = 5381;
  for (let i = 0; i < deviceId.length; i++) {
    hash = (hash * 33) ^ deviceId.charCodeAt(i);
    hash = hash >>> 0; // keep as unsigned 32-bit int
  }
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[hash % chars.length];
    hash = Math.floor(hash / chars.length) + i;
  }
  return "UTK-" + suffix;
}

export async function GET(req: NextRequest) {
  try {
    if (!migrationRan) {
      await ensureColumns();
      migrationRan = true;
    }

    const { searchParams } = req.nextUrl;
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    // Find the device
    const devices = await sql`SELECT * FROM devices WHERE device_id = ${deviceId}`;

    // If device not yet registered (no trial started), generate a deterministic preview code
    // This code won't be claimable until the device registers, but it shows something to the user.
    if (devices.length === 0) {
      const previewCode = deterministicCode(deviceId);
      return NextResponse.json({
        success: true,
        referralCode: previewCode,
        hasClaimedReferral: false,
        isPreview: true, // Indicates device isn't registered yet
      });
    }

    let code = devices[0].referral_code;
    const hasClaimed = devices[0].has_claimed_referral;

    if (!code) {
      // Generate a unique code and save to DB
      while (true) {
        code = generateCode();
        try {
          await sql`UPDATE devices SET referral_code = ${code} WHERE device_id = ${deviceId}`;
          break;
        } catch (e: any) {
          if (e.code === '23505') {
            continue;
          }
          throw e;
        }
      }
    }

    return NextResponse.json({
      success: true,
      referralCode: code,
      hasClaimedReferral: hasClaimed,
    });
  } catch (error: any) {
    console.error("GET Referral Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!migrationRan) {
      await ensureColumns();
      migrationRan = true;
    }

    const body = await req.json();
    const { deviceId, code } = body;

    if (!deviceId || !code) {
      return NextResponse.json({ error: "deviceId and code are required" }, { status: 400 });
    }

    // 1. Get the current device
    const devices = await sql`SELECT * FROM devices WHERE device_id = ${deviceId}`;
    if (devices.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }
    const currentDevice = devices[0];

    // 2. Validate current device hasn't claimed yet
    if (currentDevice.has_claimed_referral) {
      return NextResponse.json({ error: "You have already claimed a referral code." }, { status: 400 });
    }
    if (currentDevice.referral_code === code) {
      return NextResponse.json({ error: "You cannot claim your own code." }, { status: 400 });
    }

    // 3. Get the owner of the code
    const ownerDevices = await sql`SELECT * FROM devices WHERE referral_code = ${code}`;
    if (ownerDevices.length === 0) {
      return NextResponse.json({ error: "Invalid referral code." }, { status: 400 });
    }
    const ownerDevice = ownerDevices[0];

    // 4. Check if max uses reached (50 uses)
    if (ownerDevice.referral_uses >= 50) {
      return NextResponse.json({ error: "Referral code has reached maximum usage limit." }, { status: 400 });
    }

    // 5. Apply the bonus (7 days to both)
    // Add +7 days to current device (claimer)
    await sql`
      UPDATE devices 
      SET 
        has_claimed_referral = TRUE,
        trial_start_date = trial_start_date + INTERVAL '7 days',
        expiry_date = COALESCE(expiry_date, NOW()) + INTERVAL '7 days'
      WHERE device_id = ${deviceId}
    `;

    // Add +7 days to owner device and increment usage
    await sql`
      UPDATE devices 
      SET 
        referral_uses = referral_uses + 1,
        trial_start_date = trial_start_date + INTERVAL '7 days',
        expiry_date = COALESCE(expiry_date, NOW()) + INTERVAL '7 days'
      WHERE device_id = ${ownerDevice.device_id}
    `;

    return NextResponse.json({ success: true, message: "Referral successfully claimed! +7 days added." });
  } catch (error: any) {
    console.error("POST Referral Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
