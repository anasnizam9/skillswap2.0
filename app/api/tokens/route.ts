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

    const balanceRes = await db.execute({
      sql: "SELECT tokens FROM users WHERE id = ?", args: [payload.userId],
    });

    const transactions = await db.execute({
      sql: "SELECT * FROM token_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      args: [payload.userId],
    });

    const stats = await db.execute({
      sql: `SELECT 
              SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
              SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent
            FROM token_transactions WHERE user_id = ?`,
      args: [payload.userId],
    });

    return NextResponse.json({
      balance: balanceRes.rows[0]?.tokens ?? 0,
      transactions: transactions.rows,
      stats: stats.rows[0],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tokens", detail: String(error) }, { status: 500 });
  }
}
