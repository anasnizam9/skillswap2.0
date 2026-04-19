"use client";
import { useEffect, useState } from "react";
import { api, Badge } from "@/lib/api";

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.badges.get().then(r => setBadges(r.badges)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>🏆 Digital Badges</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>Your verified achievements — shareable on LinkedIn</p>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: "24px", background: "var(--orange-pale)", border: "1px solid var(--orange-mid)" }}>
        <h4 style={{ color: "var(--orange)", marginBottom: "8px" }}>How to earn badges</h4>
        <p style={{ fontSize: "14px", color: "var(--gray-600)", lineHeight: "1.6" }}>
          Complete <strong>5 teaching sessions</strong> for any skill to earn a verified digital badge. 
          Badges come with a unique shareable URL and direct LinkedIn share link. 
          Each badge also rewards you with <strong>+20 tokens</strong>!
        </p>
      </div>

      {loading ? <div className="dash-skeleton" style={{ height: "200px" }} /> :
       badges.length === 0 ? (
        <div className="dash-empty" style={{ padding: "80px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏅</div>
          <h3 style={{ marginBottom: "8px" }}>No badges yet</h3>
          <p style={{ color: "var(--gray-400)", marginBottom: "24px" }}>Teach 5 sessions in any skill to earn your first badge!</p>
          <a href="/dashboard/assessment" className="btn-primary" style={{ textDecoration: "none", padding: "12px 28px" }}>
            Get Verified as Teacher →
          </a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {badges.map(b => (
            <div key={b.id} className="badge-card">
              <div className="badge-card-icon">🏅</div>
              <div className="badge-card-body">
                <div style={{ fontFamily: "Nunito Sans", fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>{b.title}</div>
                <div style={{ fontSize: "13px", color: "var(--orange)", marginBottom: "8px" }}>{b.skill_name}</div>
                <div style={{ fontSize: "13px", color: "var(--gray-600)", marginBottom: "16px", lineHeight: "1.5" }}>{b.description}</div>
                <div style={{ fontSize: "12px", color: "var(--gray-400)", marginBottom: "16px" }}>
                  Issued {new Date(b.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {b.share_url && (
                    <a href={b.share_url} target="_blank"
                      style={{ background: "var(--orange-pale)", color: "var(--orange)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                      🔗 Share Badge
                    </a>
                  )}
                  {b.linkedin_url && (
                    <a href={b.linkedin_url} target="_blank"
                      style={{ background: "#0077b5", color: "white", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                      in Add to LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
