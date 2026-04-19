"use client";
import { Suspense } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(searchParams.get("error") || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { token, user } = await api.auth.login(form);
      login(token, user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
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
        <h2 style={{ textAlign: "center", marginBottom: "8px" }}>Welcome back</h2>
        <p style={{ textAlign: "center", color: "var(--gray-400)", marginBottom: "32px", fontSize: "14px" }}>Sign in to your account</p>

        {error && <div className="alert-error">{error}</div>}

        <Link
          href="/api/auth/google/start"
          className="btn-auth"
          style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: "16px" }}
        >
          Sign in with Google
        </Link>

        <div style={{ textAlign: "center", color: "var(--gray-400)", fontSize: "13px", marginBottom: "16px" }}>
          or sign in with email
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email" placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password" placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn-auth" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link href="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}