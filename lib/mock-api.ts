import { v4 as uuidv4 } from "uuid";
import { DEMO_SKILLS, DEMO_TEACHERS } from "@/lib/demo-data";
import { calculateCompatibility, generateAssessmentQuestions } from "@/lib/matching";
import type { Badge, Match, Milestone, Question, Rating, Session, Skill, TokenTx, User, UserSkill } from "@/lib/api";

type MockUser = User & { password: string };
type MockAssessment = {
  id: string;
  userId: string;
  skillId: string;
  questions: Array<{ q: string; options: string[]; answer: number }>;
  answers?: number[];
  score?: number;
  passed: boolean;
  completedAt?: string;
};

type MockState = {
  users: MockUser[];
  skills: Skill[];
  userSkills: UserSkill[];
  sessions: Session[];
  ratings: Rating[];
  badges: Badge[];
  tokenTransactions: TokenTx[];
  progress: Milestone[];
  assessments: MockAssessment[];
};

const STATE_KEY = "skillswap_mock_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : uuidv4()}`;
}

function toMockToken(userId: string) {
  return `mock:${userId}`;
}

function fromMockToken(token: string | null): string | null {
  if (!token?.startsWith("mock:")) return null;
  return token.slice(5);
}

function teacherSeedToUser(teacher: (typeof DEMO_TEACHERS)[number]): MockUser {
  return {
    id: teacher.id,
    email: teacher.email,
    name: teacher.name,
    avatar: undefined,
    bio: `Demo teacher for ${teacher.skills.map((skill) => skill.skillId).join(", ")}`,
    languages: teacher.languages,
    timezone: teacher.timezone,
    communication_style: teacher.communicationStyle,
    tokens: 30,
    reputation: teacher.reputation,
    is_verified: teacher.isVerified,
    is_flagged: teacher.isFlagged,
    created_at: nowIso(),
    password: "Demo12345!",
  };
}

function seedState(): MockState {
  const users = DEMO_TEACHERS.map(teacherSeedToUser);
  const userSkills: UserSkill[] = DEMO_TEACHERS.flatMap((teacher) =>
    teacher.skills.map((skill) => ({
      id: makeId("skill"),
      user_id: teacher.id,
      skill_id: skill.skillId,
      level: skill.level,
      role: "teacher",
      verified: 1,
      skill_name: DEMO_SKILLS.find((entry) => entry.id === skill.skillId)?.name,
      category: DEMO_SKILLS.find((entry) => entry.id === skill.skillId)?.category,
    }))
  );

  return {
    users,
    skills: DEMO_SKILLS.map((skill) => ({ ...skill, teacherCount: 0 })),
    userSkills,
    sessions: [],
    ratings: [],
    badges: [],
    tokenTransactions: [],
    progress: [],
    assessments: [],
  };
}

function loadState(): MockState {
  if (typeof window === "undefined") return seedState();
  const raw = window.localStorage.getItem(STATE_KEY);
  if (!raw) {
    const state = seedState();
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    return state;
  }

  try {
    const parsed = JSON.parse(raw) as MockState;
    return {
      ...seedState(),
      ...parsed,
      users: parsed.users ?? seedState().users,
      skills: parsed.skills ?? seedState().skills,
      userSkills: parsed.userSkills ?? seedState().userSkills,
      sessions: parsed.sessions ?? [],
      ratings: parsed.ratings ?? [],
      badges: parsed.badges ?? [],
      tokenTransactions: parsed.tokenTransactions ?? [],
      progress: parsed.progress ?? [],
      assessments: parsed.assessments ?? [],
    };
  } catch {
    const state = seedState();
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    return state;
  }
}

