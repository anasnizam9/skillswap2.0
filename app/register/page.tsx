"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    timezone: "UTC", languages: "English", communicationStyle: "casual",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true); setError("");
    try {
      const { token, user } = await api.auth.register(form);
      login(token, user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="logo" style={{ justifyContent: "center", marginBottom: "32px" }}>
          <div className="logo-icon">✦</div>
          <span className="logo-text">Skill<span>Swap</span></span>
        </Link>
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? "active" : ""}`}>1</div>
          <div className="step-line" />
          <div className={`step-dot ${step >= 2 ? "active" : ""}`}>2</div>
        </div>
        <h2 style={{ textAlign: "center", margin: "24px 0 8px" }}>
          {step === 1 ? "Create your account" : "Personalize your experience"}
        </h2>
        <p style={{ textAlign: "center", color: "var(--gray-400)", marginBottom: "28px", fontSize: "14px" }}>
          {step === 1 ? "Start with the basics" : "Help us match you better"}
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Ali Khan"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="At least 8 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Languages you speak</label>
                <input className="form-input" type="text" placeholder="English, Urdu, Punjabi"
                  value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Your Timezone</label>
                <select className="form-input" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}>
                  {["UTC","PKT","IST","EST","PST","CST","MST","GMT","CET","JST","AEST"].map(tz =>
                    <option key={tz} value={tz}>{tz}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Learning style</label>
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
            </>
          )}
          <button className="btn-auth" type="submit" disabled={loading}>
            {loading ? "Creating account..." : step === 1 ? "Continue →" : "Create Account & Get 10 Tokens 🪙"}
          </button>
        </form>
        {step === 2 && (
          <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer", width: "100%", marginTop: "12px", fontSize: "14px" }}>
            ← Back
          </button>
        )}
        <p className="auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
