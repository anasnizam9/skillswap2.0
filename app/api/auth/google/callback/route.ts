import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

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

function redirectWithError(req: NextRequest, message: string) {
  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const { clientId, clientSecret } = getGoogleEnv();

  if (!clientId || !clientSecret) {
    const missing: string[] = [];
    if (!clientId) missing.push("GOOGLE_CLIENT_ID/AUTH_GOOGLE_ID");
    if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET/AUTH_GOOGLE_SECRET");
    return redirectWithError(req, `Google sign-in is not configured: missing ${missing.join(", ")}`);
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("skillswap_google_state")?.value;

 if (!code) {
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
    const userId = uuidv4();
    const userEmail = claims.email;
    const userName = claims.name || claims.email.split("@")[0];
    const createdAt = new Date().toISOString();

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
      (function () {
        var STATE_KEY = "skillswap_mock_state_v1";
        var user = {
          id: ${JSON.stringify(userId)},
          email: ${JSON.stringify(userEmail)},
          name: ${JSON.stringify(userName)},
          avatar: undefined,
          bio: "Google OAuth user",
          languages: "English",
          timezone: "UTC",
          communication_style: "casual",
          tokens: 10,
          reputation: 0,
          is_verified: 1,
          is_flagged: 0,
          created_at: ${JSON.stringify(createdAt)},
          password: "google-oauth"
        };

        var state = {
          users: [],
          skills: [],
          userSkills: [],
          sessions: [],
          ratings: [],
          badges: [],
          tokenTransactions: [],
          progress: [],
          assessments: []
        };

        try {
          var raw = localStorage.getItem(STATE_KEY);
          if (raw) {
            var parsed = JSON.parse(raw);
            state = Object.assign(state, parsed || {});
            state.users = Array.isArray(state.users) ? state.users : [];
            state.skills = Array.isArray(state.skills) ? state.skills : [];
            state.userSkills = Array.isArray(state.userSkills) ? state.userSkills : [];
            state.sessions = Array.isArray(state.sessions) ? state.sessions : [];
            state.ratings = Array.isArray(state.ratings) ? state.ratings : [];
            state.badges = Array.isArray(state.badges) ? state.badges : [];
            state.tokenTransactions = Array.isArray(state.tokenTransactions) ? state.tokenTransactions : [];
            state.progress = Array.isArray(state.progress) ? state.progress : [];
            state.assessments = Array.isArray(state.assessments) ? state.assessments : [];
          }
        } catch (_) {}

        var existing = state.users.find(function (u) { return u && u.email === user.email; });
        var finalId = existing && existing.id ? existing.id : user.id;
        if (!existing) {
          state.users.push(user);
          state.tokenTransactions.push({
            id: "tx-" + finalId,
            user_id: finalId,
            amount: 10,
            type: "signup_bonus",
            description: "Welcome bonus tokens (Google signup)",
            created_at: ${JSON.stringify(createdAt)}
          });
        }

        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        localStorage.setItem("skillswap_token", "mock:" + finalId);
      })();
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
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch {
    return redirectWithError(req, "Google sign-in failed. Please try again.");
  }
}
