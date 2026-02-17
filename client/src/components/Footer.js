import React from "react";
import { Link } from "react-router-dom";
import "../styles/footer.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-shell">
        <div className="footer-grid">
          <section className="footer-brand">
            <h2>EmployeeHub</h2>
            <p>Delivering productivity, one team at a time.</p>
            <div className="footer-socials">
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="social-link social-link-github">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.34 6.84 9.7.5.1.66-.22.66-.49 0-.24-.01-.88-.02-1.73-2.78.62-3.37-1.38-3.37-1.38-.45-1.2-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1 .07 1.54 1.06 1.54 1.06.9 1.57 2.35 1.12 2.93.86.1-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.09 0-1.12.38-2.04 1.02-2.76-.11-.26-.45-1.3.09-2.71 0 0 .83-.27 2.73 1.06a9.22 9.22 0 0 1 4.97 0c1.9-1.33 2.73-1.06 2.73-1.06.54 1.41.2 2.45.1 2.71.63.72 1.01 1.64 1.01 2.76 0 3.96-2.35 4.83-4.58 5.08.36.32.67.93.67 1.89 0 1.36-.01 2.45-.01 2.78 0 .27.17.6.67.49A10.3 10.3 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
                </svg>
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="social-link social-link-linkedin">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5.2 8.2a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8Zm1.6 2.2H3.6V20h3.2v-9.6Zm5.1 0H8.8V20H12v-5.1c0-2.9 3.8-3.2 3.8 0V20H19v-6.2c0-4.8-5.4-4.6-7.1-2.2v-1.2Z" />
                </svg>
              </a>
              <a href="/" aria-label="Portfolio" className="social-link social-link-portfolio">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" />
                  <path d="M3 12h18M12 3c2.6 2.4 4 5.7 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.7-4-9s1.4-6.6 4-9Z" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </a>
            </div>
          </section>

          <section className="footer-column">
            <h3>Quick Links</h3>
            <nav className="footer-links" aria-label="Quick links">
              <Link to="/">Home</Link>
              <Link to="/attendance">Attendance</Link>
              <Link to="/attendance-history">History</Link>
              <Link to="/">My Profile</Link>
            </nav>
          </section>

          <section className="footer-column">
            <h3>Company</h3>
            <nav className="footer-links" aria-label="Company links">
              <Link to="/about-us">About Us</Link>
              <Link to="/careers">Careers</Link>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms-of-service">Terms of Service</Link>
            </nav>
          </section>

          <section className="footer-column">
            <h3>Contact Us</h3>
            <ul className="footer-contact-list">
              <li>
                <span className="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s7-4.4 7-10a7 7 0 1 0-14 0c0 5.6 7 10 7 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="11" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <span>Bariapur, India</span>
              </li>
              <li>
                <span className="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 16.4v2.4a2 2 0 0 1-2.2 2A16.7 16.7 0 0 1 3.2 6.2 2 2 0 0 1 5.2 4H7.6c.8 0 1.6.5 1.9 1.2l1.1 2.7c.2.7 0 1.4-.6 1.8l-1.4 1a13.2 13.2 0 0 0 4.7 4.7l1-1.4c.4-.6 1.2-.9 1.8-.6l2.7 1.1c.7.3 1.2 1.1 1.2 1.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>+91 00000-00000</span>
              </li>
              <li>
                <span className="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>support@employeehub.com</span>
              </li>
            </ul>
          </section>

          <section className="footer-column">
            <h3>Download App</h3>
            <div className="store-links">
              <a href="/" className="store-link" aria-label="Download on the App Store">
                <span className="store-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.3 13.2c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-3 .9-3.7.9-.8 0-1.9-.9-3.1-.9-1.6 0-3 .9-3.8 2.4-1.6 2.7-.4 6.7 1.1 8.9.8 1.1 1.7 2.3 2.9 2.2 1.1 0 1.6-.7 3.1-.7s1.9.7 3.2.7c1.3 0 2.1-1.1 2.9-2.2.9-1.2 1.3-2.4 1.3-2.5 0 0-2.5-1-2.5-3.2Zm-2.5-7c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.7 1.3-.6.7-1.2 1.8-1 2.8 1 .1 2.1-.5 2.7-1.2Z" />
                  </svg>
                </span>
                <span className="store-copy">
                  <small>Download on the</small>
                  <strong>App Store</strong>
                </span>
              </a>

              <a href="/" className="store-link" aria-label="Get it on Google Play">
                <span className="store-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="m3.9 3.2 10.5 8.8-10.5 8.8c-.5-.3-.8-.8-.8-1.4V4.6c0-.6.3-1.1.8-1.4Zm11.6 9.7 2.8-2.3L7.2 4.2l8.3 8.7Zm0 1.2-8.3 8.7 11.1-6.4-2.8-2.3Zm4-2.3 1.8 1c1.1.6 1.1 2.1 0 2.7l-1.8 1-2.9-2.5 2.9-2.2Zm1.8-2.6-1.8 1L16.6 8l2.9-2.5 1.8 1c1.1.6 1.1 2.1 0 2.7Z" />
                  </svg>
                </span>
                <span className="store-copy">
                  <small>Get it on</small>
                  <strong>Google Play</strong>
                </span>
              </a>
            </div>
          </section>
        </div>

        <div className="footer-divider"></div>
        <p className="footer-copyright">
          &copy; {year} EmployeeHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;

