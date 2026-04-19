"use client";
import { useEffect, useState } from "react";
import { api, Skill, UserSkill } from "@/lib/api";

export default function SkillsPage() {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ skillId: "", level: "intermediate", role: "learner" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Programming", "Design", "AI & Data"];

  const loadData = () => {
    Promise.all([api.skills.list(), api.auth.me()])
      .then(([s, me]) => { setAllSkills(s.skills); setMySkills(me.skills); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.skillId) { setError("Please select a skill"); return; }
    setAdding(true); setMsg(""); setError("");
    try {
      await api.skills.add({ skillId: form.skillId, level: form.level, role: form.role });
      setMsg(form.role === "teacher"
        ? "✅ Skill added as teacher! Take an assessment to get verified."
        : "✅ Skill added! Find teachers to start learning.");
      loadData();
      setForm({ skillId: "", level: "intermediate", role: "learner" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add skill");
    }
    setAdding(false);
  };

  const filtered = allSkills.filter(s => filter === "All" || s.category === filter);
  const teachingSkills = mySkills.filter(s => s.role === "teacher");
  const learningSkills = mySkills.filter(s => s.role === "learner");

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>🎯 My Skills</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>Manage what you teach and what you want to learn</p>
        </div>
      </div>

      <div className="dash-grid-2" style={{ marginBottom: "24px" }}>
        {/* Add Skill */}
        <div className="dash-card">
          <h3 style={{ marginBottom: "20px" }}>➕ Add a Skill</h3>
          {msg && <div className="alert-success">{msg}</div>}
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Select Skill</label>
              <select className="form-input" value={form.skillId}
                onChange={e => setForm({ ...form, skillId: e.target.value })}>
                <option value="">Choose a skill...</option>
                {allSkills.map(s => <option key={s.id} value={s.id}>{s.name} — {s.category}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Your Level</label>
              <select className="form-input" value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}>
                {["beginner","intermediate","advanced","expert"].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">I want to...</label>
              <div className="style-options">
                <button type="button" className={`style-btn ${form.role === "learner" ? "selected" : ""}`}
                  onClick={() => setForm({ ...form, role: "learner" })}>📚 Learn this</button>
                <button type="button" className={`style-btn ${form.role === "teacher" ? "selected" : ""}`}
                  onClick={() => setForm({ ...form, role: "teacher" })}>🎓 Teach this</button>
              </div>
            </div>
            <button className="btn-auth" type="submit" disabled={adding}>
              {adding ? "Adding..." : "Add Skill"}
            </button>
          </form>
        </div>

        {/* My Skills */}
        <div className="dash-card">
          <h3 style={{ marginBottom: "16px" }}>My Skill Profile</h3>
          {loading ? <div className="dash-skeleton" /> : mySkills.length === 0 ? (
            <div className="dash-empty"><p>Add your first skill to get started!</p></div>
          ) : (
            <>
              {teachingSkills.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--orange)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>🎓 Teaching</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {teachingSkills.map(s => (
                      <div key={s.id} className="skill-item">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <span className="skill-item-name">{s.skill_name || s.skill_id}</span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <span className={`skill-level-badge ${s.level}`}>{s.level}</span>
                            <span className={s.verified ? "verified-badge" : "unverified-badge"}>
                              {s.verified ? "✓ Verified" : "⚠ Unverified"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {learningSkills.length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>📚 Learning</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {learningSkills.map(s => (
                      <div key={s.id} className="skill-item">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <span className="skill-item-name">{s.skill_name || s.skill_id}</span>
                          <span className={`skill-level-badge ${s.level}`}>{s.level}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {teachingSkills.some(s => !s.verified) && (
            <div className="alert-info" style={{ marginTop: "16px" }}>
              💡 Get verified to appear in teacher search!{" "}
              <a href="/dashboard/assessment" style={{ color: "var(--orange)", fontWeight: 700 }}>Take Assessment →</a>
            </div>
          )}
        </div>
      </div>

      {/* Browse all */}
      <div className="dash-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3>Browse All Skills ({allSkills.length})</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} className={`filter-btn ${filter === c ? "active" : ""}`}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
          {filtered.map(s => (
            <div key={s.id} className="skill-browse-card">
              <div className="skill-browse-name">{s.name}</div>
              <div className="skill-browse-cat">{s.category}</div>
              <div className="skill-browse-count">👨‍🏫 {String(s.teacherCount || 0)} teachers</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
