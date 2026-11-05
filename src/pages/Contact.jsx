import React, { useState } from "react";

/* ---- Inline icons ---- */
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.99.36 1.97.68 2.9a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.18-1.18a2 2 0 0 1 2.11-.45c.93.32 1.91.55 2.9.68A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const contactInfo = [
  {
    icon: <PhoneIcon />,
    label: "Phone",
    lines: ["+91 98765 43210"],
  },
  {
    icon: <MailIcon />,
    label: "Email",
    lines: ["info@40under40journey.com"],
  },
  {
    icon: <MapPinIcon />,
    label: "Address",
    lines: ["123 Business Avenue, Pune,", "Maharashtra, India – 411001"],
  },
  {
    icon: <ClockIcon />,
    label: "Working Hours",
    lines: ["Monday – Saturday", "10:00 AM – 6:00 PM"],
  },
];

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // hook up your submission logic here
    console.log(form);
  };

  return (
    <section className="contact-section">
      {/* Left: Get in Touch */}
      <div className="contact-info-col">
        <p className="contact-eyebrow">Get in Touch</p>
        <h2 className="contact-title">We're Here to Help</h2>
        <p className="contact-desc">
          Have a question, suggestion, or want to be a part of this
          incredible journey? Reach out to us.
        </p>

        <div className="info-cards">
          {contactInfo.map((item, i) => (
            <div className="info-card" key={i}>
              <span className="info-icon">{item.icon}</span>
              <div className="info-text">
                <p className="info-label">{item.label}</p>
                {item.lines.map((line, j) => (
                  <p className="info-line" key={j}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="contact-divider" />

      {/* Right: Form */}
      <div className="contact-form-col">
        <p className="contact-eyebrow">Send Us a Message</p>
        <h2 className="contact-title">Drop Us a Line</h2>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <input
            type="tel"
            name="phone"
            placeholder="Your Phone"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={form.subject}
            onChange={handleChange}
          />

          <textarea
            name="message"
            placeholder="Your Message"
            rows={5}
            value={form.message}
            onChange={handleChange}
            required
          />

          <button type="submit" className="send-btn">
            Send Message <ArrowIcon />
          </button>
        </form>
      </div>
    </section>
  );
}