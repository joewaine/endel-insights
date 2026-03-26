import { useState, useRef, useEffect } from "react";
import type { StateInterpretation } from "../types";
import { SoundscapeEngine } from "../audio/engine";

interface Props {
  interpretation: StateInterpretation;
}

const MODE_COLORS: Record<string, string> = {
  recovery: "rgba(255, 255, 255, 0.5)",
  relax: "rgba(255, 255, 255, 0.4)",
  focus: "rgba(255, 255, 255, 0.7)",
  deep_focus: "rgba(255, 255, 255, 0.9)",
};

const MODE_LABELS: Record<string, string> = {
  recovery: "Recovery",
  relax: "Relax",
  focus: "Focus",
  deep_focus: "Deep Focus",
};

export function SoundPanel({ interpretation }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const engineRef = useRef<SoundscapeEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    engineRef.current = new SoundscapeEngine();
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  // Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const color = MODE_COLORS[interpretation.soundscapeMode] || "#6B8AFF";

    let time = 0;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      if (!isPlaying) {
        // Static gentle wave when not playing
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
        ctx.lineWidth = 1.5;
        for (let x = 0; x < width; x++) {
          const y =
            height / 2 + Math.sin(x * 0.015) * 8;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      time += interpretation.audioParams.modulationSpeed * 0.3;

      // Multiple layered waves
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        const alpha = 0.25 - layer * 0.07;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 2 - layer * 0.5;

        for (let x = 0; x < width; x++) {
          const freq = 0.008 + layer * 0.003;
          const amp = 15 + layer * 8;
          const phase = time + layer * 1.2;
          const y =
            height / 2 +
            Math.sin(x * freq + phase) * amp +
            Math.sin(x * freq * 2.3 + phase * 0.7) * (amp * 0.4);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Center glow
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        80
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, 0.06)`);
      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, interpretation]);

  async function togglePlay() {
    if (!engineRef.current) return;

    setIsTransitioning(true);

    if (isPlaying) {
      await engineRef.current.stop();
      setIsPlaying(false);
    } else {
      await engineRef.current.start(interpretation.audioParams);
      setIsPlaying(true);
    }

    setIsTransitioning(false);
  }

  const modeColor = MODE_COLORS[interpretation.soundscapeMode] || "#6B8AFF";

  return (
    <section className="panel sound-panel">
      <div className="panel-label">What to Play & Why</div>

      <div className="mode-badge" style={{ borderColor: modeColor }}>
        <span className="mode-dot" style={{ backgroundColor: modeColor }} />
        {MODE_LABELS[interpretation.soundscapeMode]}
      </div>

      <p className="sound-reasoning">{interpretation.soundReasoning}</p>

      <div className="audio-params">
        <span>
          {interpretation.audioParams.noiseType} noise
        </span>
        <span className="param-sep">&middot;</span>
        <span>{interpretation.audioParams.baseFrequency}Hz base</span>
        <span className="param-sep">&middot;</span>
        <span>
          {interpretation.audioParams.filterCutoff}Hz cutoff
        </span>
      </div>

      <div className="visualizer-container">
        <canvas ref={canvasRef} className="visualizer" />

        <button
          className={`play-button ${isPlaying ? "playing" : ""}`}
          onClick={togglePlay}
          disabled={isTransitioning}
          style={
            {
              "--mode-color": modeColor,
            } as React.CSSProperties
          }
        >
          {isTransitioning ? (
            <span className="button-icon">···</span>
          ) : isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}
