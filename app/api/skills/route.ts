import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { DEMO_SKILLS } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  try {
    await initDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const userId = searchParams.get("userId");

    if (userId) {
      const res = await db.execute({
        sql: `SELECT us.id, us.user_id, us.skill_id, us.level, us.role, us.verified, us.verified_at, us.created_at,
                s.name as skill_name, s.category
              FROM user_skills us
              JOIN skills s ON us.skill_id = s.id
              WHERE us.user_id = ?`,
        args: [userId],
      });
      return NextResponse.json({ skills: res.rows });
    }

    let sql = "SELECT * FROM skills";
    const args: string[] = [];
    if (category) { sql += " WHERE category = ?"; args.push(category); }
    sql += " ORDER BY name ASC";

    const res = await db.execute({ sql, args });
    if (res.rows.length === 0) {
      return NextResponse.json({ skills: DEMO_SKILLS.map((skill) => ({ ...skill, teacherCount: 0 })) });
    }

    const skillsWithCount = await Promise.all(res.rows.map(async (skill) => {
      const count = await db.execute({
        sql: "SELECT COUNT(*) as count FROM user_skills WHERE skill_id = ? AND role = 'teacher' AND verified = 1",
        args: [skill.id as string],
      });
      return { ...skill, teacherCount: count.rows[0]?.count ?? 0 };
    }));

    return NextResponse.json({ skills: skillsWithCount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch skills", detail: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { skillId, level, role } = await req.json();
    if (!skillId || !level || !role) {
      return NextResponse.json({ error: "skillId, level, and role are required" }, { status: 400 });
    }

    const existing = await db.execute({
      sql: "SELECT id FROM user_skills WHERE user_id = ? AND skill_id = ? AND role = ?",
      args: [payload.userId, skillId, role],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "You already have this skill listed for this role" }, { status: 409 });
    }

    const id = uuidv4();
    await db.execute({
      sql: "INSERT INTO user_skills (id, user_id, skill_id, level, role) VALUES (?, ?, ?, ?, ?)",
      args: [id, payload.userId, skillId, level, role],
    });

    return NextResponse.json({ message: "Skill added successfully", id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add skill", detail: String(error) }, { status: 500 });
  }
}
