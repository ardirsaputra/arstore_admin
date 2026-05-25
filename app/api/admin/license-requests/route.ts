import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await sql`
      SELECT 
        lr.id, lr.user_id, lr.requested_months, lr.proof_image, lr.status, 
        lr.admin_note, lr.created_at,
        au.email
      FROM license_requests lr
      JOIN app_users au ON lr.user_id = au.id
      ORDER BY lr.created_at DESC
    `;
    return NextResponse.json(requests);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, adminNote } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const reqData = await sql`SELECT * FROM license_requests WHERE id = ${id}`;
    if (reqData.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const request = reqData[0];

    // If approving, add time to user's expiry_date
    if (status === 'approved' && request.status !== 'approved') {
      const user = (await sql`SELECT * FROM app_users WHERE id = ${request.user_id}`)[0];
      
      let newExpiry = new Date();
      if (user.expiry_date && new Date(user.expiry_date) > new Date()) {
        newExpiry = new Date(user.expiry_date);
      }
      
      newExpiry.setMonth(newExpiry.getMonth() + request.requested_months);

      await sql`
        UPDATE app_users 
        SET status = 'active', expiry_date = ${newExpiry.toISOString()}
        WHERE id = ${request.user_id}
      `;
    }

    // Update request
    // The user requested: "jika sudah disetujui data gambar ini hilang untuk menjaga memori"
    // So we set proof_image to NULL to free up space.
    let proofVal = request.proof_image;
    if (status === 'approved' || status === 'rejected') {
      proofVal = null;
    }

    await sql`
      UPDATE license_requests 
      SET status = ${status}, admin_note = ${adminNote || null}, proof_image = ${proofVal}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
