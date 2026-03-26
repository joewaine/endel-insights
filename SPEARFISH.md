# Endel Insights — Spearfish Demo

## The Problem

Endel's core promise is personalization — soundscapes that adapt to your body's state. But users can't see the connection between their data and what they hear. The app collects biometric signals, processes them through the Endel Pacific engine, and outputs sound. Everything in between is invisible.

This creates a trust gap. When a soundscape shifts, users don't know if it's responding to their heart rate, the time of day, or nothing at all. App store reviews reflect this: "I can't tell if it's actually personalized or just playing nice sounds." Without visibility into the reasoning, personalization feels like a marketing claim rather than something users can feel and verify.

This matters because Endel's value proposition depends on the listener believing that the sound is *for them* — not generic ambient audio. The more opaque the system, the harder it is for users to develop trust in it, recommend it to others, or justify the subscription. Transparency isn't just a feature request. It's the difference between "this is a nice sound app" and "this app actually knows my body."

## What This Demo Does

Endel Insights is a companion interface that makes the personalization visible. It pulls real biometric data from an Oura Ring — sleep duration, deep sleep, REM, HRV balance, readiness score, activity level, heart rate — and translates it into three things:

**1. A human-readable state interpretation.** Not raw numbers, but language: "You're running on 6 hours of sleep with an HRV balance of 42 — your nervous system is still catching up." The user sees their data reflected back in a way that feels like someone who understands physiology read their chart and told them what it means.

**2. A soundscape recommendation with visible reasoning.** Instead of just playing a sound, the system explains *why*: "Your HRV balance tells me your autonomic nervous system is still in recovery mode. Brown noise with slow harmonic drift supports parasympathetic activation — low frequencies your body can settle into without effort." The user sees the logic connecting their body's state to the sonic qualities of what they're about to hear.

**3. A generated soundscape that plays immediately.** Brown noise, pink noise, or white noise shaped by a tonal drone, harmonic layer, and LFO modulation — all parameters derived from the biometric interpretation. The user doesn't just read about what they should hear. They hear it.

**4. Try it with your own data.** The demo ships with my Oura Ring data by default, but anyone with an Oura Ring can paste their own personal access token directly into the interface and see the entire experience regenerate from their biometrics. The demo links to Oura's token page so it takes about 30 seconds to go from "interesting concept" to "this is reading *my* body." That moment — when someone sees their own sleep debt and HRV interpreted into a soundscape recommendation that makes sense to them — is when the product idea clicks.

## The Insight

The deeper idea is that **explainability is a product feature, not a transparency obligation.** When users can see why a soundscape was chosen for them, three things happen:

- **Trust increases.** The personalization stops feeling like a black box and starts feeling like a knowledgeable system that understands their body. Users who understand why they're hearing brown noise at 55Hz after a bad night of sleep are more likely to believe it's working — and more likely to keep listening.

- **Engagement deepens.** Users start paying attention to their own patterns. "Every time my HRV is below 50, it recommends recovery mode — and I actually do feel better after those sessions." The app becomes a mirror for self-knowledge, not just a sound player.

- **The feedback loop becomes possible.** Once users can see the reasoning, they can evaluate it. "It recommended focus mode but I'm exhausted" becomes actionable data. Over time, this creates a preference model that makes the personalization genuinely personal — not just biometric-reactive, but learned.

Endel Pacific is already doing the hard work of generating adaptive sound. The missing layer is letting users see and feel that intelligence at work. This demo is a sketch of what that layer could look like.

## Technical Details

- **Frontend:** React + TypeScript, black-and-white minimal design in Space Mono
- **Biometric data:** Oura Ring API v2 — sleep periods, daily readiness, daily activity, heart rate. Supports both a default token and user-supplied tokens via the UI
- **Interpretation engine:** Claude API generating natural-language state analysis, soundscape mode selection, and specific audio parameters (base frequency, filter cutoff, noise type, modulation speed, harmonic content). Falls back to a rule-based interpreter when the AI layer is unavailable
- **Audio generation:** Web Audio API — procedural brown/pink/white noise, oscillator-based tonal drone, harmonic overtones, LFO modulation of filter cutoff. No audio files. Everything generated in real-time from parameters derived from the biometric interpretation
- **Architecture:** React frontend with Vite, Express backend proxying Oura and Claude APIs, deployable to Vercel

## About Me

I'm Joseph Waine — a full-stack engineer with a design background, currently in an AI accelerator in Brooklyn. I built an AI meditation system called Aletheia that pulls biometric data from an Oura Ring, runs a local LLM for privacy, generates therapeutic sessions using Ericksonian hypnotic language patterns, and synthesizes audio through ElevenLabs. It's a 6-layer context pipeline that gates shadow work behind trust buildup — the same kind of adaptive, biometric-driven personalization that Endel is built on, applied to a different domain.

I'm also a musician. I care about how sound feels, not just how it's generated. I built this demo because Endel sits at the intersection of everything I'm drawn to — AI, music, wellness, biometrics, and making technology that helps people feel better.

https://joewaine.com
