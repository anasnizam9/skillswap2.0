"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/skills", label: "My Skills", icon: "🎯" },
  { href: "/dashboard/matching", label: "Find Teachers", icon: "🤝" },
  { href: "/dashboard/assessment", label: "Assessment", icon: "📝" },
  { href: "/dashboard/sessions", label: "Sessions", icon: "📅" },
  { href: "/dashboard/progress", label: "Progress", icon: "📈" },
  { href: "/dashboard/tokens", label: "Tokens", icon: "🪙" },
  { href: "/dashboard/badges", label: "Badges", icon: "🏆" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <Link href="/" className="logo" style={{ padding: "0 0 24px", marginBottom: "0" }}>
          <span className="logo-text">Skill<span>Swap</span></span>
        </Link>

        <div className="dash-user-card">
          <div className="dash-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontFamily: "Nunito Sans", fontWeight: 700, fontSize: "13px", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
        </div>

        <div className="dash-token-pill">
          <span>🪙</span>
          <span><strong>{user.tokens}</strong> tokens</span>
        </div>

        <nav className="dash-nav">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`dash-nav-item ${pathname === item.href ? "active" : ""}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button className="dash-logout" onClick={logout}>← Sign Out</button>
      </aside>

      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
