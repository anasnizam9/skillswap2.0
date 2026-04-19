const steps = [
  { icon: "👤", num: "01", title: "Create Your Profile", desc: "Sign up and tell us about the skills you want to learn and the ones you can teach.", active: false },
  { icon: "🔍", num: "02", title: "Get AI Matches", desc: "Our smart algorithm analyzes thousands of profiles to find teachers and learners that perfectly match your goals.", active: true },
  { icon: "📅", num: "03", title: "Schedule Sessions", desc: "Book 1-on-1 meetings or join classrooms. Choose times that work for you with our flexible scheduling system.", active: false },
  { icon: "✦", num: "04", title: "Learn & Grow", desc: "Start your learning journey with video calls, chat, and recorded lectures. Track your progress and earn achievements.", active: false },
];

export default function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <div className="section-header">
        <h2>How It <span>Works</span></h2>
        <p>Get started in minutes with our simple four-step process</p>
      </div>
      <div className="steps">
        {steps.map((s) => (
          <div key={s.num} className="step">
            <div className={`step-circle${s.active ? " active" : ""}`}>
              <span className="step-emoji" style={s.active ? { filter: "brightness(10)" } : {}}>{s.icon}</span>
              <div className="step-counter">{s.num}</div>
            </div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
