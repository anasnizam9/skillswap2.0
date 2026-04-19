import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { deductTokens, addTokens } from "@/lib/tokens";

// GET sessions for current user
export async function GET(req: NextRequest) {
  try {
    await initDB();
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const sessions = await db.execute({
      sql: `SELECT s.*, 
              t.name as teacher_name, t.email as teacher_email,
              l.name as learner_name, l.email as learner_email,
              sk.name as skill_name, sk.category as skill_category
            FROM sessions s
            JOIN users t ON s.teacher_id = t.id
            JOIN users l ON s.learner_id = l.id
            JOIN skills sk ON s.skill_id = sk.id
            WHERE s.teacher_id = ? OR s.learner_id = ?
            ORDER BY s.scheduled_at DESC`,
      args: [payload.userId, payload.userId],
    });

    return NextResponse.json({ sessions: sessions.rows });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sessions", detail: String(error) }, { status: 500 });
  }
}

// POST create session
export async function POST(req: NextRequest) {
  try {
    await initDB();
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { teacherId, skillId, title, goals, scheduledAt, duration, tokensCharged } = await req.json();
    if (!teacherId || !skillId || !title || !scheduledAt) {
      return NextResponse.json({ error: "teacherId, skillId, title, scheduledAt required" }, { status: 400 });
    }

    const cost = tokensCharged || 5;

    // Deduct tokens from learner
    const deducted = await deductTokens(payload.userId, cost, "learn_session", `Session: ${title}`);
    if (!deducted) {
      return NextResponse.json({ error: "Insufficient tokens. Earn more by teaching!" }, { status: 402 });
    }

    const sessionId = uuidv4();
    // Generate a mock meeting URL
    const meetingUrl = `https://meet.skillswap.ai/room/${sessionId.slice(0, 8)}`;

    await db.execute({
      sql: `INSERT INTO sessions (id, teacher_id, learner_id, skill_id, title, goals, scheduled_at, duration, meeting_url, tokens_charged)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [sessionId, teacherId, payload.userId, skillId, title, goals || null, scheduledAt, duration || 60, meetingUrl, cost],
    });

    // Add milestone progress
    const milestoneId = uuidv4();
    await db.execute({
      sql: "INSERT OR IGNORE INTO progress (id, user_id, skill_id, milestone) VALUES (?, ?, ?, ?)",
      args: [milestoneId, payload.userId, skillId, "First session scheduled"],
    });
    await db.execute({
      sql: "UPDATE progress SET achieved = 1, achieved_at = datetime('now') WHERE user_id = ? AND skill_id = ? AND milestone = ?",
      args: [payload.userId, skillId, "First session scheduled"],
    });

    return NextResponse.json({ sessionId, meetingUrl, message: "Session booked!" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create session", detail: String(error) }, { status: 500 });
  }
}
