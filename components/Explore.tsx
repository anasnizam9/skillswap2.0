"use client";
import Link from "next/link";

const skillCategories = [
  { label: "Programming", labelClass: "sl-prog", count: "128 teachers", tags: ["JavaScript", "Python", "React", "Node.js", "TypeScript"], link: "Explore Programming" },
  { label: "Design", labelClass: "sl-design", count: "85 teachers", tags: ["UI/UX Design", "Figma", "Graphic Design", "Illustration"], link: "Explore Design" },
  { label: "AI & Data", labelClass: "sl-ai", count: "64 teachers", tags: ["Machine Learning", "Data Science", "AI", "Deep Learning"], link: "Explore AI & Data" },
];

export default function Explore() {
  return (
    <section className="explore-section" id="explore">
      <div className="section-header">
        <h2>Explore <span>500+</span> Skills</h2>
        <p>From coding to cooking, languages to leadership — find experts in any skill you want to master</p>
      </div>
      <div className="skills-grid">
        {skillCategories.map((cat) => (
          <div key={cat.label} className="skill-card">
            <div className="skill-header">
              <span className={`skill-label ${cat.labelClass}`}>{cat.label}</span>
              <span className="skill-count">{cat.count}</span>
            </div>
            <div className="skill-tags">
              {cat.tags.map((tag) => (<span key={tag} className="skill-tag">{tag}</span>))}
            </div>
            <Link href="/register" className="skill-link">{cat.link} →</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
