"use client";
import { useEffect, useState } from "react";
import { api, Session } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const DUMMY_MEETING_URL = "https://meet.google.com/abc-defg-hij";

export default function SessionsPage() {
  const { user, refresh } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming"|"completed"|"all">("upcoming");
  const [completing, setCompleting] = useState<string | null>(null);
  const [rating, setRating] = useState<{ sessionId: string; userId: string } | null>(null);
  const [ratingForm, setRatingForm] = useState({ score: 5, comment: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    api.sessions.list().then(r => setSessions(r.sessions)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (session: Session) => {
    setCompleting(session.id);
    try {
      await api.sessions.complete(session.id);
      setMsg("✅ Session marked complete! Tokens awarded to teacher.");
      load();
      refresh();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error completing session");
    }
    setCompleting(null);
  };

  const handleRate = async () => {
    if (!rating) return;
    try {
      await api.ratings.post({ sessionId: rating.sessionId, ratedUserId: rating.userId, ...ratingForm });
      setMsg("✅ Rating submitted!");
      setRating(null);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Rating failed");
    }
  };

  const filtered = sessions.filter(s =>
    tab === "all" ? true : tab === "upcoming" ? s.status === "scheduled" : s.status === "completed"
  );

  const statusColor = (s: string) =>
    s === "completed" ? "#22c55e" : s === "scheduled" ? "var(--orange)" : "var(--gray-400)";

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>📅 Sessions</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>Manage your learning and teaching sessions</p>
        </div>
        <a href="/dashboard/matching" className="btn-primary" style={{ textDecoration: "none", padding: "12px 24px" }}>
          + Book Session
        </a>
      </div>

      {msg && <div className="alert-success" style={{ marginBottom: "16px" }}>{msg}</div>}

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {(["upcoming","completed","all"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`filter-btn ${tab === t ? "active" : ""}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="filter-count">
              {t === "upcoming" ? sessions.filter(s => s.status === "scheduled").length
               : t === "completed" ? sessions.filter(s => s.status === "completed").length
               : sessions.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? <div className="dash-skeleton" style={{ height: "200px" }} /> :
       filtered.length === 0 ? (
        <div className="dash-empty" style={{ padding: "80px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <p>No {tab} sessions found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.map(s => {
            const isTeacher = user?.id === s.teacher_id;
            const otherName = isTeacher ? s.learner_name : s.teacher_name;
            return (
              <div key={s.id} className="session-detail-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{ background: "var(--orange-pale)", color: "var(--orange)", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>{s.skill_name}</span>
                      <span style={{ borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, background: "#f0f0f0", color: statusColor(s.status) }}>
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--gray-400)", padding: "3px 0" }}>
                        {isTeacher ? "🎓 You're teaching" : "📚 You're learning"}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "Nunito Sans", fontSize: "18px", marginBottom: "6px" }}>{s.title}</h3>
                    {s.goals && <p style={{ fontSize: "14px", color: "var(--gray-600)", marginBottom: "6px" }}>🎯 {s.goals}</p>}
                    <div style={{ fontSize: "13px", color: "var(--gray-400)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <span>👤 with {otherName}</span>
                      <span>📅 {new Date(s.scheduled_at).toLocaleString()}</span>
                      <span>⏱ {s.duration} mins</span>
                      <span>🪙 {s.tokens_charged} tokens</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexDirection: "column", minWidth: "160px" }}>
                    {s.status === "scheduled" && (
                      <a href={s.meeting_url || DUMMY_MEETING_URL} target="_blank" rel="noreferrer"
                        style={{ background: "var(--orange)", color: "white", borderRadius: "8px", padding: "10px 16px", textDecoration: "none", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
                        📹 Join Meeting
                      </a>
                    )}
                    {s.status === "scheduled" && isTeacher && (
                      <button onClick={() => handleComplete(s)} disabled={completing === s.id}
                        style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
                        {completing === s.id ? "..." : "✓ Mark Complete"}
                      </button>
                    )}
                    {s.status === "completed" && (
                      <button onClick={() => setRating({ sessionId: s.id, userId: isTeacher ? s.learner_id : s.teacher_id })}
                        style={{ background: "var(--off-white)", border: "1px solid var(--orange-mid)", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", fontSize: "14px", color: "var(--orange)" }}>
                        ⭐ Rate Session
                      </button>
                    )}
                  </div>
                </div>

                {rating?.sessionId === s.id && (
                  <div className="rating-form">
                    <h4 style={{ marginBottom: "12px" }}>Rate your experience with {otherName}</h4>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setRatingForm({ ...ratingForm, score: n })}
                          style={{ fontSize: "28px", background: "none", border: "none", cursor: "pointer", opacity: ratingForm.score >= n ? 1 : 0.3 }}>⭐</button>
                      ))}
                    </div>
                    <textarea className="form-input" rows={2} placeholder="Leave a comment (optional)"
                      value={ratingForm.comment} onChange={e => setRatingForm({ ...ratingForm, comment: e.target.value })} />
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <button className="btn-auth" style={{ width: "auto", padding: "10px 24px" }} onClick={handleRate}>Submit Rating</button>
                      <button onClick={() => setRating(null)}
                        style={{ background: "none", border: "1px solid var(--gray-200)", borderRadius: "8px", padding: "10px 20px", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

