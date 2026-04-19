import { promises as fs } from "fs";
import path from "path";
import { DEMO_SKILLS, DEMO_TEACHERS } from "@/lib/demo-data";

type Row = Record<string, unknown>;
type SqlArgs = Array<string | number | null | undefined | boolean>;

type JsonDB = {
  users: Row[];
  skills: Row[];
  user_skills: Row[];
  assessments: Row[];
  matches: Row[];
  sessions: Row[];
  ratings: Row[];
  token_transactions: Row[];
  progress: Row[];
  badges: Row[];
};

const DB_FILE = path.join(process.cwd(), "skillswap.json");

// ✅ FIX 1: Lazy load - top-level pe nahi, function ke andar chalega
let _demoPasswordHash: string | null = null;
function getDemoPasswordHash(): string {
  if (!_demoPasswordHash) {
    const { hashSync } = require("bcryptjs");
    _demoPasswordHash = hashSync("Demo12345!", 10);
  }
  return _demoPasswordHash!;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function seedDB(): JsonDB {
  const created = nowIso();
  const db: JsonDB = {
    users: [],
    skills: [],
    user_skills: [],
    assessments: [],
    matches: [],
    sessions: [],
    ratings: [],
    token_transactions: [],
    progress: [],
    badges: [],
  };

  for (const skill of DEMO_SKILLS) {
    db.skills.push({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description || null,
      created_at: created,
    });
  }

  for (const teacher of DEMO_TEACHERS) {
    db.users.push({
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      password: getDemoPasswordHash(), // ✅ lazy call
      avatar: null,
      bio: `Demo teacher for ${teacher.skills.map((s) => s.skillId).join(", ")}`,
      languages: teacher.languages,
      timezone: teacher.timezone,
      communication_style: teacher.communicationStyle,
      tokens: 30,
      reputation: teacher.reputation,
      is_verified: teacher.isVerified,
      is_flagged: teacher.isFlagged,
      created_at: created,
      updated_at: created,
    });

    for (const skill of teacher.skills) {
      db.user_skills.push({
        id: `${teacher.id}-${skill.skillId}-teacher`,
        user_id: teacher.id,
        skill_id: skill.skillId,
        level: skill.level,
        role: "teacher",
        verified: 1,
        verified_at: created,
        created_at: created,
      });
    }
  }

  return db;
}

async function readDB(): Promise<JsonDB> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as JsonDB;
    return {
      ...seedDB(),
      ...parsed,
      users: parsed.users || [],
      skills: parsed.skills || [],
      user_skills: parsed.user_skills || [],
      assessments: parsed.assessments || [],
      matches: parsed.matches || [],
      sessions: parsed.sessions || [],
      ratings: parsed.ratings || [],
      token_transactions: parsed.token_transactions || [],
      progress: parsed.progress || [],
      badges: parsed.badges || [],
    };
  } catch {
    const initial = seedDB();
    await writeDB(initial);
    return initial;
  }
}

// ✅ FIX 2: Vercel read-only filesystem pe silently fail karo
async function writeDB(db: JsonDB): Promise<void> {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch {
    // Vercel filesystem read-only hai - silently ignore
  }
}

function skillById(db: JsonDB, id: string): Row | undefined {
  return db.skills.find((s) => s.id === id);
}

function userById(db: JsonDB, id: string): Row | undefined {
  return db.users.find((u) => u.id === id);
}

function userSkillsWithSkill(db: JsonDB, userId: string, role?: string): Row[] {
  return db.user_skills
    .filter((us) => us.user_id === userId && (!role || us.role === role))
    .map((us) => {
      const skill = skillById(db, String(us.skill_id));
      return {
        ...us,
        skill_name: skill?.name,
        category: skill?.category,
      };
    });
}

function ratingsForUser(db: JsonDB, userId: string): Row[] {
  return db.ratings.filter((r) => r.rated_user_id === userId);
}

function isWriteQuery(sql: string): boolean {
  const s = normalizeSql(sql);
  return s.startsWith("insert") || s.startsWith("update") || s.startsWith("delete");
}

