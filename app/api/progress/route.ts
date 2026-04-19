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

    const progress = await db.execute({
      sql: `SELECT p.*, s.name as skill_name, s.category
            FROM progress p JOIN skills s ON p.skill_id = s.id
            WHERE p.user_id = ? ORDER BY p.created_at DESC`,
      args: [payload.userId],
    });

    const sessionStats = await db.execute({
      sql: `SELECT 
              COUNT(CASE WHEN learner_id = ? AND status = 'completed' THEN 1 END) as sessions_learned,
              COUNT(CASE WHEN teacher_id = ? AND status = 'completed' THEN 1 END) as sessions_taught
            FROM sessions`,
      args: [payload.userId, payload.userId],
    });

    const skillsLearning = await db.execute({
      sql: `SELECT us.*, s.name as skill_name FROM user_skills us
            JOIN skills s ON us.skill_id = s.id
            WHERE us.user_id = ? AND us.role = 'learner'`,
      args: [payload.userId],
    });

    return NextResponse.json({
      milestones: progress.rows,
      sessionStats: sessionStats.rows[0],
      skillsLearning: skillsLearning.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch progress", detail: String(error) }, { status: 500 });
  }
}
