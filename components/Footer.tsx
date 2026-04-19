export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <a href="#" className="logo">
              <div className="logo-icon"></div>
              <span className="logo-text">Skill<span>Swap</span></span>
            </a>
            <p className="footer-brand-desc">The AI-powered platform connecting learners and teachers worldwide. Share skills, grow together.</p>
            <div className="social-links">
              <a href="#" className="social-btn">𝕏</a>
              <a href="#" className="social-btn">⌥</a>
              <a href="#" className="social-btn">in</a>
              <a href="#" className="social-btn">✉</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Classrooms</a>
            <a href="#">Pricing</a>
            <a href="#">API</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <a href="#">Help Center</a>
            <a href="#">Community</a>
            <a href="#">Guides</a>
            <a href="#">Events</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
            <a href="#">Licenses</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Skill Swap AI. All rights reserved.</p>
          <p>Made with <span className="footer-heart">♥</span> for learners everywhere</p>
        </div>
      </div>
    </footer>
  );
}