async function execute({ sql, args = [] }: { sql: string; args?: SqlArgs }): Promise<{ rows: Row[] }> {
  const db = await readDB();
  const s = normalizeSql(sql);
  let rows: Row[] = [];

  if (s === "select * from users where email = ?") {
    rows = db.users.filter((u) => u.email === args[0]);
  } else if (s === "select id from users where email = ?") {
    rows = db.users.filter((u) => u.email === args[0]).map((u) => ({ id: u.id }));
  } else if (s === "select * from users where id = ?") {
    rows = db.users.filter((u) => u.id === args[0]);
  } else if (s.includes("select id, email, name, tokens, reputation, is_verified from users where id = ?")) {
    rows = db.users.filter((u) => u.id === args[0]).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      tokens: u.tokens,
      reputation: u.reputation,
      is_verified: u.is_verified,
    }));
  } else if (s.includes("select id, email, name, avatar, bio, languages, timezone, communication_style, tokens, reputation from users where id = ?")) {
    rows = db.users.filter((u) => u.id === args[0]).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar,
      bio: u.bio,
      languages: u.languages,
      timezone: u.timezone,
      communication_style: u.communication_style,
      tokens: u.tokens,
      reputation: u.reputation,
    }));
  } else if (s.includes("select id, email, name, avatar, bio, languages, timezone, communication_style, tokens, reputation, is_verified, is_flagged, created_at from users where id = ?")) {
    rows = db.users.filter((u) => u.id === args[0]).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar,
      bio: u.bio,
      languages: u.languages,
      timezone: u.timezone,
      communication_style: u.communication_style,
      tokens: u.tokens,
      reputation: u.reputation,
      is_verified: u.is_verified,
      is_flagged: u.is_flagged,
      created_at: u.created_at,
    }));
  } else if (s.startsWith("insert into users (id, email, name, password, timezone, languages, communication_style) values (?, ?, ?, ?, ?, ?, ?)")) {
    db.users.push({
      id: args[0],
      email: args[1],
      name: args[2],
      password: args[3],
      avatar: null,
      bio: null,
      languages: args[5] || "English",
      timezone: args[4] || "UTC",
      communication_style: args[6] || "casual",
      tokens: 10,
      reputation: 5,
      is_verified: 0,
      is_flagged: 0,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  } else if (s.startsWith("insert or ignore into skills (id, name, category, description) values (?, ?, ?, ?)")) {
    const exists = db.skills.some((skill) => skill.id === args[0]);
    if (!exists) {
      db.skills.push({
        id: args[0],
        name: args[1],
        category: args[2],
        description: args[3] || null,
        created_at: nowIso(),
      });
    }
  } else if (s.startsWith("insert or ignore into users ( id, email, name, password, avatar, bio, languages, timezone, communication_style, tokens, reputation, is_verified, is_flagged ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
    const exists = db.users.some((u) => u.id === args[0] || u.email === args[1]);
    if (!exists) {
      db.users.push({
        id: args[0],
        email: args[1],
        name: args[2],
        password: args[3],
        avatar: args[4] || null,
        bio: args[5] || null,
        languages: args[6] || "English",
        timezone: args[7] || "UTC",
        communication_style: args[8] || "casual",
        tokens: Number(args[9] ?? 10),
        reputation: Number(args[10] ?? 5),
        is_verified: Number(args[11] ?? 0),
        is_flagged: Number(args[12] ?? 0),
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }
  } else if (s.startsWith("update users set tokens = tokens + ? where id = ?")) {
    const user = userById(db, String(args[1]));
    if (user) {
      user.tokens = Number(user.tokens || 0) + Number(args[0] || 0);
      user.updated_at = nowIso();
    }
  } else if (s.startsWith("update users set tokens = tokens - ? where id = ?")) {
    const user = userById(db, String(args[1]));
    if (user) {
      user.tokens = Number(user.tokens || 0) - Number(args[0] || 0);
      user.updated_at = nowIso();
    }
  } else if (s === "select tokens from users where id = ?") {
    rows = db.users.filter((u) => u.id === args[0]).map((u) => ({ tokens: u.tokens }));
  } else if (s === "update users set reputation = ? where id = ?") {
    const user = userById(db, String(args[1]));
    if (user) {
      user.reputation = Number(args[0]);
      user.updated_at = nowIso();
    }
  } else if (s === "update users set is_flagged = 1 where id = ?") {
    const user = userById(db, String(args[0]));
    if (user) {
      user.is_flagged = 1;
      user.updated_at = nowIso();
    }
  } else if (s.startsWith("update users set name = coalesce(?, name), bio = coalesce(?, bio), avatar = coalesce(?, avatar), languages = coalesce(?, languages), timezone = coalesce(?, timezone), communication_style = coalesce(?, communication_style), updated_at = datetime('now') where id = ?")) {
    const user = userById(db, String(args[6]));
    if (user) {
      if (args[0] !== null && args[0] !== undefined) user.name = args[0];
      if (args[1] !== null && args[1] !== undefined) user.bio = args[1];
      if (args[2] !== null && args[2] !== undefined) user.avatar = args[2];
      if (args[3] !== null && args[3] !== undefined) user.languages = args[3];
      if (args[4] !== null && args[4] !== undefined) user.timezone = args[4];
      if (args[5] !== null && args[5] !== undefined) user.communication_style = args[5];
      user.updated_at = nowIso();
    }
  } else if (s === "select * from skills where id = ?") {
    rows = db.skills.filter((skill) => skill.id === args[0]);
  } else if (s === "select name from skills where id = ?") {
    rows = db.skills.filter((skill) => skill.id === args[0]).map((skill) => ({ name: skill.name }));
  } else if (s.startsWith("select * from skills")) {
    let skills = [...db.skills];
    if (s.includes("where category = ?")) {
      skills = skills.filter((skill) => skill.category === args[0]);
    }
    skills.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    rows = skills;
  } else if (s.includes("from user_skills us join skills s on us.skill_id = s.id where us.user_id = ? and us.role = 'learner'")) {
    rows = userSkillsWithSkill(db, String(args[0]), "learner");
  } else if (s.includes("from user_skills us join skills s on us.skill_id = s.id where us.user_id = ?")) {
    rows = userSkillsWithSkill(db, String(args[0]));
  } else if (s === "select level from user_skills where user_id = ? and skill_id = ? and role = 'learner'") {
    rows = db.user_skills
      .filter((us) => us.user_id === args[0] && us.skill_id === args[1] && us.role === "learner")
      .map((us) => ({ level: us.level }));
  } else if (s === "select id from user_skills where user_id = ? and skill_id = ? and role = ?") {
    rows = db.user_skills
      .filter((us) => us.user_id === args[0] && us.skill_id === args[1] && us.role === args[2])
      .map((us) => ({ id: us.id }));
  } else if (s === "select count(*) as count from user_skills where skill_id = ? and role = 'teacher' and verified = 1") {
    const count = db.user_skills.filter((us) => us.skill_id === args[0] && us.role === "teacher" && Number(us.verified) === 1).length;
    rows = [{ count }];
  } else if (s.startsWith("insert into user_skills (id, user_id, skill_id, level, role) values (?, ?, ?, ?, ?)")) {
    db.user_skills.push({
      id: args[0],
      user_id: args[1],
      skill_id: args[2],
      level: args[3],
      role: args[4],
      verified: 0,
      verified_at: null,
      created_at: nowIso(),
    });
  } else if (s.startsWith("insert or ignore into user_skills ( id, user_id, skill_id, level, role, verified, verified_at ) values (?, ?, ?, ?, ?, ?, datetime('now'))")) {
    const exists = db.user_skills.some((us) => us.id === args[0] || (us.user_id === args[1] && us.skill_id === args[2] && us.role === args[4]));
    if (!exists) {
      db.user_skills.push({
        id: args[0],
        user_id: args[1],
        skill_id: args[2],
        level: args[3],
        role: args[4],
        verified: Number(args[5] ?? 0),
        verified_at: nowIso(),
        created_at: nowIso(),
      });
    }
  } else if (s === "update user_skills set verified = 1, verified_at = datetime('now') where user_id = ? and skill_id = ? and role = 'teacher'") {
    db.user_skills.forEach((us) => {
      if (us.user_id === args[0] && us.skill_id === args[1] && us.role === "teacher") {
        us.verified = 1;
        us.verified_at = nowIso();
      }
    });
  } else if (s.startsWith("insert into assessments (id, user_id, skill_id, questions) values (?, ?, ?, ?)")) {
    db.assessments.push({
      id: args[0],
      user_id: args[1],
      skill_id: args[2],
      questions: args[3],
      answers: null,
      score: null,
      passed: 0,
      completed_at: null,
      created_at: nowIso(),
    });
  } else if (s === "select * from assessments where id = ? and user_id = ?") {
    rows = db.assessments.filter((a) => a.id === args[0] && a.user_id === args[1]);
  } else if (s === "update assessments set answers = ?, score = ?, passed = ?, completed_at = datetime('now') where id = ?") {
    const a = db.assessments.find((item) => item.id === args[3]);
    if (a) {
      a.answers = args[0];
      a.score = args[1];
      a.passed = args[2];
      a.completed_at = nowIso();
    }
  } else if (s.includes("from users u join user_skills us on u.id = us.user_id where us.role = 'teacher' and us.verified = 1 and u.id != ? and u.is_flagged = 0")) {
    const excludeUserId = args[0];
    const maybeSkillId = args[1];
    rows = db.user_skills
      .filter((us) => us.role === "teacher" && Number(us.verified) === 1)
      .filter((us) => !maybeSkillId || us.skill_id === maybeSkillId)
      .reduce<Row[]>((acc, us) => {
        const user = userById(db, String(us.user_id));
        if (!user || user.id === excludeUserId || Number(user.is_flagged) === 1) {
          return acc;
        }
        acc.push({
          ...user,
          skill_level: us.level,
          skill_id: us.skill_id,
        });
        return acc;
      }, []);
  } else if (s.startsWith("insert or ignore into matches (id, teacher_id, learner_id, skill_id, compatibility_score, expires_at) values (?, ?, ?, ?, ?, ?)")) {
    const exists = db.matches.some((m) => m.teacher_id === args[1] && m.learner_id === args[2] && m.skill_id === args[3]);
    if (!exists) {
      db.matches.push({
        id: args[0],
        teacher_id: args[1],
        learner_id: args[2],
        skill_id: args[3],
        compatibility_score: args[4],
        status: "pending",
        created_at: nowIso(),
        expires_at: args[5],
      });
    }
  } else if (s.includes("from sessions s join users t on s.teacher_id = t.id join users l on s.learner_id = l.id join skills sk on s.skill_id = sk.id where s.teacher_id = ? or s.learner_id = ? order by s.scheduled_at desc")) {
    const userId = args[0];
    const sessionRows: Row[] = db.sessions
      .filter((session) => session.teacher_id === userId || session.learner_id === args[1])
      .map((session): Row => {
        const teacher = userById(db, String(session.teacher_id));
        const learner = userById(db, String(session.learner_id));
        const skill = skillById(db, String(session.skill_id));
        return {
          ...session,
          teacher_name: teacher?.name,
          teacher_email: teacher?.email,
          learner_name: learner?.name,
          learner_email: learner?.email,
          skill_name: skill?.name,
          skill_category: skill?.category,
        };
      });
    rows = sessionRows.sort((a, b) => String(b["scheduled_at"]).localeCompare(String(a["scheduled_at"])));
  } else if (s.startsWith("insert into sessions (id, teacher_id, learner_id, skill_id, title, goals, scheduled_at, duration, meeting_url, tokens_charged) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
    db.sessions.push({
      id: args[0],
      teacher_id: args[1],
      learner_id: args[2],
      skill_id: args[3],
      title: args[4],
      goals: args[5],
      scheduled_at: args[6],
      duration: args[7],
      status: "scheduled",
      meeting_url: args[8],
      notes: null,
      tokens_charged: args[9],
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  } else if (s === "select * from sessions where id = ? and (teacher_id = ? or learner_id = ?)") {
    rows = db.sessions.filter((session) => session.id === args[0] && (session.teacher_id === args[1] || session.learner_id === args[2]));
  } else if (s === "select * from sessions where id = ?") {
    rows = db.sessions.filter((session) => session.id === args[0]);
  } else if (s === "update sessions set status = 'completed', notes = ?, updated_at = datetime('now') where id = ?") {
    const session = db.sessions.find((item) => item.id === args[1]);
    if (session) {
      session.status = "completed";
      session.notes = args[0];
      session.updated_at = nowIso();
    }
  } else if (s === "select count(*) as count from sessions where teacher_id = ? and status = 'completed'") {
    const count = db.sessions.filter((session) => session.teacher_id === args[0] && session.status === "completed").length;
    rows = [{ count }];
  } else if (s.includes("count(case when learner_id = ? and status = 'completed' then 1 end) as sessions_learned, count(case when teacher_id = ? and status = 'completed' then 1 end) as sessions_taught from sessions")) {
    const sessions_learned = db.sessions.filter((session) => session.learner_id === args[0] && session.status === "completed").length;
    const sessions_taught = db.sessions.filter((session) => session.teacher_id === args[1] && session.status === "completed").length;
    rows = [{ sessions_learned, sessions_taught }];
  } else if (s === "select id from ratings where session_id = ? and rater_id = ?") {
    rows = db.ratings.filter((r) => r.session_id === args[0] && r.rater_id === args[1]).map((r) => ({ id: r.id }));
  } else if (s.startsWith("insert into ratings (id, session_id, rater_id, rated_user_id, score, comment) values (?, ?, ?, ?, ?, ?)")) {
    db.ratings.push({
      id: args[0],
      session_id: args[1],
      rater_id: args[2],
      rated_user_id: args[3],
      score: Number(args[4]),
      comment: args[5] || null,
      created_at: nowIso(),
    });
  } else if (s === "select avg(score) as avg_score, count(*) as count from ratings where rated_user_id = ?") {
    const r = ratingsForUser(db, String(args[0]));
    const count = r.length;
    const avg_score = count === 0 ? 0 : r.reduce((sum, item) => sum + Number(item.score || 0), 0) / count;
    rows = [{ avg_score, count }];
  } else if (s.includes("select r.*, u.name as rater_name from ratings r join users u on r.rater_id = u.id where r.rated_user_id = ? order by r.created_at desc limit 20")) {
    const ratingRows: Row[] = db.ratings
      .filter((r) => r.rated_user_id === args[0])
      .map((rating): Row => ({
        ...rating,
        rater_name: userById(db, String(rating.rater_id))?.name,
      }));
    rows = ratingRows
      .sort((a, b) => String(b["created_at"]).localeCompare(String(a["created_at"])))
      .slice(0, 20);
  } else if (s === "select avg(score) as avg, count(*) as total from ratings where rated_user_id = ?") {
    const r = ratingsForUser(db, String(args[0]));
    const total = r.length;
    const avg = total === 0 ? 0 : r.reduce((sum, item) => sum + Number(item.score || 0), 0) / total;
    rows = [{ avg, total }];
  } else if (s.startsWith("insert into token_transactions (id, user_id, amount, type, description) values (?, ?, ?, ?, ?)")) {
    db.token_transactions.push({
      id: args[0],
      user_id: args[1],
      amount: Number(args[2]),
      type: args[3],
      description: args[4],
      created_at: nowIso(),
    });
  } else if (s === "select * from token_transactions where user_id = ? order by created_at desc limit 50") {
    rows = db.token_transactions
      .filter((tx) => tx.user_id === args[0])
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 50);
  } else if (s.includes("sum(case when amount > 0 then amount else 0 end) as total_earned, sum(case when amount < 0 then abs(amount) else 0 end) as total_spent from token_transactions where user_id = ?")) {
    const tx = db.token_transactions.filter((t) => t.user_id === args[0]);
    const total_earned = tx.filter((t) => Number(t.amount) > 0).reduce((sum, t) => sum + Number(t.amount), 0);
    const total_spent = tx.filter((t) => Number(t.amount) < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    rows = [{ total_earned, total_spent }];
  } else if (s.startsWith("insert or ignore into progress (id, user_id, skill_id, milestone) values (?, ?, ?, ?)")) {
    const exists = db.progress.some((p) => p.user_id === args[1] && p.skill_id === args[2] && p.milestone === args[3]);
    if (!exists) {
      db.progress.push({
        id: args[0],
        user_id: args[1],
        skill_id: args[2],
        milestone: args[3],
        achieved: 0,
        achieved_at: null,
        created_at: nowIso(),
      });
    }
  } else if (s === "update progress set achieved = 1, achieved_at = datetime('now') where user_id = ? and skill_id = ? and milestone = ?") {
    const p = db.progress.find((item) => item.user_id === args[0] && item.skill_id === args[1] && item.milestone === args[2]);
    if (p) {
      p.achieved = 1;
      p.achieved_at = nowIso();
    }
  } else if (s.includes("from progress p join skills s on p.skill_id = s.id where p.user_id = ? order by p.created_at desc")) {
    const progressRows: Row[] = db.progress
      .filter((p) => p.user_id === args[0])
      .map((p): Row => {
        const skill = skillById(db, String(p.skill_id));
        return { ...p, skill_name: skill?.name, category: skill?.category };
      });
    rows = progressRows.sort((a, b) => String(b["created_at"]).localeCompare(String(a["created_at"])));
  } else if (s.includes("from badges b join skills s on b.skill_id = s.id where b.user_id = ? order by b.issued_at desc")) {
    const badgeRows: Row[] = db.badges
      .filter((b) => b.user_id === args[0])
      .map((b): Row => {
        const skill = skillById(db, String(b.skill_id));
        return { ...b, skill_name: skill?.name, category: skill?.category };
      });
    rows = badgeRows.sort((a, b) => String(b["issued_at"]).localeCompare(String(a["issued_at"])));
  } else if (s === "select id from badges where user_id = ? and skill_id = ?") {
    rows = db.badges.filter((b) => b.user_id === args[0] && b.skill_id === args[1]).map((b) => ({ id: b.id }));
  } else if (s.startsWith("insert into badges (id, user_id, skill_id, title, description, share_url, linkedin_url) values (?, ?, ?, ?, ?, ?, ?)")) {
    db.badges.push({
      id: args[0],
      user_id: args[1],
      skill_id: args[2],
      title: args[3],
      description: args[4],
      issued_at: nowIso(),
      share_url: args[5],
      linkedin_url: args[6],
    });
  } else {
    throw new Error(`Unsupported SQL in JSON adapter: ${sql}`);
  }

  if (isWriteQuery(sql)) {
    await writeDB(db);
  }

  return { rows };
}

async function executeMultiple(_: string): Promise<void> {
  await initDB();
}

export async function initDB(): Promise<void> {
  try {
    await fs.access(DB_FILE);
    const db = await readDB();

    let changed = false;
    for (const skill of DEMO_SKILLS) {
      if (!db.skills.some((s) => s.id === skill.id)) {
        db.skills.push({
          id: skill.id,
          name: skill.name,
          category: skill.category,
          description: skill.description || null,
          created_at: nowIso(),
        });
        changed = true;
      }
    }

    for (const teacher of DEMO_TEACHERS) {
      if (!db.users.some((u) => u.id === teacher.id)) {
        db.users.push({
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          password: getDemoPasswordHash(), // ✅ lazy call
          avatar: null,
          bio: `Demo teacher for ${teacher.skills.map((s) => s.skillId).join(", ")}`,
          languages: teacher.languages,
          timezone: teacher.timezone,
          communication_style: teacher.communicationStyle,
          tokens: 30,
          reputation: teacher.reputation,
          is_verified: teacher.isVerified,
          is_flagged: teacher.isFlagged,
          created_at: nowIso(),
          updated_at: nowIso(),
        });
        changed = true;
      }

      for (const skill of teacher.skills) {
        const userSkillId = `${teacher.id}-${skill.skillId}-teacher`;
        if (!db.user_skills.some((us) => us.id === userSkillId || (us.user_id === teacher.id && us.skill_id === skill.skillId && us.role === "teacher"))) {
          db.user_skills.push({
            id: userSkillId,
            user_id: teacher.id,
            skill_id: skill.skillId,
            level: skill.level,
            role: "teacher",
            verified: 1,
            verified_at: nowIso(),
            created_at: nowIso(),
          });
          changed = true;
        }
      }
    }

    if (changed) {
      await writeDB(db);
    }
  } catch {
    await writeDB(seedDB());
  }
}

const db = {
  execute,
  executeMultiple,
};

export default db;