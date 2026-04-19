import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { sessionId, ratedUserId, score, comment } = await req.json();
    if (!sessionId || !ratedUserId || !score) {
      return NextResponse.json({ error: "sessionId, ratedUserId, score required" }, { status: 400 });
    }
    if (score < 1 || score > 5) {
      return NextResponse.json({ error: "Score must be between 1 and 5" }, { status: 400 });
    }

    // Verify user is part of session
    const sessionRes = await db.execute({
      sql: "SELECT * FROM sessions WHERE id = ? AND (teacher_id = ? OR learner_id = ?)",
      args: [sessionId, payload.userId, payload.userId],
    });
    if (!sessionRes.rows[0]) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    // Prevent self-rating
    if (payload.userId === ratedUserId) {
      return NextResponse.json({ error: "Cannot rate yourself" }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.execute({
      sql: "SELECT id FROM ratings WHERE session_id = ? AND rater_id = ?",
      args: [sessionId, payload.userId],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Already rated this session" }, { status: 409 });
    }

    const ratingId = uuidv4();
    await db.execute({
      sql: "INSERT INTO ratings (id, session_id, rater_id, rated_user_id, score, comment) VALUES (?, ?, ?, ?, ?, ?)",
      args: [ratingId, sessionId, payload.userId, ratedUserId, score, comment || null],
    });

    // Recalculate reputation for rated user
    const allRatings = await db.execute({
      sql: "SELECT AVG(score) as avg_score, COUNT(*) as count FROM ratings WHERE rated_user_id = ?",
      args: [ratedUserId],
    });
    const avgScore = allRatings.rows[0]?.avg_score as number || 5;
    const count = allRatings.rows[0]?.count as number || 0;

    await db.execute({
      sql: "UPDATE users SET reputation = ? WHERE id = ?",
      args: [Math.round(avgScore * 10) / 10, ratedUserId],
    });

    // AI flag check: if reputation drops below 3 with 5+ ratings, flag user
    if (avgScore < 3 && count >= 5) {
      await db.execute({
        sql: "UPDATE users SET is_flagged = 1 WHERE id = ?",
        args: [ratedUserId],
      });
    }

    return NextResponse.json({ message: "Rating submitted", newReputation: Math.round(avgScore * 10) / 10 }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit rating", detail: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await initDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const ratings = await db.execute({
      sql: `SELECT r.*, u.name as rater_name FROM ratings r
            JOIN users u ON r.rater_id = u.id
            WHERE r.rated_user_id = ? ORDER BY r.created_at DESC LIMIT 20`,
      args: [userId],
    });

    const stats = await db.execute({
      sql: "SELECT AVG(score) as avg, COUNT(*) as total FROM ratings WHERE rated_user_id = ?",
      args: [userId],
    });

    return NextResponse.json({ ratings: ratings.rows, stats: stats.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ratings", detail: String(error) }, { status: 500 });
  }
}
