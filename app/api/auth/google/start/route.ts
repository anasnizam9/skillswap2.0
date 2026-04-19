import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function getGoogleEnv() {
  const clientId = (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.AUTH_GOOGLE_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  ).trim();

  const clientSecret = (
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.AUTH_GOOGLE_SECRET ||
    ""
  ).trim();

  return { clientId, clientSecret };
}

export async function GET(req: NextRequest) {
  const { clientId, clientSecret } = getGoogleEnv();

  if (!clientId || !clientSecret) {
    const missing: string[] = [];
    if (!clientId) missing.push("GOOGLE_CLIENT_ID/AUTH_GOOGLE_ID");
    if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET/AUTH_GOOGLE_SECRET");

    const fallback = new URL("/login", req.nextUrl.origin);
    fallback.searchParams.set("error", `Google sign-in is not configured: missing ${missing.join(", ")}`);
    return NextResponse.redirect(fallback);
  }

  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/auth/google/callback", req.nextUrl.origin).toString();

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("skillswap_google_state", state, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 10 * 60,
    path: "/",
  });

  return res;
}
