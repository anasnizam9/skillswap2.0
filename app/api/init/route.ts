import { NextResponse } from "next/server";

// ✅ Force dynamic - build ke waqt yeh route execute nahi hoga
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { initDB } = await import("@/lib/db");
    await initDB();
    return NextResponse.json({ message: "Database initialized successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to initialize DB", detail: String(error) },
      { status: 500 }
    );
  }
}