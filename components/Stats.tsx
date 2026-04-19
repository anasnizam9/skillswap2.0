const stats = [
  { num: "50K+", label: "Active Learners" },
  { num: "10K+", label: "Expert Teachers" },
  { num: "500+", label: "Skills Available" },
  { num: "98%", label: "Satisfaction Rate" },
];

export default function Stats() {
  return (
    <section className="stats-section">
      <div className="stats-inner">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <span className="stat-num">{s.num}</span>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
