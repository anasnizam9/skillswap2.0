import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { addTokens } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { assessmentId, answers } = await req.json();
    if (!assessmentId || !answers) {
      return NextResponse.json({ error: "assessmentId and answers required" }, { status: 400 });
    }

    const res = await db.execute({
      sql: "SELECT * FROM assessments WHERE id = ? AND user_id = ?",
      args: [assessmentId, payload.userId],
    });
    if (!res.rows[0]) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

    const assessment = res.rows[0];
    if (assessment.completed_at) {
      return NextResponse.json({ error: "Assessment already completed" }, { status: 400 });
    }

    const questions = JSON.parse(assessment.questions as string);
    let correct = 0;
    questions.forEach((q: { answer: number }, i: number) => {
      if (answers[i] === q.answer) correct++;
    });

    const score = (correct / questions.length) * 100;
    const passed = score >= 60;

    await db.execute({
      sql: "UPDATE assessments SET answers = ?, score = ?, passed = ?, completed_at = datetime('now') WHERE id = ?",
      args: [JSON.stringify(answers), score, passed ? 1 : 0, assessmentId],
    });

    if (passed) {
      await db.execute({
        sql: "UPDATE user_skills SET verified = 1, verified_at = datetime('now') WHERE user_id = ? AND skill_id = ? AND role = 'teacher'",
        args: [payload.userId, assessment.skill_id as string],
      });
      await addTokens(payload.userId, 5, "verification_bonus", "Skill verification bonus");
    }

    return NextResponse.json({
      score: Math.round(score),
      passed,
      correct,
      total: questions.length,
      message: passed
        ? "Congratulations! You are now a verified teacher for this skill."
        : "You need 60% to pass. Please try again after more practice.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit assessment", detail: String(error) }, { status: 500 });
  }
}
