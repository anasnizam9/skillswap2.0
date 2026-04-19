"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "", bio: user?.bio || "",
    languages: user?.languages || "English",
    timezone: user?.timezone || "UTC",
    communicationStyle: user?.communication_style || "casual",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(""); setError("");
    try {
      await api.profile.update(form);
      await refresh();
      setMsg("✅ Profile updated successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>👤 My Profile</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>Update your profile to improve AI matching</p>
        </div>
      </div>

      <div className="dash-grid-2">
        {/* Profile form */}
        <div className="dash-card">
          <h3 style={{ marginBottom: "20px" }}>Profile Information</h3>
          {msg && <div className="alert-success">{msg}</div>}
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} placeholder="Tell others about yourself..."
                value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Languages</label>
              <input className="form-input" placeholder="English, Urdu, French..."
                value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-input" value={form.timezone}
                onChange={e => setForm({ ...form, timezone: e.target.value })}>
                {["UTC","PKT","IST","EST","PST","CST","MST","GMT","CET","JST","AEST"].map(tz =>
                  <option key={tz} value={tz}>{tz}</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Communication Style</label>
              <div className="style-options">
                {["casual","structured","visual"].map(s => (
                  <button type="button" key={s}
                    className={`style-btn ${form.communicationStyle === s ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, communicationStyle: s })}>
                    {s === "casual" ? "💬 Casual" : s === "structured" ? "📋 Structured" : "🎨 Visual"}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-auth" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Account stats */}
        <div>
          <div className="dash-card" style={{ marginBottom: "16px" }}>
            <h3 style={{ marginBottom: "16px" }}>Account Overview</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Email", value: user.email },
                { label: "Member since", value: new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
                { label: "Token balance", value: `🪙 ${user.tokens} tokens` },
                { label: "Reputation", value: `⭐ ${user.reputation.toFixed(1)} / 5.0` },
                { label: "Status", value: user.is_flagged ? "⚠ Flagged" : user.is_verified ? "✓ Verified" : "● Active" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--gray-100)" }}>
                  <span style={{ fontSize: "14px", color: "var(--gray-400)" }}>{item.label}</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card" style={{ background: "var(--orange-pale)", border: "1px solid var(--orange-mid)" }}>
            <h4 style={{ color: "var(--orange)", marginBottom: "12px" }}>✦ Improve your matches</h4>
            <ul style={{ fontSize: "13px", color: "var(--gray-600)", paddingLeft: "16px", lineHeight: "1.8" }}>
              <li>Add multiple languages to expand your teacher pool</li>
              <li>Set your correct timezone for scheduling</li>
              <li>Match your communication style with teachers</li>
              <li>Keep your reputation high by rating honestly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
