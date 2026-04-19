"use client";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link href="/" className="logo">
        <Image src="/logo.png" alt="SkillSwap logo" width={84} height={84} className="logo-image" priority />
      </Link>
      <div className="nav-links nav-links-center">
        <Link href="/#explore">✦ Explore</Link>
        <Link href="/#features">🎓 Features</Link>
      </div>
      <div className="nav-actions">
        {user && <Link href="/dashboard" className="btn-ghost">📊 Dashboard</Link>}
        {user ? (
          <>
            <span style={{ fontSize: "13px", color: "var(--gray-600)" }}>
              🪙 {user.tokens} tokens
            </span>
            <Link href="/dashboard" className="btn-ghost">{user.name}</Link>
            <button className="btn-primary" onClick={logout}>Sign Out</button>
          </>
        ) : (
          <>
            <Link href="/api/auth/google/start" className="btn-primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
