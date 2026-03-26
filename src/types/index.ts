export interface OuraData {
  sleep: {
    score: number;
    duration_hours: number;
    efficiency: number;
    deep_sleep_minutes: number;
    rem_sleep_minutes: number;
  };
  readiness: {
    score: number;
    temperature_deviation: number;
    hrv_balance: number;
    recovery_index: number;
  };
  activity: {
    score: number;
    steps: number;
    active_calories: number;
    sedentary_minutes: number;
    isYesterday: boolean;
  };
  heartRate: {
    latest_bpm: number;
    resting_bpm: number;
  };
}

export interface StateInterpretation {
  summary: string;
  bodyState: string;
  soundscapeMode: "recovery" | "relax" | "focus" | "deep_focus";
  soundReasoning: string;
  audioParams: {
    baseFrequency: number;
    filterCutoff: number;
    noiseType: "brown" | "pink" | "white";
    modulationSpeed: number;
    droneVolume: number;
    noiseVolume: number;
    harmonicContent: number;
  };
}

export interface InsightsResponse {
  oura: OuraData;
  interpretation: StateInterpretation;
  timestamp: string;
}
