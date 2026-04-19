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

    const res = await db.execute({
      sql: `SELECT id, email, name, avatar, bio, languages, timezone, communication_style,
              tokens, reputation, is_verified, is_flagged, created_at
            FROM users WHERE id = ?`,
      args: [payload.userId],
    });
    if (res.rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const skills = await db.execute({
      sql: `SELECT us.id, us.user_id, us.skill_id, us.level, us.role, us.verified, us.verified_at, us.created_at,
              s.name as skill_name, s.category
            FROM user_skills us
            JOIN skills s ON us.skill_id = s.id
            WHERE us.user_id = ?`,
      args: [payload.userId],
    });

    const badges = await db.execute({
      sql: `SELECT b.*, s.name as skill_name FROM badges b
            JOIN skills s ON b.skill_id = s.id
            WHERE b.user_id = ? ORDER BY b.issued_at DESC`,
      args: [payload.userId],
    });

    return NextResponse.json({ user: res.rows[0], skills: skills.rows, badges: badges.rows });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user", detail: String(error) }, { status: 500 });
  }
}
