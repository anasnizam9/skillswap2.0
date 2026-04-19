"use client";
import { useEffect, useState } from "react";
import { api, Milestone, UserSkill } from "@/lib/api";

export default function ProgressPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState({ sessions_learned: 0, sessions_taught: 0 });
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.progress.get().then(r => {
      setMilestones(r.milestones);
      setStats(r.sessionStats);
      setSkills(r.skillsLearning);
    }).finally(() => setLoading(false));
  }, []);

  const achieved = milestones.filter(m => m.achieved);
  const pending = milestones.filter(m => !m.achieved);

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>📈 Learning Progress</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>Track your journey and celebrate milestones</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats-row" style={{ marginBottom: "24px" }}>
        <div className="dash-stat">
          <span className="dash-stat-num">{stats.sessions_learned}</span>
          <span className="dash-stat-label">📚 Sessions Learned</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num">{stats.sessions_taught}</span>
          <span className="dash-stat-label">🎓 Sessions Taught</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num">{achieved.length}</span>
          <span className="dash-stat-label">✅ Milestones Achieved</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num">{skills.length}</span>
          <span className="dash-stat-label">🎯 Skills in Progress</span>
        </div>
      </div>

      <div className="dash-grid-2">
        {/* Milestones */}
        <div className="dash-card">
          <h3 style={{ marginBottom: "20px" }}>✦ Milestones</h3>
          {loading ? <div className="dash-skeleton" /> :
           milestones.length === 0 ? (
            <div className="dash-empty">
              <p>No milestones yet. Book your first session to start!</p>
            </div>
          ) : (
            <div>
              {achieved.length > 0 && (
                <>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>✅ Achieved</div>
                  {achieved.map(m => (
                    <div key={m.id} className="milestone-item achieved">
                      <div className="milestone-check">✓</div>
                      <div>
                        <div className="milestone-text">{m.milestone}</div>
                        <div className="milestone-skill">{m.skill_name} • {m.achieved_at ? new Date(m.achieved_at).toLocaleDateString() : ""}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {pending.length > 0 && (
                <>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--gray-400)", marginBottom: "12px", marginTop: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>⏳ In Progress</div>
                  {pending.map(m => (
                    <div key={m.id} className="milestone-item pending">
                      <div className="milestone-dot" />
                      <div>
                        <div className="milestone-text">{m.milestone}</div>
                        <div className="milestone-skill">{m.skill_name}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Skills Journey */}
        <div className="dash-card">
          <h3 style={{ marginBottom: "20px" }}>🎯 Skills You&apos;re Learning</h3>
          {loading ? <div className="dash-skeleton" /> :
           skills.length === 0 ? (
            <div className="dash-empty">
              <p>No learning skills added yet.</p>
              <a href="/dashboard/skills" className="dash-empty-btn">Add Skills</a>
            </div>
          ) : skills.map(s => {
            const sessionsForSkill = stats.sessions_learned;
            const progress = Math.min(100, sessionsForSkill * 20);
            return (
              <div key={s.id} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{s.skill_name}</span>
                    <span className={`skill-level-badge ${s.level}`} style={{ marginLeft: "8px" }}>{s.level}</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "var(--gray-400)" }}>{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "4px" }}>
                  {sessionsForSkill} session{sessionsForSkill !== 1 ? "s" : ""} completed
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning path suggestion */}
      <div className="dash-card" style={{ marginTop: "24px", background: "linear-gradient(135deg, var(--orange-pale), #fff)" }}>
        <h3 style={{ marginBottom: "16px", color: "var(--orange)" }}>✦ Suggested Next Steps</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {[
            { icon: "🤝", title: "Find a Match", desc: "Connect with a verified teacher for your skill", href: "/dashboard/matching" },
            { icon: "📝", title: "Get Verified", desc: "Take an assessment to become a verified teacher", href: "/dashboard/assessment" },
            { icon: "🏆", title: "Earn Badges", desc: "Complete 5 sessions to earn your first badge", href: "/dashboard/badges" },
          ].map(step => (
            <a key={step.title} href={step.href} className="next-step-card">
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{step.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>{step.title}</div>
              <div style={{ fontSize: "13px", color: "var(--gray-600)" }}>{step.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
