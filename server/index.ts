import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import type { OuraData, StateInterpretation } from "../src/types/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ override: true });

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey
  ? new Anthropic({ apiKey })
  : null;

async function fetchOuraData(customToken?: string): Promise<OuraData> {
  const token = customToken || process.env.OURA_ACCESS_TOKEN;

  if (!token) {
    console.log("No Oura token — using sample data");
    return getSampleData();
  }

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [sleepRes, readinessRes, activityRes, heartRateRes, sleepPeriodsRes] =
      await Promise.all([
        fetch(
          `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${yesterday}&end_date=${today}`,
          { headers }
        ),
        fetch(
          `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${yesterday}&end_date=${today}`,
          { headers }
        ),
        fetch(
          `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${yesterday}&end_date=${today}`,
          { headers }
        ),
        fetch(
          `https://api.ouraring.com/v2/usercollection/heartrate?start_datetime=${yesterday}T00:00:00&end_datetime=${today}T23:59:59`,
          { headers }
        ),
        fetch(
          `https://api.ouraring.com/v2/usercollection/sleep?start_date=${yesterday}&end_date=${today}`,
          { headers }
        ),
      ]);

    const [sleepData, readinessData, activityData, heartRateData, sleepPeriodsData] =
      await Promise.all([
        sleepRes.json(),
        readinessRes.json(),
        activityRes.json(),
        heartRateRes.json(),
        sleepPeriodsRes.json(),
      ]);

    const sleep = sleepData.data?.[sleepData.data.length - 1];
    const readiness = readinessData.data?.[readinessData.data.length - 1];

    // Prefer today's activity; fall back to yesterday's
    const allActivity = activityData.data || [];
    const todayActivity = allActivity.find((a: Record<string, unknown>) => a.day === today);
    const activity = todayActivity || allActivity[allActivity.length - 1];
    const hrData = heartRateData.data || [];
    const latestHr = hrData[hrData.length - 1];

    // Sleep periods have the actual duration data in seconds
    const sleepPeriods = sleepPeriodsData.data || [];
    const longestSleep = sleepPeriods
      .filter((p: Record<string, unknown>) => p.type === "long_sleep")
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((b.total_sleep_duration as number) ?? 0) - ((a.total_sleep_duration as number) ?? 0)
      )[0];

    return {
      sleep: {
        score: sleep?.score ?? 72,
        duration_hours: longestSleep?.total_sleep_duration
          ? longestSleep.total_sleep_duration / 3600
          : 6.5,
        efficiency: longestSleep?.efficiency
          ? Math.round(longestSleep.efficiency > 1 ? longestSleep.efficiency : longestSleep.efficiency * 100)
          : sleep?.contributors?.efficiency ?? 85,
        deep_sleep_minutes: longestSleep?.deep_sleep_duration
          ? Math.round(longestSleep.deep_sleep_duration / 60)
          : 45,
        rem_sleep_minutes: longestSleep?.rem_sleep_duration
          ? Math.round(longestSleep.rem_sleep_duration / 60)
          : 80,
      },
      readiness: {
        score: readiness?.score ?? 68,
        temperature_deviation:
          readiness?.contributors?.body_temperature ?? 0.2,
        hrv_balance: readiness?.contributors?.hrv_balance ?? 65,
        recovery_index: readiness?.contributors?.recovery_index ?? 70,
      },
      activity: {
        score: activity?.score ?? 55,
        steps: activity?.steps ?? 3200,
        active_calories: activity?.active_calories ?? 180,
        sedentary_minutes: activity?.sedentary_time
          ? Math.round(activity.sedentary_time / 60)
          : 480,
        isYesterday: !todayActivity,
      },
      heartRate: {
        latest_bpm: latestHr?.bpm ?? 72,
        resting_bpm: sleep?.lowest_heart_rate ?? 58,
      },
    };
  } catch (err) {
    console.error("Oura API error, falling back to sample data:", err);
    return getSampleData();
  }
}

