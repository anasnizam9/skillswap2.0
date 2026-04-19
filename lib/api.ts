// Central API client for all frontend→backend calls

import { handleMockRequest } from "@/lib/mock-api";

const BASE = "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("skillswap_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const contentType = res.headers.get("content-type") || "";
    const rawBody = await res.text();
    const trimmed = rawBody.trim();
    const looksJson = contentType.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[");

    if (!looksJson && (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.length === 0)) {
      return handleMockRequest<T>(path, options, token);
    }

    let data: any = null;
    if (looksJson && trimmed) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      if (data?.error) throw new Error(data.error);
      throw new Error(rawBody || "Request failed");
    }

    return (data ?? {}) as T;
  } catch (error) {
    if (typeof window !== "undefined") {
      return handleMockRequest<T>(path, options, token);
    }
    throw error;
  }
}

// Auth
export const api = {
  auth: {
    register: (body: object) =>
      request<{ token: string; user: User }>("/api/auth/register", {
        method: "POST", body: JSON.stringify(body),
      }),
    login: (body: object) =>
      request<{ token: string; user: User }>("/api/auth/login", {
        method: "POST", body: JSON.stringify(body),
      }),
    me: () => request<{ user: User; skills: UserSkill[]; badges: Badge[] }>("/api/auth/me"),
  },
  skills: {
    list: (params?: { category?: string; userId?: string }) => {
      const q = params ? "?" + new URLSearchParams(params as Record<string,string>).toString() : "";
      return request<{ skills: Skill[] }>(`/api/skills${q}`);
    },
    add: (body: { skillId: string; level: string; role: string }) =>
      request("/api/skills", { method: "POST", body: JSON.stringify(body) }),
  },
  matching: {
    find: (skillId?: string) => {
      const q = skillId ? `?skillId=${skillId}` : "";
      return request<{ matches: Match[] }>(`/api/matching${q}`);
    },
  },
  assessment: {
    generate: (body: { skillId: string; level: string }) =>
      request<{ assessmentId: string; questions: Question[]; skillName: string }>(
        "/api/assessment/generate", { method: "POST", body: JSON.stringify(body) }
      ),
    submit: (body: { assessmentId: string; answers: number[] }) =>
      request<{ score: number; passed: boolean; correct: number; total: number; message: string }>(
        "/api/assessment/submit", { method: "POST", body: JSON.stringify(body) }
      ),
  },
  sessions: {
    list: () => request<{ sessions: Session[] }>("/api/sessions"),
    create: (body: object) =>
      request<{ sessionId: string; meetingUrl: string; message: string }>(
        "/api/sessions", { method: "POST", body: JSON.stringify(body) }
      ),
    complete: (id: string, notes?: string) =>
      request(`/api/sessions/${id}/complete`, {
        method: "POST", body: JSON.stringify({ notes }),
      }),
  },
  ratings: {
    post: (body: object) =>
      request("/api/ratings", { method: "POST", body: JSON.stringify(body) }),
    get: (userId: string) =>
      request<{ ratings: Rating[]; stats: { avg: number; total: number } }>(
        `/api/ratings?userId=${userId}`
      ),
  },
  tokens: {
    get: () =>
      request<{ balance: number; transactions: TokenTx[]; stats: { total_earned: number; total_spent: number } }>("/api/tokens"),
  },
  progress: {
    get: () =>
      request<{ milestones: Milestone[]; sessionStats: { sessions_learned: number; sessions_taught: number }; skillsLearning: UserSkill[] }>("/api/progress"),
  },
  badges: {
    get: () => request<{ badges: Badge[] }>("/api/badges"),
  },
  profile: {
    update: (body: object) =>
      request<{ user: User }>("/api/users/profile", {
        method: "PATCH", body: JSON.stringify(body),
      }),
  },
  init: () => request("/api/init"),
};

// Types
export interface User {
  id: string; email: string; name: string; avatar?: string; bio?: string;
  languages: string; timezone: string; communication_style: string;
  tokens: number; reputation: number; is_verified: number; is_flagged: number;
  created_at: string;
}
export interface Skill {
  id: string; name: string; category: string; description?: string; teacherCount?: number;
}
export interface UserSkill {
  id: string; user_id: string; skill_id: string; level: string; role: string;
  verified: number; skill_name?: string; category?: string;
}
export interface Match {
  teacherId: string; teacherName: string; teacherEmail: string;
  reputation: number; skillLevel: string; skillId: string; compatibilityScore: number;
}
export interface Question { q: string; options: string[]; }
export interface Session {
  id: string; teacher_id: string; learner_id: string; skill_id: string;
  title: string; goals?: string; scheduled_at: string; duration: number;
  status: string; meeting_url?: string; notes?: string; tokens_charged: number;
  teacher_name: string; learner_name: string; skill_name: string; skill_category: string;
  created_at: string;
}
export interface Rating {
  id: string; session_id: string; rater_id: string; rated_user_id: string;
  score: number; comment?: string; rater_name: string; created_at: string;
}
export interface TokenTx {
  id: string; user_id: string; amount: number; type: string; description: string; created_at: string;
}
export interface Milestone {
  id: string; user_id: string; skill_id: string; milestone: string;
  achieved: number; achieved_at?: string; skill_name: string;
}
export interface Badge {
  id: string; user_id: string; skill_id: string; title: string;
  description: string; issued_at: string; share_url?: string;
  linkedin_url?: string; skill_name?: string;
}
