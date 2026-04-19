"use client";
import { useEffect, useState } from "react";
import { api, Skill, Match } from "@/lib/api";
import { DEMO_SKILLS, buildDemoMatches } from "@/lib/demo-data";

function uniqueMatches(matches: Match[]): Match[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.teacherId}:${match.skillId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function MatchingPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({ title: "", goals: "", scheduledAt: "", duration: "60" });
  const [bookMsg, setBookMsg] = useState("");
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    api.skills.list()
      .then(r => setSkills(r.skills.length > 0 ? r.skills : DEMO_SKILLS))
      .catch(() => setSkills(DEMO_SKILLS));
  }, []);

  const findMatches = async () => {
    setLoading(true); setMatches([]);
    try {
      const r = await api.matching.find(selectedSkill || undefined);
      const liveMatches = uniqueMatches(r.matches);
      setMatches(liveMatches.length > 0 ? liveMatches : buildDemoMatches(selectedSkill || undefined));
    } catch {
      setMatches(buildDemoMatches(selectedSkill || undefined));
    }
    setLoading(false);
  };

  const handleBook = async (match: Match) => {
    setBookError(""); setBookMsg("");
    if (!bookForm.title || !bookForm.scheduledAt) {
      setBookError("Please fill in title and date/time"); return;
    }
    try {
      const r = await api.sessions.create({
        teacherId: match.teacherId,
        skillId: match.skillId,
        title: bookForm.title,
        goals: bookForm.goals,
        scheduledAt: bookForm.scheduledAt,
        duration: parseInt(bookForm.duration),
        tokensCharged: 5,
      });
      setBookMsg(`✅ Session booked! Meeting: ${r.meetingUrl}`);
      setBooking(null);
    } catch (err: unknown) {
      setBookError(err instanceof Error ? err.message : "Booking failed");
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "#22c55e" : score >= 60 ? "var(--orange)" : "#f59e0b";

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>🤝 Find Teachers</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>AI matches you with the best teachers for your goals</p>
        </div>
      </div>

      {/* Search panel */}
      <div className="dash-card" style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "16px" }}>Find Your Perfect Match</h3>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label className="form-label">Filter by Skill (optional)</label>
            <select className="form-input" value={selectedSkill}
              onChange={e => setSelectedSkill(e.target.value)}>
              <option value="">All Skills</option>
              {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="btn-auth" style={{ marginBottom: "0", width: "auto", padding: "12px 32px" }}
            onClick={findMatches} disabled={loading}>
            {loading ? "Finding matches..." : "🔍 Find Matches"}
          </button>
        </div>
        <div className="algo-info">
          <strong>How AI Matching works:</strong> We score teachers on language compatibility (25%), timezone proximity (20%), communication style (15%), reputation (20%), and skill gap fit (20%).
        </div>
      </div>

      {bookMsg && <div className="alert-success" style={{ marginBottom: "16px" }}>{bookMsg}</div>}

      {/* Matches */}
      {matches.length === 0 && !loading && (
        <div className="dash-empty" style={{ padding: "60px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <p>Click &quot;Find Matches&quot; to discover teachers. Make sure you have added learning skills to your profile!</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {matches.map(match => (
          <div key={`${match.teacherId}:${match.skillId}`} className="match-result-card">
            <div className="match-result-left">
              <div className="match-avatar-lg">{match.teacherName.charAt(0)}</div>
              <div>
                <div className="match-teacher-name">{match.teacherName}</div>
                <div className="match-teacher-email">{match.teacherEmail}</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  <span className="skill-level-badge expert">{match.skillLevel}</span>
                  <span style={{ fontSize: "13px", color: "var(--gray-600)" }}>⭐ {match.reputation.toFixed(1)} rep</span>
                </div>
              </div>
            </div>
            <div className="match-result-right">
              <div className="match-score-circle" style={{ borderColor: scoreColor(match.compatibilityScore), color: scoreColor(match.compatibilityScore) }}>
                <span style={{ fontSize: "22px", fontWeight: 800 }}>{match.compatibilityScore}%</span>
                <span style={{ fontSize: "10px" }}>match</span>
              </div>
              <button className="btn-book" onClick={() => { setBooking(match.teacherId); setBookMsg(""); setBookError(""); }}>
                Book Session
              </button>
            </div>

            {booking === match.teacherId && (
              <div className="booking-form">
                <h4 style={{ marginBottom: "16px" }}>📅 Book a Session with {match.teacherName}</h4>
                {bookError && <div className="alert-error">{bookError}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Session Title</label>
                    <input className="form-input" placeholder="e.g. Python for Beginners"
                      value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date & Time</label>
                    <input className="form-input" type="datetime-local"
                      value={bookForm.scheduledAt} onChange={e => setBookForm({ ...bookForm, scheduledAt: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (mins)</label>
                    <select className="form-input" value={bookForm.duration}
                      onChange={e => setBookForm({ ...bookForm, duration: e.target.value })}>
                      {["30","45","60","90","120"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Learning Goals (optional)</label>
                    <textarea className="form-input" rows={2} placeholder="What do you want to achieve?"
                      value={bookForm.goals} onChange={e => setBookForm({ ...bookForm, goals: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="btn-auth" style={{ width: "auto", padding: "10px 24px" }}
                    onClick={() => handleBook(match)}>
                    Confirm (5 🪙)
                  </button>
                  <button onClick={() => setBooking(null)}
                    style={{ background: "none", border: "1px solid var(--gray-200)", borderRadius: "8px", padding: "10px 24px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
