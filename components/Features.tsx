const features = [
  { icon: "🧠", iconClass: "fi-1", title: "AI-Powered Matching", desc: "Our intelligent algorithm analyzes your skills, goals, and learning style to find perfect teaching matches." },
  { icon: "📹", iconClass: "fi-2", title: "HD Video Calls", desc: "Crystal-clear 1-on-1 video sessions with screen sharing, whiteboard, and recording capabilities." },
  { icon: "📚", iconClass: "fi-3", title: "Virtual Classrooms", desc: "Create and join classrooms with lectures, resources, announcements, and progress tracking." },
];

export default function Features() {
  return (
    <section className="features-section" id="features">
      <div className="section-header">
        <h2>Everything You Need to <span>Learn & Teach</span></h2>
        <p>Powerful features designed to make skill sharing effortless and enjoyable for everyone.</p>
      </div>
      <div className="features-grid">
        {features.map((f) => (
          <div key={f.title} className="feature-card">
            <div className={`feature-icon ${f.iconClass}`}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
