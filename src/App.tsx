import { useState } from "react";
import { StatePanel } from "./components/StatePanel";
import { SoundPanel } from "./components/SoundPanel";
import type { InsightsResponse } from "./types";
import "./index.css";

function IntroModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-label">About This Demo</span>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <h2 className="modal-title">What is Endel?</h2>
          <p>
            Endel makes AI-powered soundscapes that adapt to your body in real
            time — using heart rate, motion, time of day, etc. Not a playlist.
            A living system that responds to you.
          </p>

          <h2 className="modal-title">The problem</h2>
          <p>
            The personalization is real, but users can't see it. When the sound
            shifts, there's no way to know if it's responding to you or just
            doing its thing. Most common feedback: "I can't tell if it's
            actually personalized."
          </p>

          <h2 className="modal-title">What this does</h2>
          <p>
            This demo makes the personalization visible. It reads your Oura Ring
            data, interprets your physical state, explains why a soundscape was
            chosen, and plays it — all on one screen. Explainability as a
            feature, not just transparency.
          </p>

          <h2 className="modal-title">Who made this</h2>
          <p>
            I'm{" "}
            <a href="https://joewaine.com" target="_blank" rel="noopener">
              Joseph Waine
            </a>{" "}
            — full-stack engineer and musician, in an AI accelerator in Brooklyn.
            Previously built Aletheia, an AI meditation system using Oura
            biometrics and voice synthesis. Endel sits right at the intersection
            of AI, music, and wellness — everything I care about.
          </p>
        </div>

        <button className="modal-cta" onClick={onClose}>
          Try the Demo
        </button>
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customToken, setCustomToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [usingCustomToken, setUsingCustomToken] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  async function fetchInsights(token?: string) {
    setLoading(true);
    setError(null);
    try {
      const url = token
        ? `/api/insights?oura_token=${encodeURIComponent(token)}`
        : "/api/insights";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch insights");
      const json = await res.json();
      setData(json);
      if (token) setUsingCustomToken(true);
    } catch (err) {
      setError("Could not load your insights. Make sure the server is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleCustomToken() {
    if (customToken.trim()) {
      fetchInsights(customToken.trim());
    }
  }

  return (
    <div className="app">
      {showIntro && <IntroModal onClose={() => setShowIntro(false)} />}

      <header className="header">
        <div className="logo">
          <span className="logo-mark" />
          endel insights
        </div>
        <p className="tagline">
          Your body tells a story. Here's what your soundscape should sound like
          — and why.
        </p>
      </header>

      {!data && !loading && (
        <div className="landing">
          <div className="landing-rings">
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div className="ring ring-3" />
          </div>
          <button className="cta-button" onClick={() => fetchInsights()}>
            Read My State
          </button>
          <p className="cta-sub">
            Pulls your Oura Ring data and generates a personalized soundscape
          </p>
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="loading-pulse" />
          <p>Reading your biometric state...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={() => fetchInsights()}>
            Try Again
          </button>
        </div>
      )}

      {data && !loading && (
        <div className="panels">
          <StatePanel oura={data.oura} interpretation={data.interpretation} />
          <SoundPanel interpretation={data.interpretation} />

          <div className="oura-token-section">
            {!usingCustomToken && (
              <p className="token-note">
                This demo is using Joseph Waine's Oura Ring data.
              </p>
            )}
            {!showTokenInput ? (
              <p className="token-prompt">
                Have your own Oura Ring?{" "}
                <a
                  href="https://cloud.ouraring.com/personal-access-tokens"
                  target="_blank"
                  rel="noopener"
                >
                  Get your personal access token
                </a>{" "}
                and{" "}
                <button
                  className="token-link-button"
                  onClick={() => setShowTokenInput(true)}
                >
                  enter it here
                </button>
              </p>
            ) : (
              <div className="token-input-row">
                <input
                  type="text"
                  className="token-input"
                  placeholder="Paste your Oura access token"
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomToken()}
                />
                <button className="token-submit" onClick={handleCustomToken}>
                  Go
                </button>
              </div>
            )}
          </div>

          <footer className="footer">
            <p>
              Built by{" "}
              <a
                href="https://joewaine.com"
                target="_blank"
                rel="noopener"
              >
                Joseph Waine
              </a>
            </p>
            <p className="footer-sub">
              Biometric data from Oura Ring &middot; Sound reasoning by Claude
              &middot; Audio generated with Web Audio API
            </p>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
