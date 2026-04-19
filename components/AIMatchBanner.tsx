export default function AIMatchBanner() {
  return (
    <div className="match-banner-wrap">
      <div className="match-banner">
        <div className="match-profile">
          <div className="match-avatar">SJ</div>
          <div>
            <div className="match-name">Sarah Johnson</div>
            <div className="match-role">Python Expert</div>
            <div className="match-tags">
              <span className="match-tag">Python</span>
              <span className="match-tag">Machine Learning</span>
            </div>
          </div>
        </div>
        <div className="match-center">
          <div className="match-pct">95% Match</div>
          <div style={{ fontSize: "32px" }}>✦</div>
        </div>
        <div className="match-profile">
          <div className="match-avatar">AK</div>
          <div>
            <div className="match-name">Alex Kim</div>
            <div className="match-role">Wants to Learn</div>
            <div className="match-tags">
              <span className="match-tag">AI/ML Basics</span>
              <span className="match-tag">Data Science</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
