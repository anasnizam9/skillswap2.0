import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import { addTokens } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const body = await req.json();
    const { email, name, password, timezone, languages, communicationStyle } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Email, name, and password are required" }, { status: 400 });
    }

    const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPw = await hashPassword(password);
    const userId = uuidv4();

    await db.execute({
      sql: `INSERT INTO users (id, email, name, password, timezone, languages, communication_style)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, email, name, hashedPw, timezone || "UTC", languages || "English", communicationStyle || "casual"],
    });

    // Signup bonus tokens
    await addTokens(userId, 10, "signup_bonus", "Welcome bonus tokens");

    const token = generateToken(userId, email);
    const user = await db.execute({ sql: "SELECT id, email, name, tokens, reputation, is_verified FROM users WHERE id = ?", args: [userId] });

    return NextResponse.json({ token, user: user.rows[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed", detail: String(error) }, { status: 500 });
  }
}
