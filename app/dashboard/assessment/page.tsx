"use client";
import { useEffect, useState } from "react";
import { api, Skill, Question } from "@/lib/api";

type Phase = "setup" | "quiz" | "result";

interface Result { score: number; passed: boolean; correct: number; total: number; message: string; }

export default function AssessmentPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [form, setForm] = useState({ skillId: "", level: "intermediate" });
  const [assessmentId, setAssessmentId] = useState("");
  const [skillName, setSkillName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.skills.list().then(r => setSkills(r.skills));
  }, []);

  const startAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const r = await api.assessment.generate({ skillId: form.skillId, level: form.level });
      setAssessmentId(r.assessmentId);
      setSkillName(r.skillName);
      setQuestions(r.questions);
      setAnswers(new Array(r.questions.length).fill(-1));
      setCurrent(0);
      setPhase("quiz");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate assessment");
    }
    setLoading(false);
  };

  const selectAnswer = (optIdx: number) => {
    const updated = [...answers];
    updated[current] = optIdx;
    setAnswers(updated);
  };

  const submitQuiz = async () => {
    if (answers.includes(-1)) { setError("Please answer all questions"); return; }
    setLoading(true);
    try {
      const r = await api.assessment.submit({ assessmentId, answers });
      setResult(r);
      setPhase("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
    setLoading(false);
  };

  if (phase === "setup") return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>📝 Skill Assessment</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>Verify your skills to become a verified teacher</p>
        </div>
      </div>

      <div style={{ maxWidth: "560px" }}>
        <div className="dash-card" style={{ marginBottom: "24px" }}>
          <div style={{ background: "var(--orange-pale)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <h4 style={{ color: "var(--orange)", marginBottom: "8px" }}>✦ How it works</h4>
            <ul style={{ fontSize: "14px", color: "var(--gray-600)", paddingLeft: "20px", lineHeight: "1.8" }}>
              <li>5 AI-generated questions based on your skill level</li>
              <li>You need 60% or higher to pass</li>
              <li>Passing verifies your teacher status for that skill</li>
              <li>You earn 5 bonus tokens when you pass</li>
            </ul>
          </div>

          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={startAssessment}>
            <div className="form-group">
              <label className="form-label">Skill to assess</label>
              <select className="form-input" value={form.skillId}
                onChange={e => setForm({ ...form, skillId: e.target.value })} required>
                <option value="">Select a skill...</option>
                {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Your claimed level</label>
              <select className="form-input" value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}>
                {["beginner","intermediate","advanced","expert"].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
            <button className="btn-auth" type="submit" disabled={loading}>
              {loading ? "Generating quiz..." : "Start Assessment →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  if (phase === "quiz") return (
    <div className="dash-content">
      <div className="dash-header">
        <div>
          <h1>📝 {skillName} Assessment</h1>
          <p style={{ color: "var(--gray-400)", marginTop: "4px" }}>Question {current + 1} of {questions.length}</p>
        </div>
      </div>

      <div style={{ maxWidth: "640px" }}>
        {/* Progress bar */}
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="dash-card">
          <div className="quiz-question">{questions[current].q}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {questions[current].options.map((opt, i) => (
              <button key={i} className={`quiz-option ${answers[current] === i ? "selected" : ""}`}
                onClick={() => selectAnswer(i)}>
                <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>

          {error && <div className="alert-error" style={{ marginTop: "16px" }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
            <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
              className="quiz-nav-btn">← Previous</button>

            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent(current + 1)} disabled={answers[current] === -1}
                className="quiz-nav-btn primary">Next →</button>
            ) : (
              <button onClick={submitQuiz} disabled={loading || answers.includes(-1)}
                className="btn-auth" style={{ width: "auto", padding: "12px 28px" }}>
                {loading ? "Submitting..." : "Submit Quiz"}
              </button>
            )}
          </div>
        </div>

        {/* Question dots */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{
                width: "32px", height: "32px", borderRadius: "50%", border: "2px solid",
                borderColor: i === current ? "var(--orange)" : answers[i] !== -1 ? "#22c55e" : "var(--gray-200)",
                background: i === current ? "var(--orange)" : answers[i] !== -1 ? "#22c55e" : "white",
                color: i === current || answers[i] !== -1 ? "white" : "var(--gray-400)",
                cursor: "pointer", fontSize: "12px", fontWeight: 700,
              }}>{i + 1}</button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dash-content">
      <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center", paddingTop: "40px" }}>
        <div style={{ fontSize: "72px", marginBottom: "24px" }}>{result?.passed ? "🎉" : "😔"}</div>
        <h1 style={{ marginBottom: "12px" }}>{result?.passed ? "You Passed!" : "Not Quite"}</h1>
        <div className="result-score-ring" style={{ borderColor: result?.passed ? "#22c55e" : "var(--orange)" }}>
          <span style={{ fontSize: "48px", fontWeight: 800, color: result?.passed ? "#22c55e" : "var(--orange)" }}>
            {result?.score}%
          </span>
          <span style={{ fontSize: "14px", color: "var(--gray-400)" }}>{result?.correct}/{result?.total} correct</span>
        </div>
        <p style={{ color: "var(--gray-600)", marginBottom: "32px", lineHeight: "1.6" }}>{result?.message}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button className="btn-auth" style={{ width: "auto" }} onClick={() => setPhase("setup")}>
            {result?.passed ? "Take Another" : "Try Again"}
          </button>
          {result?.passed && (
            <a href="/dashboard/matching" className="btn-auth"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", background: "var(--gray-800)" }}>
              Find Students →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
