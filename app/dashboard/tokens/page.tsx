"use client";
import { useEffect, useState } from "react";
import { api, TokenTx } from "@/lib/api";

export default function TokensPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<TokenTx[]>([]);
  const [stats, setStats] = useState({ total_earned: 0, total_spent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.tokens.get().then(r => {
      setBalance(r.balance);
      setTransactions(r.transactions);
      setStats(r.stats);
    }).finally(() => setLoading(false));
  }, []);

  const typeIcon: Record<string, string> = {
    signup_bonus: "🎁", teach_session: "🎓", learn_session: "📚",
    verification_bonus: "✅", badge_reward: "🏆",
  };

  return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>🪙 Token Economy</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>Earn by teaching, spend to learn — a balanced ecosystem</p>
        </div>
      </div>

      {/* Balance card */}
      <div style={{ background: "linear-gradient(135deg, #111111, #2a2a2a)", borderRadius: "20px", padding: "40px", marginBottom: "24px", color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-40px", top: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "8px" }}>Current Balance</div>
        <div style={{ fontFamily: "Nunito Sans", fontSize: "64px", fontWeight: 800, lineHeight: 1 }}>{balance}</div>
        <div style={{ fontSize: "18px", opacity: 0.8, marginTop: "4px" }}>Tokens</div>
        <div style={{ display: "flex", gap: "32px", marginTop: "24px" }}>
          <div>
            <div style={{ opacity: 0.7, fontSize: "13px" }}>Total Earned</div>
            <div style={{ fontFamily: "Nunito Sans", fontSize: "24px", fontWeight: 700 }}>+{stats.total_earned || 0}</div>
          </div>
          <div>
            <div style={{ opacity: 0.7, fontSize: "13px" }}>Total Spent</div>
            <div style={{ fontFamily: "Nunito Sans", fontSize: "24px", fontWeight: 700 }}>{stats.total_spent || 0}</div>
          </div>
        </div>
      </div>

      {/* Token guide */}
      <div className="dash-card" style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "16px" }}>How to Earn & Spend</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          {[
            { icon: "🎁", label: "Sign Up Bonus", amount: "+10", color: "#22c55e" },
            { icon: "🎓", label: "Teach a Session", amount: "+5", color: "#22c55e" },
            { icon: "✅", label: "Pass Assessment", amount: "+5", color: "#22c55e" },
            { icon: "🏆", label: "Earn a Badge", amount: "+20", color: "#22c55e" },
            { icon: "📚", label: "Book a Session", amount: "-5", color: "var(--orange)" },
          ].map(item => (
            <div key={item.label} style={{ background: "var(--off-white)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>{item.label}</div>
                <div style={{ fontFamily: "Nunito Sans", fontWeight: 800, color: item.color }}>{item.amount} tokens</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="dash-card">
        <h3 style={{ marginBottom: "20px" }}>Transaction History</h3>
        {loading ? <div className="dash-skeleton" /> :
         transactions.length === 0 ? (
          <div className="dash-empty"><p>No transactions yet</p></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {transactions.map(tx => (
              <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--gray-100)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>{typeIcon[tx.type] || "🔄"}</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "14px" }}>{tx.description}</div>
                    <div style={{ fontSize: "12px", color: "var(--gray-400)" }}>
                      {new Date(tx.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: "Nunito Sans", fontWeight: 800, fontSize: "18px", color: tx.amount > 0 ? "#22c55e" : "var(--black)" }}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
