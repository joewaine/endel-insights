import type { OuraData, StateInterpretation } from "../types";

interface Props {
  oura: OuraData;
  interpretation: StateInterpretation;
}

function MetricRing({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="metric-ring">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="2"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 1.5s ease" }}
        />
        <text
          x="36"
          y="36"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontSize="22"
          fontFamily="Instrument Serif, serif"
        >
          {value}
        </text>
        <text
          x="36"
          y="56"
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.75)"
          fontSize="7"
          fontFamily="Inter, sans-serif"
          fontWeight="700"
          letterSpacing="0.15em"
          style={{ textTransform: "uppercase" }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

export function StatePanel({ oura, interpretation }: Props) {
  return (
    <section className="panel state-panel">
      <div className="panel-label">Your State Right Now</div>

      <div className="metrics-row">
        <MetricRing
          value={oura.readiness.score}
          label="Ready"
          color="#FFFFFF"
        />
        <MetricRing
          value={oura.sleep.score}
          label="Sleep"
          color="#FFFFFF"
        />
        <MetricRing
          value={oura.activity.score}
          label="Active"
          color="#FFFFFF"
        />
      </div>

      <div className="metrics-detail">
        <div className="detail-row">
          <span className="detail-label">Sleep</span>
          <span className="detail-value">
            {oura.sleep.duration_hours.toFixed(1)}h &middot;{" "}
            {oura.sleep.deep_sleep_minutes}m deep &middot;{" "}
            {oura.sleep.rem_sleep_minutes}m REM
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">HRV Balance</span>
          <span className="detail-value">
            {oura.readiness.hrv_balance}/100
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Heart Rate</span>
          <span className="detail-value">
            {oura.heartRate.resting_bpm} resting &middot;{" "}
            {oura.heartRate.latest_bpm} current
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">
            Steps{oura.activity.isYesterday ? " (yesterday)" : ""}
          </span>
          <span className="detail-value">
            {oura.activity.steps.toLocaleString()}
          </span>
        </div>
      </div>

      <p className="state-summary">{interpretation.summary}</p>

      <div className="body-state-tag">{interpretation.bodyState}</div>
    </section>
  );
}