function saveState(state: MockState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function getActiveUserId(token: string | null) {
  return fromMockToken(token);
}

function getCurrentUser(state: MockState, token: string | null) {
  const userId = getActiveUserId(token);
  if (!userId) return null;
  return state.users.find((user) => user.id === userId) ?? null;
}

function computeTeacherCount(state: MockState, skillId: string) {
  return state.userSkills.filter((skill) => skill.skill_id === skillId && skill.role === "teacher" && skill.verified === 1).length;
}

function publicUser(user: MockUser): User {
  const { password: _, ...safeUser } = user;
  return safeUser;
}

function teacherMatchData(state: MockState, learner: MockUser, skillId?: string): Match[] {
  const learnerSkill = skillId
    ? state.userSkills.find((entry) => entry.user_id === learner.id && entry.skill_id === skillId && entry.role === "learner")
    : undefined;

  const learnerProfile = {
    id: learner.id,
    languages: learner.languages,
    timezone: learner.timezone,
    communicationStyle: learner.communication_style,
    reputation: learner.reputation,
    skillLevel: learnerSkill?.level || "beginner",
    teachingSkills: [],
    learningGoals: [],
  };

  const matches = state.userSkills
    .filter((entry) => entry.role === "teacher" && entry.verified === 1)
    .filter((entry) => !skillId || entry.skill_id === skillId)
    .filter((entry) => entry.user_id !== learner.id)
    .map((entry) => {
      const teacher = state.users.find((user) => user.id === entry.user_id);
      if (!teacher) return null;
      const teacherProfile = {
        id: teacher.id,
        languages: teacher.languages,
        timezone: teacher.timezone,
        communicationStyle: teacher.communication_style,
        reputation: teacher.reputation,
        skillLevel: entry.level,
        teachingSkills: [],
        learningGoals: [],
      };
      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        reputation: teacher.reputation,
        skillLevel: entry.level,
        skillId: entry.skill_id,
        compatibilityScore: calculateCompatibility(teacherProfile, learnerProfile),
      } as Match;
    })
    .filter((match): match is Match => Boolean(match));

  const unique = new Map<string, Match>();
  for (const match of matches) unique.set(`${match.teacherId}:${match.skillId}`, match);
  return Array.from(unique.values()).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

function updateProgress(state: MockState, userId: string, skillId: string, milestone: string, achieved = 1) {
  const existing = state.progress.find((entry) => entry.user_id === userId && entry.skill_id === skillId && entry.milestone === milestone);
  if (existing) {
    existing.achieved = achieved;
    existing.achieved_at = nowIso();
    return;
  }
  state.progress.push({
    id: makeId("progress"),
    user_id: userId,
    skill_id: skillId,
    milestone,
    achieved,
    achieved_at: nowIso(),
    skill_name: state.skills.find((skill) => skill.id === skillId)?.name || skillId,
  });
}

function addTokens(state: MockState, userId: string, amount: number, type: string, description: string) {
  const user = state.users.find((entry) => entry.id === userId);
  if (!user) return;
  user.tokens += amount;
  state.tokenTransactions.push({
    id: makeId("tx"),
    user_id: userId,
    amount,
    type,
    description,
    created_at: nowIso(),
  });
}

function deductTokens(state: MockState, userId: string, amount: number, type: string, description: string) {
  const user = state.users.find((entry) => entry.id === userId);
  if (!user || user.tokens < amount) return false;
  user.tokens -= amount;
  state.tokenTransactions.push({
    id: makeId("tx"),
    user_id: userId,
    amount: -amount,
    type,
    description,
    created_at: nowIso(),
  });
  return true;
}

function currentSkills(state: MockState, token: string | null) {
  const user = getCurrentUser(state, token);
  if (!user) return [];
  return state.userSkills
    .filter((entry) => entry.user_id === user.id)
    .map((entry) => ({
      ...entry,
      skill_name: state.skills.find((skill) => skill.id === entry.skill_id)?.name,
      category: state.skills.find((skill) => skill.id === entry.skill_id)?.category,
    }));
}

function getSessionStats(state: MockState, userId: string) {
  return {
    sessions_learned: state.sessions.filter((session) => session.learner_id === userId && session.status === "completed").length,
    sessions_taught: state.sessions.filter((session) => session.teacher_id === userId && session.status === "completed").length,
  };
}

function getBadgesForUser(state: MockState, userId: string) {
  return state.badges.filter((badge) => badge.user_id === userId);
}

function ensureBadge(state: MockState, userId: string, skillId: string, title: string, description: string) {
  const existing = state.badges.find((badge) => badge.user_id === userId && badge.skill_id === skillId && badge.title === title);
  if (existing) return existing;
  const badge: Badge = {
    id: makeId("badge"),
    user_id: userId,
    skill_id: skillId,
    title,
    description,
    issued_at: nowIso(),
    share_url: undefined,
    linkedin_url: undefined,
    skill_name: state.skills.find((skill) => skill.id === skillId)?.name,
  };
  state.badges.push(badge);
  return badge;
}

function assessmentQuestionsFor(state: MockState, skillId: string, level: string) {
  const skill = state.skills.find((entry) => entry.id === skillId) || DEMO_SKILLS[0];
  return generateAssessmentQuestions(skill.name, level);
}

function maybeCompletedTeacherBadge(state: MockState, userId: string) {
  const taught = state.sessions.filter((session) => session.teacher_id === userId && session.status === "completed").length;
  const teacher = state.users.find((entry) => entry.id === userId);
  if (!teacher || taught < 5) return;
  ensureBadge(state, userId, state.skills[0].id, "Experienced Teacher", "Completed 5 teaching sessions");
}

export async function handleMockRequest<T>(path: string, options: RequestInit = {}, token: string | null = null): Promise<T> {
  const state = loadState();
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, "http://local.mock");
  const body = options.body ? JSON.parse(String(options.body)) : {};
  const user = getCurrentUser(state, token);

  const respond = (payload: unknown) => {
    saveState(state);
    return payload as T;
  };

  if (url.pathname === "/api/init") {
    return respond({ message: "Mock database initialized successfully" });
  }

  if (url.pathname === "/api/auth/register" && method === "POST") {
    const { email, name, password, timezone, languages, communicationStyle } = body;
    if (!email || !name || !password) throw new Error("Email, name, and password are required");
    if (state.users.some((entry) => entry.email.toLowerCase() === String(email).toLowerCase())) {
      throw new Error("Email already registered");
    }
    const userId = makeId("user");
    const newUser: MockUser = {
      id: userId,
      email,
      name,
      avatar: undefined,
      bio: undefined,
      languages: languages || "English",
      timezone: timezone || "UTC",
      communication_style: communicationStyle || "casual",
      tokens: 20,
      reputation: 5,
      is_verified: 0,
      is_flagged: 0,
      created_at: nowIso(),
      password,
    };
    state.users.push(newUser);
    state.tokenTransactions.push({
      id: makeId("tx"),
      user_id: userId,
      amount: 10,
      type: "signup_bonus",
      description: "Welcome bonus tokens",
      created_at: nowIso(),
    });
    newUser.tokens += 10;
    return respond({ token: toMockToken(userId), user: publicUser(newUser) });
  }

  if (url.pathname === "/api/auth/login" && method === "POST") {
    const { email, password } = body;
    const found = state.users.find((entry) => entry.email.toLowerCase() === String(email).toLowerCase());
    if (!found || found.password !== password) throw new Error("Invalid credentials");
    return respond({ token: toMockToken(found.id), user: publicUser(found) });
  }

  if (url.pathname === "/api/auth/me" && method === "GET") {
    if (!user) throw new Error("Unauthorized");
    return respond({ user: publicUser(user), skills: currentSkills(state, token), badges: getBadgesForUser(state, user.id) });
  }

  if (url.pathname === "/api/skills" && method === "GET") {
    const category = url.searchParams.get("category");
    const userId = url.searchParams.get("userId");
    if (userId) {
      const skills = state.userSkills
        .filter((entry) => entry.user_id === userId)
        .map((entry) => ({
          ...entry,
          skill_name: state.skills.find((skill) => skill.id === entry.skill_id)?.name,
          category: state.skills.find((skill) => skill.id === entry.skill_id)?.category,
        }));
      return respond({ skills });
    }

    const skills = state.skills
      .filter((skill) => !category || skill.category === category)
      .map((skill) => ({ ...skill, teacherCount: computeTeacherCount(state, skill.id) }));
    return respond({ skills });
  }

  if (url.pathname === "/api/skills" && method === "POST") {
    if (!user) throw new Error("Unauthorized");
    const { skillId, level, role } = body;
    if (!skillId || !level || !role) throw new Error("skillId, level, and role are required");
    if (state.userSkills.some((entry) => entry.user_id === user.id && entry.skill_id === skillId && entry.role === role)) {
      throw new Error("You already have this skill listed for this role");
    }
    state.userSkills.push({
      id: makeId("skill"),
      user_id: user.id,
      skill_id: skillId,
      level,
      role,
      verified: 0,
      skill_name: state.skills.find((skill) => skill.id === skillId)?.name,
      category: state.skills.find((skill) => skill.id === skillId)?.category,
    });
    return respond({ message: "Skill added successfully", id: makeId("skill") });
  }

  if (url.pathname === "/api/matching" && method === "GET") {
    if (!user) throw new Error("Unauthorized");
    const skillId = url.searchParams.get("skillId") || undefined;
    return respond({ matches: teacherMatchData(state, user, skillId) });
  }

  if (url.pathname === "/api/assessment/generate" && method === "POST") {
    if (!user) throw new Error("Unauthorized");
    const { skillId, level } = body;
    if (!skillId || !level) throw new Error("skillId and level required");
    const questions = assessmentQuestionsFor(state, skillId, level);
    const assessmentId = makeId("assessment");
    state.assessments.push({ id: assessmentId, userId: user.id, skillId, questions, passed: false });
    return respond({
      assessmentId,
      skillName: state.skills.find((skill) => skill.id === skillId)?.name || skillId,
      questions: questions.map(({ answer: _, ...q }) => q as Question),
    });
  }

  if (url.pathname === "/api/assessment/submit" && method === "POST") {
    if (!user) throw new Error("Unauthorized");
    const { assessmentId, answers } = body;
    const assessment = state.assessments.find((entry) => entry.id === assessmentId && entry.userId === user.id);
    if (!assessment) throw new Error("Assessment not found");
    if (assessment.completedAt) throw new Error("Assessment already completed");
    let correct = 0;
    assessment.questions.forEach((question, index) => {
      if (answers?.[index] === question.answer) correct += 1;
    });
    const score = Math.round((correct / assessment.questions.length) * 100);
    const passed = score >= 60;
    assessment.answers = answers;
    assessment.score = score;
    assessment.passed = passed;
    assessment.completedAt = nowIso();
    if (passed) {
      state.userSkills.forEach((entry) => {
        if (entry.user_id === user.id && entry.skill_id === assessment.skillId && entry.role === "teacher") {
          entry.verified = 1;
        }
      });
      addTokens(state, user.id, 5, "verification_bonus", "Skill verification bonus");
      ensureBadge(state, user.id, assessment.skillId, "Verified Teacher", "Passed the assessment and became a verified teacher");
    }
    return respond({
      score,
      passed,
      correct,
      total: assessment.questions.length,
      message: passed
        ? "Congratulations! You are now a verified teacher for this skill."
        : "You need 60% to pass. Please try again after more practice.",
    });
  }

  if (url.pathname === "/api/sessions" && method === "GET") {
    if (!user) throw new Error("Unauthorized");
    return respond({ sessions: state.sessions.filter((session) => session.teacher_id === user.id || session.learner_id === user.id) });
  }

  if (url.pathname === "/api/sessions" && method === "POST") {
    if (!user) throw new Error("Unauthorized");
    const { teacherId, skillId, title, goals, scheduledAt, duration, tokensCharged } = body;
    if (!teacherId || !skillId || !title || !scheduledAt) throw new Error("teacherId, skillId, title, scheduledAt required");
    const cost = tokensCharged || 5;
    if (!deductTokens(state, user.id, cost, "learn_session", `Session: ${title}`)) {
      throw new Error("Insufficient tokens. Earn more by teaching!");
    }
    const sessionId = makeId("session");
    const meetingUrl = `https://meet.skillswap.ai/room/${sessionId.slice(0, 8)}`;
    state.sessions.push({
      id: sessionId,
      teacher_id: teacherId,
      learner_id: user.id,
      skill_id: skillId,
      title,
      goals: goals || undefined,
      scheduled_at: scheduledAt,
      duration: duration || 60,
      status: "scheduled",
      meeting_url: meetingUrl,
      notes: undefined,
      tokens_charged: cost,
      teacher_name: state.users.find((entry) => entry.id === teacherId)?.name || "Teacher",
      learner_name: user.name,
      skill_name: state.skills.find((entry) => entry.id === skillId)?.name || skillId,
      skill_category: state.skills.find((entry) => entry.id === skillId)?.category || "General",
      created_at: nowIso(),
    });
    updateProgress(state, user.id, skillId, "First session scheduled", 1);
    return respond({ sessionId, meetingUrl, message: "Session booked!" });
  }

  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/complete$/) && method === "POST") {
    if (!user) throw new Error("Unauthorized");
    const sessionId = url.pathname.split("/")[3];
    const session = state.sessions.find((entry) => entry.id === sessionId);
    if (!session) throw new Error("Session not found");
    if (session.teacher_id !== user.id) throw new Error("Only the teacher can complete this session");
    session.status = "completed";
    session.notes = body?.notes || session.notes;
    addTokens(state, session.teacher_id, session.tokens_charged, "teach_session", `Session completed: ${session.title}`);
    updateProgress(state, session.teacher_id, session.skill_id, "First session completed", 1);
    maybeCompletedTeacherBadge(state, session.teacher_id);
    return respond({ message: "Session completed successfully" });
  }

  if (url.pathname === "/api/ratings" && method === "POST") {
    if (!user) throw new Error("Unauthorized");
    const { sessionId, ratedUserId, score, comment } = body;
    state.ratings.push({
      id: makeId("rating"),
      session_id: sessionId,
      rater_id: user.id,
      rated_user_id: ratedUserId,
      score,
      comment,
      rater_name: user.name,
      created_at: nowIso(),
    });
    return respond({ message: "Rating submitted" });
  }

  if (url.pathname === "/api/ratings" && method === "GET") {
    const userId = url.searchParams.get("userId") || user?.id;
    const ratings = state.ratings.filter((rating) => rating.rated_user_id === userId);
    const total = ratings.length;
    const avg = total === 0 ? 0 : ratings.reduce((sum, rating) => sum + rating.score, 0) / total;
    return respond({ ratings, stats: { avg, total } });
  }

  if (url.pathname === "/api/tokens" && method === "GET") {
    if (!user) throw new Error("Unauthorized");
    const transactions = state.tokenTransactions.filter((entry) => entry.user_id === user.id);
    const total_earned = transactions.filter((entry) => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
    const total_spent = Math.abs(transactions.filter((entry) => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0));
    return respond({ balance: user.tokens, transactions, stats: { total_earned, total_spent } });
  }

  if (url.pathname === "/api/progress" && method === "GET") {
    if (!user) throw new Error("Unauthorized");
    return respond({ milestones: state.progress.filter((entry) => entry.user_id === user.id), sessionStats: getSessionStats(state, user.id), skillsLearning: currentSkills(state, token) });
  }

  if (url.pathname === "/api/badges" && method === "GET") {
    if (!user) throw new Error("Unauthorized");
    return respond({ badges: getBadgesForUser(state, user.id) });
  }

  if (url.pathname === "/api/users/profile" && method === "PATCH") {
    if (!user) throw new Error("Unauthorized");
    const { name, bio, languages, timezone, communicationStyle } = body;
    user.name = name || user.name;
    user.bio = bio;
    user.languages = languages || user.languages;
    user.timezone = timezone || user.timezone;
    user.communication_style = communicationStyle || user.communication_style;
    return respond({ user: publicUser(user) });
  }

  throw new Error(`Mock route not implemented for ${method} ${url.pathname}`);
}
