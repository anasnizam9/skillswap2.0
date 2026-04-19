"use client";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function Hero() {
  const { user } = useAuth();
  return (
    <section className="hero">
      <div className="hero-badge fade-up">AI-Powered Skill Matching</div>
      <h1 className="fade-up delay-1">
        Learn Any Skill<br />Teach What You Know
      </h1>
      <p className="fade-up delay-2">
        Connect with passionate teachers and eager learners worldwide. Our AI matches you with the perfect learning partners for your journey.
      </p>
      <div className="hero-ctas fade-up delay-3">
        {user ? (
          <Link href="/dashboard" className="btn-hero-primary">Go to Dashboard →</Link>
        ) : (
          <Link href="/api/auth/google/start" className="btn-hero-primary">Start Learning Free →</Link>
        )}
        <Link href="/#how" className="btn-hero-secondary">▶ How it Works</Link>
      </div>
    </section>
  );
}
