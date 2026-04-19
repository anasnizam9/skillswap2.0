import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    await initDB();
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { name, bio, avatar, languages, timezone, communicationStyle } = await req.json();

    await db.execute({
      sql: `UPDATE users SET 
              name = COALESCE(?, name),
              bio = COALESCE(?, bio),
              avatar = COALESCE(?, avatar),
              languages = COALESCE(?, languages),
              timezone = COALESCE(?, timezone),
              communication_style = COALESCE(?, communication_style),
              updated_at = datetime('now')
            WHERE id = ?`,
      args: [name || null, bio || null, avatar || null, languages || null, timezone || null, communicationStyle || null, payload.userId],
    });

    const res = await db.execute({
      sql: "SELECT id, email, name, avatar, bio, languages, timezone, communication_style, tokens, reputation FROM users WHERE id = ?",
      args: [payload.userId],
    });

    return NextResponse.json({ user: res.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile", detail: String(error) }, { status: 500 });
  }
}
