import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await initDB();
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const badges = await db.execute({
      sql: `SELECT b.*, s.name as skill_name, s.category
            FROM badges b JOIN skills s ON b.skill_id = s.id
            WHERE b.user_id = ? ORDER BY b.issued_at DESC`,
      args: [payload.userId],
    });

    return NextResponse.json({ badges: badges.rows });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch badges", detail: String(error) }, { status: 500 });
  }
}
