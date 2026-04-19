import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { calculateCompatibility } from "@/lib/matching";
import { buildDemoMatches } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  try {
    await initDB();
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get("skillId");

    // Get current user profile
    const learnerRes = await db.execute({
      sql: "SELECT * FROM users WHERE id = ?", args: [payload.userId],
    });
    if (!learnerRes.rows[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const learner = learnerRes.rows[0];

    // Get learner's skill level
    let learnerSkillLevel = "beginner";
    if (skillId) {
      const ls = await db.execute({
        sql: "SELECT level FROM user_skills WHERE user_id = ? AND skill_id = ? AND role = 'learner'",
        args: [payload.userId, skillId],
      });
      if (ls.rows[0]) learnerSkillLevel = ls.rows[0].level as string;
    }

    // Find verified teachers for this skill
    let teacherQuery = `
      SELECT u.*, us.level as skill_level, us.skill_id
      FROM users u
      JOIN user_skills us ON u.id = us.user_id
      WHERE us.role = 'teacher' AND us.verified = 1 AND u.id != ? AND u.is_flagged = 0
    `;
    const args: (string | number)[] = [payload.userId];
    if (skillId) { teacherQuery += " AND us.skill_id = ?"; args.push(skillId); }

    const teachersRes = await db.execute({ sql: teacherQuery, args });

    const matches = teachersRes.rows.map((teacher) => {
      const teacherProfile = {
        id: teacher.id as string,
        languages: teacher.languages as string,
        timezone: teacher.timezone as string,
        communicationStyle: teacher.communication_style as string,
        reputation: teacher.reputation as number,
        skillLevel: teacher.skill_level as string,
        teachingSkills: [],
        learningGoals: [],
      };
      const learnerProfile = {
        id: learner.id as string,
        languages: learner.languages as string,
        timezone: learner.timezone as string,
        communicationStyle: learner.communication_style as string,
        reputation: learner.reputation as number,
        skillLevel: learnerSkillLevel,
        teachingSkills: [],
        learningGoals: [],
      };
      const score = calculateCompatibility(teacherProfile, learnerProfile);
      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        reputation: teacher.reputation,
        skillLevel: teacher.skill_level,
        skillId: teacher.skill_id,
        compatibilityScore: score,
      };
    }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    if (matches.length === 0) {
      const demoMatches = buildDemoMatches(skillId ?? undefined, learnerSkillLevel);
      return NextResponse.json({ matches: demoMatches });
    }

    // Save top matches
    for (const match of matches.slice(0, 5)) {
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await db.execute({
        sql: `INSERT OR IGNORE INTO matches (id, teacher_id, learner_id, skill_id, compatibility_score, expires_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [uuidv4(), match.teacherId as string, payload.userId, match.skillId as string, match.compatibilityScore, expiry],
      });
    }

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: "Matching failed", detail: String(error) }, { status: 500 });
  }
}