function getSampleData(): OuraData {
  return {
    sleep: {
      score: 68,
      duration_hours: 6.3,
      efficiency: 82,
      deep_sleep_minutes: 38,
      rem_sleep_minutes: 72,
    },
    readiness: {
      score: 62,
      temperature_deviation: 0.4,
      hrv_balance: 42,
      recovery_index: 58,
    },
    activity: {
      score: 45,
      steps: 2800,
      active_calories: 120,
      sedentary_minutes: 520,
      isYesterday: true,
    },
    heartRate: {
      latest_bpm: 74,
      resting_bpm: 61,
    },
  };
}

async function interpretState(
  oura: OuraData
): Promise<StateInterpretation> {
  if (!anthropic) {
    throw new Error("No Anthropic API key configured");
  }

  const hour = new Date().getHours();
  const timeContext =
    hour < 6
      ? "very early morning, pre-dawn"
      : hour < 9
        ? "morning"
        : hour < 12
          ? "late morning"
          : hour < 14
            ? "early afternoon"
            : hour < 17
              ? "afternoon"
              : hour < 20
                ? "evening"
                : "night";

  const prompt = `You are the intelligence layer of a personalized soundscape engine — like Endel, but with visible reasoning. Given this person's biometric data from their Oura Ring and the current time of day, generate a soundscape recommendation.

BIOMETRIC DATA:
- Sleep score: ${oura.sleep.score}/100
- Sleep duration: ${oura.sleep.duration_hours.toFixed(1)} hours
- Sleep efficiency: ${oura.sleep.efficiency}%
- Deep sleep: ${oura.sleep.deep_sleep_minutes} minutes
- REM sleep: ${oura.sleep.rem_sleep_minutes} minutes
- Readiness score: ${oura.readiness.score}/100
- HRV balance: ${oura.readiness.hrv_balance}/100
- Recovery index: ${oura.readiness.recovery_index}/100
- Temperature deviation: ${oura.readiness.temperature_deviation > 0 ? "+" : ""}${oura.readiness.temperature_deviation.toFixed(1)}°
- Activity score: ${oura.activity.score}/100
- Steps today: ${oura.activity.steps}
- Resting heart rate: ${oura.heartRate.resting_bpm} bpm
- Current heart rate: ${oura.heartRate.latest_bpm} bpm

TIME: ${timeContext} (${hour}:00)

Respond with ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 sentence human-readable interpretation of their current physical state. Speak directly to the person using 'you'. Be warm but precise — reference specific numbers naturally, not clinically. Example tone: 'You're running on about 6 hours of sleep and your HRV is sitting below your baseline — your nervous system is still catching up.'",
  "bodyState": "One phrase capturing the state, like 'under-recovered and sedentary' or 'well-rested, ready for deep work' or 'winding down, parasympathetic shift'",
  "soundscapeMode": "one of: recovery, relax, focus, deep_focus",
  "soundReasoning": "2-3 sentences explaining WHY this soundscape mode was chosen based on the data. Connect the biometric signals to the sonic qualities. Example: 'Your HRV balance at 42 tells me your autonomic nervous system is still in recovery mode. Brown noise with slow harmonic drift supports parasympathetic activation — low frequencies your body can settle into without effort.'",
  "audioParams": {
    "baseFrequency": "number 40-200. Lower for recovery/sleep (40-80), mid for relax (80-120), higher for focus (120-200)",
    "filterCutoff": "number 200-2000. Lower = warmer/darker sound. Recovery: 200-500, Relax: 500-1000, Focus: 1000-2000",
    "noiseType": "brown for recovery/relax, pink for focus, white for deep_focus",
    "modulationSpeed": "number 0.01-0.5. Slower for recovery (0.01-0.05), medium for relax (0.05-0.15), faster for focus (0.15-0.5)",
    "droneVolume": "number 0-1. How prominent the tonal drone is",
    "noiseVolume": "number 0-1. How prominent the noise layer is",
    "harmonicContent": "number 0-1. Amount of overtones. Low for recovery, high for focus"
  }
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response");
  }

  return JSON.parse(jsonMatch[0]) as StateInterpretation;
}

function getFallbackInterpretation(oura: OuraData): StateInterpretation {
  const hour = new Date().getHours();
  const isLowEnergy =
    oura.readiness.score < 70 || oura.sleep.score < 70;
  const isActive = oura.activity.steps > 8000;
  const isEvening = hour >= 18;

  if (isEvening) {
    return {
      summary: `You're winding down after a day on ${oura.sleep.duration_hours.toFixed(1)} hours of sleep. Your readiness is at ${oura.readiness.score} and your body temperature is slightly elevated — your nervous system could use help downshifting.`,
      bodyState: "winding down, needs parasympathetic support",
      soundscapeMode: "relax",
      soundReasoning: `With your readiness at ${oura.readiness.score} and the day behind you, your body is ready to transition into rest. Warm brown noise with a low-frequency drone mirrors the kind of slow, enveloping sound that helps your nervous system release the day's tension. The slow modulation gives your attention something to follow without engaging it.`,
      audioParams: {
        baseFrequency: 65,
        filterCutoff: 600,
        noiseType: "brown",
        modulationSpeed: 0.04,
        droneVolume: 0.6,
        noiseVolume: 0.7,
        harmonicContent: 0.2,
      },
    };
  }

  if (isLowEnergy) {
    const activityNote = isActive
      ? `${oura.activity.steps.toLocaleString()} steps today — you've been moving, but your body hasn't fully caught up from last night.`
      : `Only ${oura.activity.steps.toLocaleString()} steps so far today.`;
    return {
      summary: `You're running on ${oura.sleep.duration_hours.toFixed(1)} hours of sleep with an HRV balance of ${oura.readiness.hrv_balance}. Your readiness score is ${oura.readiness.score} — your nervous system is still catching up. ${activityNote}`,
      bodyState: isActive ? "under-recovered but active" : "under-recovered and sedentary",
      soundscapeMode: "recovery",
      soundReasoning: `Your HRV balance at ${oura.readiness.hrv_balance} tells me your autonomic nervous system is still in recovery mode. Brown noise with slow harmonic drift supports parasympathetic activation — low frequencies your body can settle into without effort. The deep drone at 55Hz sits right at the edge of perception, grounding without demanding attention.`,
      audioParams: {
        baseFrequency: 55,
        filterCutoff: 350,
        noiseType: "brown",
        modulationSpeed: 0.02,
        droneVolume: 0.7,
        noiseVolume: 0.8,
        harmonicContent: 0.1,
      },
    };
  }

  return {
    summary: `Solid foundation today — ${oura.sleep.duration_hours.toFixed(1)} hours of sleep with a readiness score of ${oura.readiness.score}. Your HRV balance is sitting at ${oura.readiness.hrv_balance}, which means your nervous system has capacity for focused work. ${oura.activity.steps.toLocaleString()} steps tells me you've been moving.`,
    bodyState: "rested and ready for focus",
    soundscapeMode: "focus",
    soundReasoning: `With a readiness of ${oura.readiness.score} and decent sleep behind you, your body can handle higher-frequency stimulation. Pink noise provides the spectral balance that supports sustained attention, and the higher filter cutoff lets through enough brightness to keep your mind engaged without overwhelming it.`,
    audioParams: {
      baseFrequency: 150,
      filterCutoff: 1400,
      noiseType: "pink",
      modulationSpeed: 0.2,
      droneVolume: 0.4,
      noiseVolume: 0.6,
      harmonicContent: 0.5,
    },
  };
}

app.get("/api/insights", async (req, res) => {
  try {
    const customToken = req.query.oura_token as string | undefined;
    console.log("Fetching Oura data...");
    const oura = await fetchOuraData(customToken);
    console.log("Oura data fetched, interpreting state...");
    let interpretation: StateInterpretation;

    try {
      interpretation = await interpretState(oura);
      console.log("Claude interpretation complete");
    } catch (aiErr) {
      console.warn("Claude API unavailable, using fallback:", (aiErr as Error).message);
      interpretation = getFallbackInterpretation(oura);
      console.log("Fallback interpretation generated");
    }

    res.json({
      oura,
      interpretation,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error generating insights:", err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// Serve built frontend in production
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
