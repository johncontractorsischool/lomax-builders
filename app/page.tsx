"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { projectTypes, timelines, referrals } from "../lib/inquiry";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const sendingRef = useRef(false);
  const confirmationRef = useRef<HTMLDivElement>(null);
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(formData),
          newsletter: formData.get("newsletter") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "We couldn’t send your inquiry. Please try again.",
        );
      }
      setSubmitted(true);
      requestAnimationFrame(() => confirmationRef.current?.focus());
    } catch (error) {
      setError(
        error instanceof Error &&
          !(error instanceof TypeError) &&
          !(error instanceof SyntaxError)
          ? error.message
          : "We couldn’t confirm your submission. Please check your connection or email info@lomaxbuilders.com.",
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <main className="site-shell">
      <div className="background" aria-hidden="true" />
      <div className="background-shade" aria-hidden="true" />
      <header className="site-header">
        <a href="#" className="wordmark" aria-label="Lomax Builders home">
          <Image
            className="brand-logo"
            src="/images/lomax-logo-white.png"
            alt="Lomax Builders"
            width={800}
            height={350}
            loading="eager"
          />
        </a>
        <span className="header-note">
          Thoughtfully built. Beautifully yours.
        </span>
        <a className="header-link" href="#project-form">
          Let’s build together <Arrow diagonal />
        </a>
      </header>

      <div className="main-grid">
        <section className="intro" aria-labelledby="hero-title">
          <div className="intro-copy">
            <p className="eyebrow light">
              <span /> YOUR VISION. OUR CRAFT.
            </p>
            <h1 id="hero-title">
              A home,
              <br />
              <em>entirely yours.</em>
            </h1>
            <p className="intro-description">
              For the life you live.
              <br />
              And the one you’re dreaming of.
            </p>
            <div className="intro-rule" />
            <p className="intro-detail">
              From a fresh beginning to a thoughtful transformation,
              <br className="desktop-break" /> let’s create a place that feels
              unmistakably like you.
            </p>
            <a className="mobile-cta" href="#project-form">
              Tell us about your project <Arrow />
            </a>
          </div>
          <div className="image-caption">
            <span className="caption-line" />
            <span>CONSIDERED DESIGN. LASTING CRAFTSMANSHIP.</span>
          </div>
        </section>

        <section
          className="form-card"
          id="project-form"
          aria-labelledby="form-title"
        >
          <div className="form-heading">
            <div className="form-overline">
              <span className="eyebrow">LET’S MAKE IT REAL</span>
              <span className="small-star" aria-hidden="true">
                ✳
              </span>
            </div>
            <h2 id="form-title">
              Every great home
              <br />
              starts with a conversation.
            </h2>
            <p>Tell us a little about what you have in mind.</p>
          </div>
          {submitted ? (
            <div
              className="confirmation"
              ref={confirmationRef}
              tabIndex={-1}
              role="status"
            >
              <span className="confirmation-icon" aria-hidden="true">
                ✓
              </span>
              <h3>Your vision is taking shape.</h3>
              <p>
                Thank you for sharing your plans. Your inquiry has been sent to
                the Lomax Builders team. We look forward to connecting with you.
              </p>
              <button
                className="submit-button"
                type="button"
                onClick={() => setSubmitted(false)}
              >
                Start another project <Arrow />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} aria-busy={sending}>
              <div className="form-honeypot" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <div className="required-note">
                <span>*</span> Required fields
              </div>
              <div className="two-columns">
                <div className="field">
                  <label htmlFor="first-name">
                    First name <span>*</span>
                  </label>
                  <input
                    id="first-name"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="First name"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="field">
                  <label htmlFor="last-name">
                    Last name <span>*</span>
                  </label>
                  <input
                    id="last-name"
                    name="lastName"
                    autoComplete="family-name"
                    placeholder="Last name"
                    required
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="field email-field">
                <label htmlFor="email">
                  Email address <span>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  maxLength={254}
                />
              </div>
              <label className="checkbox-label">
                <input name="newsletter" type="checkbox" />
                <span>Sign up for news and updates</span>
              </label>
              <div className="field">
                <label htmlFor="phone">
                  Phone number <span className="optional">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 000-0000"
                  maxLength={40}
                />
              </div>
              <fieldset className="project-types">
                <legend>Type of project</legend>
                <div className="project-options">
                  {projectTypes.map((type) => (
                    <label className="project-option" key={type}>
                      <input type="radio" name="projectType" value={type} />
                      <span>
                        <span className="radio-dot" />
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="two-columns project-details">
                <div className="field">
                  <label htmlFor="timeline">Estimated project timeline</label>
                  <div className="select-wrap">
                    <select id="timeline" name="timeline" defaultValue="">
                      <option value="" disabled>
                        Select a timeline
                      </option>
                      {timelines.map((timeline) => (
                        <option key={timeline}>{timeline}</option>
                      ))}
                    </select>
                    <span className="select-chevron" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="budget">What is your budget?</label>
                  <div className="budget-input">
                    <span aria-hidden="true">$</span>
                    <input
                      id="budget"
                      name="budget"
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder="Your estimated budget"
                    />
                  </div>
                </div>
              </div>
              <div className="field">
                <label htmlFor="referral">How did you hear about us?</label>
                <div className="select-wrap">
                  <select id="referral" name="referral" defaultValue="">
                    <option value="" disabled>
                      Select an option
                    </option>
                    {referrals.map((referral) => (
                      <option key={referral}>{referral}</option>
                    ))}
                  </select>
                  <span className="select-chevron" />
                </div>
              </div>
              <div className="field message-field">
                <label htmlFor="message">
                  Anything else you’d like us to know?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="Your ideas, your inspiration, your must-haves…"
                  maxLength={5000}
                />
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="submit-button"
                type="submit"
                disabled={sending}
              >
                {sending ? "Submitting…" : "Submit"}
              </button>
              <p className="form-footnote">
                <svg
                  viewBox="0 0 16 16"
                  width="12"
                  height="12"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="3.5"
                    y="7"
                    width="9"
                    height="7"
                    rx="1.3"
                    stroke="currentColor"
                  />
                  <path
                    d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0V7"
                    stroke="currentColor"
                  />
                </svg>{" "}
                Your inquiry goes directly to the Lomax Builders team.
              </p>
            </form>
          )}
        </section>
      </div>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Lomax Builders</span>
        <span className="footer-license">Contractor License #1163296</span>
        <span>Built around you.</span>
      </footer>
    </main>
  );
}
