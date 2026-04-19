import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const res = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = res.rows[0];
    const valid = await comparePassword(password, user.password as string);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = generateToken(user.id as string, user.email as string);
    const { password: _, ...safeUser } = user;

    return NextResponse.json({ token, user: safeUser });
  } catch (error) {
    return NextResponse.json({ error: "Login failed", detail: String(error) }, { status: 500 });
  }
}
