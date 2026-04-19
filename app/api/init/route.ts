import { NextResponse } from "next/server";
import { initDB } from "@/lib/db";

export async function GET() {
  try {
    await initDB();
    return NextResponse.json({ message: "Database initialized successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to initialize DB", detail: String(error) }, { status: 500 });
  }
}
