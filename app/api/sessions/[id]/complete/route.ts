import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { addTokens } from "@/lib/tokens";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { id } = await params;
    const { notes } = await req.json();

    const sessionRes = await db.execute({
      sql: "SELECT * FROM sessions WHERE id = ?", args: [id],
    });
    if (!sessionRes.rows[0]) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const session = sessionRes.rows[0];
    if (session.teacher_id !== payload.userId && session.learner_id !== payload.userId) {
      return NextResponse.json({ error: "Not authorized for this session" }, { status: 403 });
    }

    await db.execute({
      sql: "UPDATE sessions SET status = 'completed', notes = ?, updated_at = datetime('now') WHERE id = ?",
      args: [notes || null, id],
    });

    // Pay teacher tokens
    await addTokens(session.teacher_id as string, session.tokens_charged as number, "teach_session", `Completed session: ${session.title}`);

    // Check if teacher has completed 5 sessions to award badge
    const completedCount = await db.execute({
      sql: "SELECT COUNT(*) as count FROM sessions WHERE teacher_id = ? AND status = 'completed'",
      args: [session.teacher_id as string],
    });
    const count = completedCount.rows[0]?.count as number;

    if (count >= 5) {
      const skillRes = await db.execute({ sql: "SELECT name FROM skills WHERE id = ?", args: [session.skill_id as string] });
      const skillName = skillRes.rows[0]?.name as string;
      const existingBadge = await db.execute({
        sql: "SELECT id FROM badges WHERE user_id = ? AND skill_id = ?",
        args: [session.teacher_id as string, session.skill_id as string],
      });
      if (existingBadge.rows.length === 0) {
        const badgeId = uuidv4();
        const shareUrl = `https://skillswap.ai/badge/${badgeId}`;
        const linkedinUrl = `https://linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=SkillSwap+${skillName}+Badge`;
        await db.execute({
          sql: `INSERT INTO badges (id, user_id, skill_id, title, description, share_url, linkedin_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            badgeId, session.teacher_id as string, session.skill_id as string,
            `Verified ${skillName} Teacher`,
            `Completed 5+ teaching sessions in ${skillName} on SkillSwap AI`,
            shareUrl, linkedinUrl,
          ],
        });
        await addTokens(session.teacher_id as string, 20, "badge_reward", `Badge earned: Verified ${skillName} Teacher`);
      }
    }

    // Add progress milestone for learner
    const progressId = uuidv4();
    await db.execute({
      sql: "INSERT OR IGNORE INTO progress (id, user_id, skill_id, milestone) VALUES (?, ?, ?, ?)",
      args: [progressId, session.learner_id as string, session.skill_id as string, "Completed first session"],
    });
    await db.execute({
      sql: "UPDATE progress SET achieved = 1, achieved_at = datetime('now') WHERE user_id = ? AND skill_id = ? AND milestone = ?",
      args: [session.learner_id as string, session.skill_id as string, "Completed first session"],
    });

    return NextResponse.json({ message: "Session completed!", tokensAwarded: session.tokens_charged });
  } catch (error) {
    return NextResponse.json({ error: "Failed to complete session", detail: String(error) }, { status: 500 });
  }
}
