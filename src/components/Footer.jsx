/* ---- Inline icons (no external icon library needed) ---- */
const Phone = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.99.36 1.97.68 2.9a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.18-1.18a2 2 0 0 1 2.11-.45c.93.32 1.91.55 2.9.68A2 2 0 0 1 22 16.92z" />
  </svg>
);
const Mail = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);
const MapPin = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const Facebook = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
  </svg>
);
const Instagram = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const Linkedin = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M4.98 3.5C4.98 4.6 4.1 5.5 3 5.5S1 4.6 1 3.5 1.9 1.5 3 1.5s1.98.9 1.98 2ZM1.3 8.3h3.4V22H1.3V8.3ZM8.4 8.3h3.3v1.9h.05c.46-.87 1.6-1.9 3.3-1.9 3.5 0 4.2 2.3 4.2 5.3V22h-3.4v-6.5c0-1.5 0-3.5-2.1-3.5s-2.4 1.7-2.4 3.4V22H8.4V8.3Z" />
  </svg>
);
const Youtube = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22.5 8.5s-.2-1.7-.9-2.4c-.9-.9-1.9-.9-2.3-1C16.6 5 12 5 12 5h0s-4.6 0-7.3.1c-.4 0-1.4.1-2.3 1-.7.7-.9 2.4-.9 2.4S1.3 10.4 1.3 12.3v1.7c0 1.9.2 3.8.2 3.8s.2 1.7.9 2.4c.9.9 2.1.9 2.6 1 1.9.2 8 .1 8 .1s4.6 0 7.3-.2c.4 0 1.4-.1 2.3-1 .7-.7.9-2.4.9-2.4s.2-1.9.2-3.8v-1.7c0-1.9-.2-3.8-.2-3.8Z" />
    <path d="m9.8 15.5 5-3-5-3v6Z" fill="currentColor" stroke="none" />
  </svg>
);
const Quote = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M9.3 8.6c-2.6.9-4.3 3-4.3 5.6 0 2.2 1.5 4 3.6 4 1.9 0 3.3-1.5 3.3-3.4 0-1.7-1.2-3-2.8-3.2.3-1.4 1.5-2.6 2.9-3.1L9.3 8.6Zm9.6 0c-2.6.9-4.3 3-4.3 5.6 0 2.2 1.5 4 3.6 4 1.9 0 3.3-1.5 3.3-3.4 0-1.7-1.2-3-2.8-3.2.3-1.4 1.5-2.6 2.9-3.1l-2.7-3Z" />
  </svg>
);
const stats = [
  { value: "22", label: "Countries" },
  { value: "18,000 KM", label: "Distance Covered" },
  { value: "70", label: "Days" },
  { value: "Countless", label: "Blessings" },
];

function Footer() {
  return (
       <footer className="site-footer">
      <div className="footer-top">
        {/* Column 1 : Get in Touch */}
        <div className="footer-col">
          <h3 className="footer-heading">Get in Touch</h3>
          <ul className="contact-list">
            <li>
              <span className="icon-circle"><Phone /></span>
              <span>+44 75930 10893</span>
            </li>
            <li>
              <span className="icon-circle"><Mail /></span>
              <span>Khedkaranil@gmail.com</span>
            </li>
            <li>
              <span className="icon-circle"><MapPin /></span>
              <span>London, United Kingdom</span>
            </li>
          </ul>
          <div className="social-icons">
            <a href="#" aria-label="Facebook" className="icon-circle"><Facebook /></a>
            <a href="#" aria-label="Instagram" className="icon-circle"><Instagram /></a>
            <a href="#" aria-label="LinkedIn" className="icon-circle"><Linkedin /></a>
            <a href="#" aria-label="YouTube" className="icon-circle"><Youtube /></a>
          </div>
        </div>
 
        <div className="footer-divider" />
 
        {/* Column 2 : Quick Links */}
        <div className="footer-col">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="links-list">
            <li><a href="#about">About</a></li>
            <li><a href="#journey">Professional Journey</a></li>
            <li><a href="#mission">Global Varkari Mission</a></li>
            <li><a href="#vari">Pandharpur to London Vari</a></li>
            <li><a href="#achievements">Achievements</a></li>
            <li><a href="#gallery">Gallery</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
 
        <div className="footer-divider" />
 
        {/* Column 3 : Vision for the Future */}
        <div className="footer-col vision-col">
          <h3 className="footer-heading">Vision for the Future</h3>
          <div className="quote-block">
            <Quote className="quote-icon quote-icon-top" />
            <p className="quote-text">
              My vision is to create a world where the sacred Varkari tradition
              transcends geographical boundaries and continues to inspire
              communities through devotion, unity, education, and cultural
              preservation.
            </p>
            <Quote className="quote-icon quote-icon-bottom" />
          </div>
          <p className="quote-author">– Dr. Anil Eknath Khedkar</p>
        </div>
 
        <div className="footer-divider" />
 
        {/* Column 4 : Newsletter */}
        <div className="footer-col newsletter-col">
          <h3 className="footer-heading">Newsletter</h3>
          <p className="newsletter-text">
            Stay updated with our journey and initiatives.
          </p>
          <form
            className="newsletter-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="newsletter-input"
              required
            />
            <button type="submit" className="subscribe-btn">
              Subscribe
            </button>
          </form>
        </div>
      </div>
 
      <div className="footer-bottom">
        <p>© 2025 Dr. Anil Eknath Khedkar. All Rights Reserved.</p>
        <p>Designed By <a href="https://www.vedhindia.com" target="_blank" rel="noopener noreferrer">Vedh India</a></p>
      </div>
    </footer>
  );
}

export default Footer;