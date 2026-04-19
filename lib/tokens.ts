import db from "./db";
import { v4 as uuidv4 } from "uuid";

export async function addTokens(userId: string, amount: number, type: string, description: string) {
  await db.execute({
    sql: "UPDATE users SET tokens = tokens + ? WHERE id = ?",
    args: [amount, userId],
  });
  await db.execute({
    sql: "INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)",
    args: [uuidv4(), userId, amount, type, description],
  });
}

export async function deductTokens(userId: string, amount: number, type: string, description: string): Promise<boolean> {
  const res = await db.execute({ sql: "SELECT tokens FROM users WHERE id = ?", args: [userId] });
  if (!res.rows[0]) return false;
  const current = res.rows[0].tokens as number;
  if (current < amount) return false;
  await db.execute({ sql: "UPDATE users SET tokens = tokens - ? WHERE id = ?", args: [amount, userId] });
  await db.execute({
    sql: "INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)",
    args: [uuidv4(), userId, -amount, type, description],
  });
  return true;
}
