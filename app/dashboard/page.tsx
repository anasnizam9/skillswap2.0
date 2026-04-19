"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Session, Badge, Milestone } from "@/lib/api";
import Link from "next/link";

const DUMMY_MEETING_URL = "https://meet.google.com/abc-defg-hij";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [sessionStats, setSessionStats] = useState({ sessions_learned: 0, sessions_taught: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.sessions.list(),
      api.badges.get(),
      api.progress.get(),
    ]).then(([s, b, p]) => {
      setSessions(s.sessions.slice(0, 3));
      setBadges(b.badges);
      setMilestones(p.milestones.filter(m => m.achieved));
      setSessionStats(p.sessionStats);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const upcoming = sessions.filter(s => s.status === "scheduled");
  const completed = sessions.filter(s => s.status === "completed");

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>Welcome back, {user.name.split(" ")[0]}! 👋</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>Here&apos;s your learning overview</p>
        </div>
        <Link href="/dashboard/matching" className="btn-primary" style={{ textDecoration: "none", padding: "12px 24px" }}>
          Find Teachers →
        </Link>
      </div>

      {/* Stats row */}
      <div className="dash-stats-row">
        <div className="dash-stat">
          <span className="dash-stat-num" style={{ color: "var(--orange)" }}>{user.tokens}</span>
          <span className="dash-stat-label">🪙 Tokens</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num">{sessionStats.sessions_learned}</span>
          <span className="dash-stat-label">📚 Sessions Learned</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num">{sessionStats.sessions_taught}</span>
          <span className="dash-stat-label">🎓 Sessions Taught</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num">{user.reputation.toFixed(1)}</span>
          <span className="dash-stat-label">⭐ Reputation</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num">{badges.length}</span>
          <span className="dash-stat-label">🏆 Badges</span>
        </div>
      </div>

      <div className="dash-grid-2">
        {/* Upcoming Sessions */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>📅 Upcoming Sessions</h3>
            <Link href="/dashboard/sessions" style={{ fontSize: "13px", color: "var(--orange)" }}>View all</Link>
          </div>
          {loading ? <div className="dash-skeleton" /> : upcoming.length === 0 ? (
            <div className="dash-empty">
              <p>No sessions scheduled yet</p>
              <Link href="/dashboard/matching" className="dash-empty-btn">Find a Teacher</Link>
            </div>
          ) : upcoming.map(s => (
            <div key={s.id} className="session-item">
              <div className="session-skill-badge">{s.skill_name}</div>
              <div className="session-title">{s.title}</div>
              <div className="session-meta">
                with {user.id === s.learner_id ? s.teacher_name : s.learner_name} •{" "}
                {new Date(s.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
              <a href={s.meeting_url || DUMMY_MEETING_URL} target="_blank" rel="noreferrer" className="session-join-btn">Join Meeting →</a>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>✦ Recent Activity</h3>
            <Link href="/dashboard/progress" style={{ fontSize: "13px", color: "var(--orange)" }}>View all</Link>
          </div>
          {loading ? <div className="dash-skeleton" /> : milestones.length === 0 ? (
            <div className="dash-empty">
              <p>No milestones yet. Book your first session!</p>
              <Link href="/dashboard/skills" className="dash-empty-btn">Add Skills</Link>
            </div>
          ) : milestones.slice(0, 5).map(m => (
            <div key={m.id} className="activity-item">
              <div className="activity-dot" />
              <div>
                <div className="activity-text">{m.milestone}</div>
                <div className="activity-skill">{m.skill_name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="dash-card" style={{ marginTop: "24px" }}>
          <div className="dash-card-header">
            <h3>🏆 Your Badges</h3>
            <Link href="/dashboard/badges" style={{ fontSize: "13px", color: "var(--orange)" }}>View all</Link>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {badges.map(b => (
              <div key={b.id} className="badge-chip">
                <span>🏅</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>{b.title}</div>
                  <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>{b.skill_name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="quick-actions">
        <h3 style={{ marginBottom: "16px", fontFamily: "Nunito Sans" }}>Quick Actions</h3>
        <div className="quick-grid">
          {[
            { icon: "🎯", label: "Add a Skill", href: "/dashboard/skills", desc: "List skills you teach or want to learn" },
            { icon: "🤝", label: "Find Teachers", href: "/dashboard/matching", desc: "AI matches you with perfect teachers" },
            { icon: "📝", label: "Take Assessment", href: "/dashboard/assessment", desc: "Verify your skills and become a teacher" },
            { icon: "🪙", label: "Token History", href: "/dashboard/tokens", desc: "Track your earnings and spending" },
          ].map(a => (
            <Link key={a.href} href={a.href} className="quick-card">
              <span className="quick-icon">{a.icon}</span>
              <div>
                <div className="quick-label">{a.label}</div>
                <div className="quick-desc">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
