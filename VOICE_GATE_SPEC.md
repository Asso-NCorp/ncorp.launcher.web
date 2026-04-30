# Voice Control / Noise Gate System — Full Specification

> Use this document to reimplement the voice control and noise gate system from scratch.  
> The codebase is a **SvelteKit** app (Svelte 5 runes) using **LiveKit** for WebRTC voice rooms.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Files Involved](#files-involved)
3. [AudioWorklet Processor (`vad-processor.js`)](#audioworklet-processor)
4. [LiveKitSession Class — Voice/Gate Methods](#livekitsession-class)
5. [UI Components](#ui-components)
6. [Data Flow Diagram](#data-flow-diagram)
7. [Reactive State (Svelte 5 Runes)](#reactive-state)
8. [Persistence (localStorage)](#persistence)
9. [Audio Graph](#audio-graph)
10. [Current Issues / Reasons for Rewrite](#current-issues)
11. [Requirements for the New Implementation](#requirements)

---

## 1. Architecture Overview <a name="architecture-overview"></a>

The system implements a **client-side noise gate** for microphone audio before publishing it to a LiveKit room. It consists of:

- An **AudioWorklet** (`VoiceGateProcessor`) running on the audio rendering thread at 48 kHz
- A **session class** (`LiveKitSession`) that owns the Web Audio graph, microphone stream, and LiveKit room
- Two **Svelte UI components** that expose the controls (sliders, meters, test buttons)

The microphone audio flows through this chain:
```
getUserMedia → MediaStreamSource → AudioWorkletNode (gate) → MediaStreamDestination → LiveKit publish
```

The gate has two thresholds:
- **Noise gate (min threshold)**: audio below this RMS level is muted (silenced)
- **Noise ceiling (max threshold)**: audio above this RMS level is muted (prevents loud noises)

---

## 2. Files Involved <a name="files-involved"></a>

| File | Role |
|------|------|
| `static/audio/vad-processor.js` | AudioWorklet processor — runs on the audio thread |
| `src/lib/chat/livekit-session.svelte.ts` | Session class with all mic/gate/audio logic |
| `src/lib/chat/chat.svelte.ts` | Exports singleton: `export const voiceSession = new LiveKitSession()` |
| `src/lib/components/chat/VoiceFloatingWidget.svelte` | Primary UI — floating bar with mic/deafen/volume/settings |
| `src/lib/components/chat/VoiceStatusBar.svelte` | Secondary UI — sidebar status bar (simpler, also has gate controls) |
| `src/lib/states/voice.svelte.ts` | Legacy/minimal state class (mostly unused, kept for `roomUsers` tracking) |

---

## 3. AudioWorklet Processor (`vad-processor.js`) <a name="audioworklet-processor"></a>

**Location**: `static/audio/vad-processor.js` (served from `/audio/vad-processor.js`)

### Processor name: `"voice-gate-processor"`

### Constructor options (`processorOptions`):
```js
{
  noiseGateThreshold: number,   // 0 = off, 0–1 range (practical speech: 0.01–0.03 RMS)
  noiseCeilingThreshold: number, // 0 = off, 0–1 range
  sampleRate: number             // typically 48000
}
```

### Runtime messages (main thread → worklet via `port.postMessage`):
```js
{ noiseGateThreshold: number }
{ noiseCeilingThreshold: number }
// Can send both in one message
```

### Reports (worklet → main thread via `port.postMessage`):
```js
{ volume: number, gateOpen: boolean }
// Sent every 6 render quanta ≈ 62 Hz at 48kHz sample rate
```

### Processing logic:
1. **RMS computation** on first channel of input buffer (128 samples)
2. **Gate decision**:
   - `aboveMin = (minThreshold === 0) || (rms >= minThreshold)`
   - `belowMax = (maxThreshold === 0) || (rms <= maxThreshold)`
   - `targetGain = (aboveMin && belowMax) ? 1 : 0`
3. **Smooth gain transitions** (per-sample exponential):
   - Attack coefficient: `1 - exp(-1 / (0.003 * sampleRate))` ≈ 3ms
   - Release coefficient: `1 - exp(-1 / (0.05 * sampleRate))` ≈ 50ms
   - Formula: `gain += coeff * (targetGain - gain)` per sample
4. **Apply gain**: `output[i] = input[i] * gain` for all channels
5. **Throttled report**: every 6 frames, post `{ volume: rms, gateOpen }` to main thread

### Full source (120 lines):
```js
class VoiceGateProcessor extends AudioWorkletProcessor {
    static REPORT_INTERVAL = 6;

    constructor(options) {
        super(options);
        const opts = options?.processorOptions ?? {};
        this._noiseGateThreshold = opts.noiseGateThreshold ?? 0;
        this._noiseCeilingThreshold = opts.noiseCeilingThreshold ?? 0;
        this._currentGain = 1;
        this._frameCount = 0;

        const sr = opts.sampleRate ?? 48000;
        this._attackCoeff = 1 - Math.exp(-1 / (0.003 * sr));
        this._releaseCoeff = 1 - Math.exp(-1 / (0.05 * sr));

        this.port.onmessage = (event) => {
            const msg = event.data;
            if (msg.noiseGateThreshold !== undefined) this._noiseGateThreshold = msg.noiseGateThreshold;
            if (msg.noiseCeilingThreshold !== undefined) this._noiseCeilingThreshold = msg.noiseCeilingThreshold;
        };
    }

    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || input.length === 0) return true;
        const channelData = input[0];
        if (!channelData || channelData.length === 0) return true;

        let sumSquares = 0;
        for (let i = 0; i < channelData.length; i++) {
            sumSquares += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sumSquares / channelData.length);

        const minT = this._noiseGateThreshold;
        const maxT = this._noiseCeilingThreshold;
        const aboveMin = minT === 0 || rms >= minT;
        const belowMax = maxT === 0 || rms <= maxT;
        const targetGain = aboveMin && belowMax ? 1 : 0;

        const coeff = targetGain > this._currentGain ? this._attackCoeff : this._releaseCoeff;

        for (let ch = 0; ch < input.length; ch++) {
            const inp = input[ch];
            const out = output[ch];
            if (!inp || !out) continue;
            let g = this._currentGain;
            for (let i = 0; i < inp.length; i++) {
                g += coeff * (targetGain - g);
                out[i] = inp[i] * g;
            }
            if (ch === 0) this._currentGain = g;
        }

        this._frameCount++;
        if (this._frameCount >= VoiceGateProcessor.REPORT_INTERVAL) {
            this._frameCount = 0;
            this.port.postMessage({ volume: rms, gateOpen: targetGain === 1 });
        }
        return true;
    }
}
registerProcessor("voice-gate-processor", VoiceGateProcessor);
```

---

## 4. LiveKitSession Class — Voice/Gate Methods <a name="livekitsession-class"></a>

The `LiveKitSession` class is a Svelte 5 runes class (`$state()` fields) exported as a singleton from `src/lib/chat/chat.svelte.ts`.

### Relevant reactive state properties:

```ts
noiseGateThreshold: number = $state(0);      // 0–1, persisted to localStorage
noiseCeilingThreshold: number = $state(0);    // 0–1, persisted to localStorage
micLevel: number = $state(0);                 // Live RMS 0–0.1, updated ~62Hz
micTestActive: boolean = $state(false);       // Whether mic preview is running
loopbackEnabled: boolean = $state(false);     // Hear-yourself during testing
isDeafened: boolean = $state(false);          // Mute everything + mic
outputVolume: number = $state(1);             // 0–2 (200%), persisted
isMuted: boolean = $state(false);
audioDevices: AudioDevice[] = $state([]);
selectedAudioDeviceId: string = $state("");
```

### Private audio chain fields:

```ts
private audioCtx: AudioContext | null = null;
private rawMicStream: MediaStream | null = null;
private processedTrack: MediaStreamTrack | null = null;
private gateWorkletNode: AudioWorkletNode | null = null;
private publishedMicPub: any | null = null;      // LiveKit publication handle
private loopbackGain: GainNode | null = null;

// Remote audio output
private outputAudioCtx: AudioContext | null = null;
private gainNodes: Map<string, GainNode> = new Map();  // per-participant gain
```

### Key methods:

#### `startProcessedMic(deviceId?: string): Promise<MediaStreamTrack | null>`
1. Calls `stopProcessedMic()` to clean up previous chain
2. `getUserMedia({ audio: { deviceId: { exact: deviceId } } })` or `{ audio: true }`
3. Creates `AudioContext({ sampleRate: 48_000 })`
4. Loads worklet: `ctx.audioWorklet.addModule("/audio/vad-processor.js")`
5. Creates `MediaStreamSource` from raw mic
6. Creates `AudioWorkletNode("voice-gate-processor", { processorOptions: { noiseGateThreshold, noiseCeilingThreshold, sampleRate } })`
7. Listens to worklet messages → updates `this.micLevel`
8. Creates `MediaStreamDestination`
9. Connects: `source → worklet → destination`
10. Returns the processed `MediaStreamTrack` from the destination stream

#### `stopProcessedMic()`
1. Disconnects loopback gain if connected
2. Closes worklet port, disconnects worklet node
3. Stops processed track
4. Closes AudioContext
5. Stops all raw mic stream tracks
6. Nulls all references

#### `syncWorkletThresholds()`
Posts current `noiseGateThreshold` and `noiseCeilingThreshold` to the worklet via `port.postMessage`.

#### `setNoiseGateThreshold(value: number)`
Clamps 0–1, sets reactive state, persists to `localStorage("noiseGateThreshold")`, calls `syncWorkletThresholds()`.

#### `setNoiseCeilingThreshold(value: number)`
Same pattern, key `"noiseCeilingThreshold"`.

#### `startMicPreview()`
If not connected: calls `startProcessedMic()`, sets `micTestActive = true`, enables loopback.

#### `stopMicPreview()`
If not connected: disables loopback, calls `stopProcessedMic()`, sets `micTestActive = false`.

#### `toggleMicPreview()`
Toggles between start/stop mic preview.

#### `setLoopback(enabled: boolean)`
Creates a `GainNode(0.5)` → `audioCtx.destination` and connects the worklet output to it for self-monitoring. Only works during mic test (not connected).

#### `toggleLoopback()`
Toggles `setLoopback(!this.loopbackEnabled)`.

#### `setOutputVolume(value: number)`
Clamps 0–2, persists `localStorage("outputVolume")`, updates all remote participant `GainNode` values (or element volume as fallback).

#### `toggleDeafen()`
Mutes mic at source level + sets all remote gain nodes to 0. Restores previous mute state on un-deafen.

### How it integrates with LiveKit `connect()`:
1. After connecting to room, calls `startProcessedMic(selectedDeviceId)`
2. Wraps the returned track in `new lk.LocalAudioTrack(processedTrack)`
3. Publishes via `room.localParticipant.publishTrack(lkTrack, { source: Track.Source.Microphone })`
4. Toggles `rawMicStream` track `.enabled` for mute (not the processed track)

### Remote audio output routing:
For each remote participant's audio track:
1. Creates `<audio>` element, attaches LiveKit track
2. Routes through `MediaElementSource → GainNode → AudioContext.destination`
3. `GainNode.gain.value` = `outputVolume` (allows 0–200% volume)
4. On deafen: sets all gain nodes to 0

---

## 5. UI Components <a name="ui-components"></a>

### VoiceFloatingWidget.svelte (primary, used in sidebar)
- **Location**: `src/lib/components/chat/VoiceFloatingWidget.svelte`
- **Always visible** at bottom of sidebar
- **Three dropdown panels** (absolute positioned above the bar):
  1. **Mic dropdown** (`showMicMenu`): device list + noise gate controls (same as settings)
  2. **Volume dropdown** (`showVolumeMenu`): output volume slider 0–200%
  3. **Settings panel** (`showSettings`, only when NOT connected): device list + full noise gate UI
- **Widget bar buttons**: Mute, Mic dropdown arrow, Deafen, Volume dropdown arrow, Screen share (connected only), Disconnect (connected only), Settings gear (not connected only)
- **Outside click** closes all dropdowns and stops mic preview

### Noise Gate UI section (appears in both mic dropdown and settings panel):
```
┌─────────────────────────────────┐
│ NOISE GATE          [🔊] [Test] │  ← Loopback + Test buttons
│ ████████████░░░░░░|░░░░░░░░░░░ │  ← Live RMS meter with threshold markers
│ Seuil min      Désactivé / X%  │
│ ───────────●────────────────── │  ← Min threshold slider (0–100 mapped to 0–0.1)
│ Seuil max      Désactivé / X%  │
│ ───────────●────────────────── │  ← Max threshold slider (0–100 mapped to 0–0.1)
│ Le micro n'envoie pas l'audio   │
│ en dehors de ces seuils         │
└─────────────────────────────────┘
```

### RMS Meter visual:
- Background: `bg-muted` (rounded pill, 6px tall)
- Fill bar: `bg-emerald-500` when gate is open, `bg-red-500` when closed
- Width: `Math.min(micLevel / 0.1, 1) * 100`%
- Min threshold marker: vertical line at `Math.min(threshold / 0.1, 1) * 100`%, `bg-primary/80`
- Max threshold marker: vertical line, `bg-orange-500/80`

### Slider mapping:
- Slider HTML range: `min="0" max="100" step="1"`
- Display value: `Math.round(threshold * 1000)` + `%` (or "Désactivé" if 0)
- On input: `value / 1000` → `setNoiseGateThreshold()`
- So slider 0–100 maps to threshold 0–0.1

### VoiceStatusBar.svelte (secondary, legacy)
- **Location**: `src/lib/components/chat/VoiceStatusBar.svelte`
- Simpler version: one expandable panel with device list + noise gate
- Only has the **min threshold** slider (no ceiling slider)
- No test/loopback buttons
- Shows connection info, participant count, mute/screen-share/disconnect buttons

---

## 6. Data Flow Diagram <a name="data-flow-diagram"></a>

```
┌──────────────┐     getUserMedia      ┌──────────────────┐
│  Microphone  │ ───────────────────▶  │  rawMicStream    │
└──────────────┘                       └────────┬─────────┘
                                                │
                                    AudioContext (48kHz)
                                                │
                                    ┌───────────▼──────────┐
                                    │ MediaStreamSource     │
                                    └───────────┬──────────┘
                                                │
                                    ┌───────────▼──────────┐
                                    │ AudioWorkletNode      │
                                    │ "voice-gate-processor"│
                                    │                       │
                                    │ • RMS computation     │
                                    │ • Gate decision       │──▶ port.postMessage({volume, gateOpen})
                                    │ • Smooth gain         │         │
                                    └──┬────────┬──────────┘         │
                                       │        │                     │
                          ┌────────────▼─┐  ┌───▼──────────┐   ┌────▼──────────┐
                          │ Destination  │  │ Loopback     │   │ Main Thread   │
                          │ (publish)    │  │ GainNode(0.5)│   │ micLevel      │
                          └──────┬───────┘  │ → speakers   │   │ updates       │
                                 │          └──────────────┘   └───────────────┘
                                 │
                    ┌────────────▼───────────┐
                    │ LiveKit LocalAudioTrack │
                    │ → Room publish          │
                    └─────────────────────────┘

User slider input ──▶ setNoiseGateThreshold() ──▶ syncWorkletThresholds()
                                                        │
                                                  port.postMessage({
                                                    noiseGateThreshold,
                                                    noiseCeilingThreshold
                                                  })
```

---

## 7. Reactive State (Svelte 5 Runes) <a name="reactive-state"></a>

All state uses `$state()` runes. Derived values in components use `$derived()`:

```ts
// In VoiceFloatingWidget.svelte
const micLevelPct = $derived(Math.min(voiceSession.micLevel / 0.1, 1) * 100);
const thresholdPct = $derived(Math.min(voiceSession.noiseGateThreshold / 0.1, 1) * 100);
const ceilingPct = $derived(Math.min(voiceSession.noiseCeilingThreshold / 0.1, 1) * 100);
const gateOpen = $derived(() => {
    const aboveMin = voiceSession.noiseGateThreshold === 0 || voiceSession.micLevel >= voiceSession.noiseGateThreshold;
    const belowMax = voiceSession.noiseCeilingThreshold === 0 || voiceSession.micLevel <= voiceSession.noiseCeilingThreshold;
    return aboveMin && belowMax;
});
```

---

## 8. Persistence (localStorage) <a name="persistence"></a>

| Key | Range | Default | Description |
|-----|-------|---------|-------------|
| `noiseGateThreshold` | 0–1 | 0 (off) | Min RMS threshold |
| `noiseCeilingThreshold` | 0–1 | 0 (off) | Max RMS threshold |
| `outputVolume` | 0–2 | 1 (100%) | Remote audio output gain |

Loaded in constructor, saved on every setter call.

---

## 9. Audio Graph <a name="audio-graph"></a>

### Mic → LiveKit (outbound):
```
getUserMedia(deviceId) → AudioContext(48kHz)
  → createMediaStreamSource(stream)
  → AudioWorkletNode("voice-gate-processor")
  → createMediaStreamDestination()
  → destination.stream.getAudioTracks()[0]
  → new LiveKit.LocalAudioTrack(processedTrack)
  → room.localParticipant.publishTrack()
```

### Mic → Loopback (testing only):
```
Same worklet node → GainNode(0.5) → audioCtx.destination (speakers)
```

### Remote audio (inbound):
```
LiveKit remote track → <audio> element (hidden)
  → AudioContext.createMediaElementSource(audioEl)
  → GainNode(outputVolume)
  → audioCtx.destination (speakers)
```

---

## 10. Current Issues / Reasons for Rewrite <a name="current-issues"></a>

> Fill in your specific complaints here. Common issues with the current approach:

- The noise gate UI is **duplicated** in 3 places (mic dropdown, settings panel in VoiceFloatingWidget, and VoiceStatusBar) — DRY violation
- VoiceStatusBar only has the min threshold (no ceiling) — inconsistent experience
- Slider math is confusing: sliders go 0–100, multiplied by 1000 for display, divided by 1000 for the setter (so practical range is 0–0.1 RMS)
- The `gateOpen` in VoiceFloatingWidget uses `$derived(() => ...)` (returns a function) instead of `$derived(expression)` — this is a bug, `gateOpen` is always truthy because it's a function reference, you need `gateOpen()` to call it
- No visual feedback when connected (the noise gate meter only shows during mic test or when settings are open)
- Loopback is auto-enabled on mic test start but the button doesn't indicate that clearly
- No hysteresis on the gate — the worklet uses simple threshold comparison, which can cause flutter near the threshold

---

## 11. Requirements for the New Implementation <a name="requirements"></a>

### Must keep:
- [ ] AudioWorklet-based processing (no main-thread `setInterval` for audio)
- [ ] 48 kHz sample rate AudioContext
- [ ] Smooth gain transitions (attack/release coefficients)
- [ ] RMS level reporting from worklet to main thread (~60 Hz)
- [ ] Two thresholds: noise gate (min) and noise ceiling (max)
- [ ] Persist thresholds and output volume to localStorage
- [ ] Works with LiveKit: output a `MediaStreamTrack` that can be wrapped in `LocalAudioTrack`
- [ ] Mute at source level (`rawMicStream.getAudioTracks().enabled = false`)
- [ ] Loopback/self-monitoring during mic test
- [ ] Mic test mode when not connected to a room
- [ ] Device enumeration and selection
- [ ] Output volume control (0–200%) via Web Audio GainNode per remote participant
- [ ] Deafen (mute mic + silence all remote audio)
- [ ] SSR-safe (all browser APIs gated behind `typeof window !== "undefined"`)
- [ ] Svelte 5 runes (`$state`, `$derived`)
- [ ] Singleton pattern via `chat.svelte.ts`

### Should improve:
- [ ] Extract noise gate UI into a reusable Svelte component (used in both widgets)
- [ ] Fix `$derived` bug (use `$derived(expression)` not `$derived(() => fn)`)
- [ ] Add hysteresis to prevent gate flutter near threshold (e.g., open at threshold, close at threshold - 20%)
- [ ] Add hold time before gate closes (e.g., 200ms after speech drops below threshold)
- [ ] Make the slider range and display more intuitive (e.g., show dB or percentage directly)
- [ ] Consider adding a "sensitivity" mode as an alternative to manual thresholds (auto-calibration)
- [ ] Show the live meter when connected too, not just in test mode
- [ ] Consolidate VoiceStatusBar and VoiceFloatingWidget (or ensure feature parity)

### Tech stack context:
- **Framework**: SvelteKit (Svelte 5 with runes)
- **Voice backend**: LiveKit (via `livekit-client` npm package, lazy-loaded)
- **Styling**: Tailwind CSS v4, utility function `cn()` from `$lib/utils`
- **Icons**: `@lucide/svelte`
- **UI components**: shadcn-svelte (`$lib/components/ui/*`)
- **Language**: TypeScript (except worklet which is plain JS in `static/audio/`)
- **Build**: Vite + SvelteKit Node adapter
