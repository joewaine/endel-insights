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
            Endel creates AI-powered soundscapes that adapt in real time to your
            body and environment. Using inputs like heart rate, time of day, and
            motion, their patented sound engine generates personalized audio for
            focus, sleep, relaxation, and recovery. It's not a playlist — it's a
            living system that responds to you.
          </p>

          <h2 className="modal-title">The gap</h2>
          <p>
            Endel's personalization engine is doing real work under the hood —
            but users can't see it. When a soundscape shifts, there's no way to
            know if it's responding to your biometrics or just cycling through
            variations. The most common user feedback: "I can't tell if it's
            actually personalized." The intelligence is real. The visibility
            isn't.
          </p>

          <h2 className="modal-title">What this demo explores</h2>
          <p>
            Endel Insights makes the personalization layer visible. It pulls your
            real biometric data from an Oura Ring, interprets your physical state
            in plain language, explains exactly why a specific soundscape was
            chosen for you, and then plays it — all on one screen.
          </p>
          <p>
            The idea is that explainability isn't just transparency — it's a
            product feature. When users can see why the sound was chosen for
            them, trust deepens, engagement increases, and a feedback loop
            becomes possible.
          </p>

          <h2 className="modal-title">Who built this</h2>
          <p>
            I'm{" "}
            <a href="https://joewaine.com" target="_blank" rel="noopener">
              Joseph Waine
            </a>{" "}
            — a full-stack engineer and musician, currently in an AI accelerator
            in Brooklyn. I previously built Aletheia, an AI meditation system
            that uses Oura Ring biometrics, a local LLM, and ElevenLabs voice
            synthesis to generate personalized therapeutic sessions. Endel sits
            at the intersection of everything I care about — AI, music, wellness,
            and making technology that helps people feel better.
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
