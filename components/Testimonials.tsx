const testimonials = [
  {
    text: "\"Skill Swap AI matched me with an amazing Python teacher. In just 3 months, I went from beginner to building my own ML projects. The AI matching is incredibly accurate!\"",
    name: "Emily Chen", role: "Software Developer", badge: "Python & ML", emoji: "👩",
  },
  {
    text: "\"I've been teaching UI/UX design here and the platform is fantastic. The classroom features, video quality, and student engagement tools make teaching a joy.\"",
    name: "Marcus Johnson", role: "Designer & Teacher", badge: "UI/UX Design", emoji: "👨",
  },
];

export default function Testimonials() {
  return (
    <section className="testi-section">
      <div className="section-header">
        <h2>Loved by <span>Learners</span> & <span>Teachers</span></h2>
        <p>Join thousands of people who are transforming their skills</p>
      </div>
      <div className="testi-grid">
        {testimonials.map((t) => (
          <div key={t.name} className="testi-card">
            <div className="stars">★★★★★</div>
            <p className="testi-text">{t.text}</p>
            <div className="testi-author">
              <div className="testi-avatar">{t.emoji}</div>
              <div>
                <div className="testi-name">{t.name}</div>
                <div className="testi-role">{t.role}</div>
                <span className="testi-badge">{t.badge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
