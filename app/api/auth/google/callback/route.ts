import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "@/lib/db";
import { addTokens } from "@/lib/tokens";
import { generateToken, hashPassword } from "@/lib/auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

type GoogleTokenResponse = {
  id_token?: string;
};

type GoogleIdTokenClaims = {
  aud?: string;
  email?: string;
  email_verified?: string;
  name?: string;
};

function redirectWithError(req: NextRequest, message: string) {
  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirectWithError(req, "Google sign-in is not configured.");
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("skillswap_google_state")?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return redirectWithError(req, "Google sign-in failed. Please try again.");
  }

  try {
    const redirectUri = new URL("/api/auth/google/callback", req.nextUrl.origin).toString();

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      return redirectWithError(req, "Unable to verify Google account.");
    }

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenData.id_token) {
      return redirectWithError(req, "Google sign-in returned invalid token.");
    }

    const verifyRes = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(tokenData.id_token)}`, {
      cache: "no-store",
    });

    if (!verifyRes.ok) {
      return redirectWithError(req, "Google token verification failed.");
    }

    const claims = (await verifyRes.json()) as GoogleIdTokenClaims;
    if (claims.aud !== clientId || !claims.email || claims.email_verified !== "true") {
      return redirectWithError(req, "Google account is not verified.");
    }

    await initDB();

    let userRes = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [claims.email],
    });

    let userId = String(userRes.rows[0]?.id || "");
    if (!userId) {
      userId = uuidv4();
      const generatedPasswordHash = await hashPassword(`google-oauth-${uuidv4()}`);

      await db.execute({
        sql: `INSERT INTO users (id, email, name, password, timezone, languages, communication_style)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          claims.email,
          claims.name || claims.email.split("@")[0],
          generatedPasswordHash,
          "UTC",
          "English",
          "casual",
        ],
      });

      await addTokens(userId, 10, "signup_bonus", "Welcome bonus tokens (Google signup)");

      userRes = await db.execute({
        sql: "SELECT * FROM users WHERE id = ?",
        args: [userId],
      });
    }

    const row = userRes.rows[0] as Record<string, unknown>;
    const token = generateToken(String(row.id), String(row.email));

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Signing you in...</title>
  </head>
  <body>
    <p>Signing you in...</p>
    <script>
      localStorage.setItem("skillswap_token", ${JSON.stringify(token)});
      window.location.replace("/dashboard");
    </script>
  </body>
</html>`;

    const response = new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });

    response.cookies.set("skillswap_google_state", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch {
    return redirectWithError(req, "Google sign-in failed. Please try again.");
  }
}
