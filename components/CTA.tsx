import Link from "next/link";

export default function CTA() {
  return (
    <section className="cta-section">
      <div className="cta-inner">
        <div className="cta-badge">✦ Start Free Today</div>
        <h2>Ready to Transform<br />Your Skills?</h2>
        <p>Join 50,000+ learners and teachers on Skill Swap AI. Start learning something new or share your expertise with the world.</p>
        <div className="cta-btns">
          <Link href="/register" className="btn-cta-white" style={{ textDecoration: "none", display: "inline-block" }}>Create Free Account →</Link>
          <Link href="/#explore" className="btn-cta-outline" style={{ textDecoration: "none", display: "inline-block" }}>Explore Skills</Link>
        </div>
        <p className="cta-note">No credit card required • Free forever plan available • 10 tokens on signup</p>
      </div>
    </section>
  );
}
