import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { generateAssessmentQuestions } from "@/lib/matching";

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { skillId, level } = await req.json();
    if (!skillId || !level) {
      return NextResponse.json({ error: "skillId and level required" }, { status: 400 });
    }

    const skillRes = await db.execute({ sql: "SELECT * FROM skills WHERE id = ?", args: [skillId] });
    if (!skillRes.rows[0]) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

    const skill = skillRes.rows[0];
    const questions = generateAssessmentQuestions(skill.name as string, level);
    // Strip answers before sending to client
    const clientQuestions = questions.map(({ answer: _, ...q }) => q);

    const assessmentId = uuidv4();
    await db.execute({
      sql: "INSERT INTO assessments (id, user_id, skill_id, questions) VALUES (?, ?, ?, ?)",
      args: [assessmentId, payload.userId, skillId, JSON.stringify(questions)],
    });

    return NextResponse.json({ assessmentId, questions: clientQuestions, skillName: skill.name });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate assessment", detail: String(error) }, { status: 500 });
  }
}
