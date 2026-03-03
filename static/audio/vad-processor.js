/**
 * Voice Gate Processor — AudioWorklet that replaces AnalyserNode + GainNode + setInterval.
 *
 * Runs entirely on the audio rendering thread (no main-thread jank).
 * Handles:
 *   1. RMS level computation
 *   2. Noise gate (mute audio below a configurable threshold)
 *   3. Noise ceiling (mute audio above a configurable threshold)
 *   4. Smooth gain transitions (3 ms attack, 50 ms release)
 *   5. Posts { volume, gateOpen } back to the main thread at ~62 Hz
 *
 * Main thread → worklet messages (port.postMessage):
 *   { noiseGateThreshold: number }   — 0 = off, typical speech 0.01–0.03
 *   { noiseCeilingThreshold: number } — 0 = off
 *
 * Worklet → main thread messages (port.onmessage):
 *   { volume: number, gateOpen: boolean }
 */
class VoiceGateProcessor extends AudioWorkletProcessor {
    /**
     * Report every N render quanta.
     * At 48 kHz / 128 samples ≈ 375 Hz render rate → 375/6 ≈ 62 Hz reports.
     */
    static REPORT_INTERVAL = 6;

    constructor(options) {
        super(options);

        const opts = options?.processorOptions ?? {};

        // Configurable thresholds (updated at runtime via port messages)
        this._noiseGateThreshold = opts.noiseGateThreshold ?? 0;
        this._noiseCeilingThreshold = opts.noiseCeilingThreshold ?? 0;

        // Internal smoothing state
        this._currentGain = 1; // smoothed gain applied to samples
        this._frameCount = 0;

        // Smoothing time constants (in "per-sample" coefficient form).
        // attack  ≈ 3 ms  → coefficient per sample at 48 kHz
        // release ≈ 50 ms → coefficient per sample at 48 kHz
        const sr = opts.sampleRate ?? 48000;
        this._attackCoeff = 1 - Math.exp(-1 / (0.003 * sr));
        this._releaseCoeff = 1 - Math.exp(-1 / (0.05 * sr));

        // Listen for threshold updates from the main thread
        this.port.onmessage = (event) => {
            const msg = event.data;
            if (msg.noiseGateThreshold !== undefined) {
                this._noiseGateThreshold = msg.noiseGateThreshold;
            }
            if (msg.noiseCeilingThreshold !== undefined) {
                this._noiseCeilingThreshold = msg.noiseCeilingThreshold;
            }
        };
    }

    /**
     * @param {Float32Array[][]} inputs
     * @param {Float32Array[][]} outputs
     * @returns {boolean}
     */
    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || input.length === 0) return true;

        const channelData = input[0];
        if (!channelData || channelData.length === 0) return true;

        // ── Compute RMS on the first channel ──
        let sumSquares = 0;
        for (let i = 0; i < channelData.length; i++) {
            sumSquares += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sumSquares / channelData.length);

        // ── Determine target gain ──
        const minT = this._noiseGateThreshold;
        const maxT = this._noiseCeilingThreshold;
        const aboveMin = minT === 0 || rms >= minT;
        const belowMax = maxT === 0 || rms <= maxT;
        const targetGain = aboveMin && belowMax ? 1 : 0;

        // ── Apply per-sample smoothed gain to all channels ──
        const coeff = targetGain > this._currentGain ? this._attackCoeff : this._releaseCoeff;

        for (let ch = 0; ch < input.length; ch++) {
            const inp = input[ch];
            const out = output[ch];
            if (!inp || !out) continue;

            // Reset per-channel so the smoothing is consistent
            let g = this._currentGain;
            for (let i = 0; i < inp.length; i++) {
                g += coeff * (targetGain - g);
                out[i] = inp[i] * g;
            }
            // Keep the final gain for the next render quantum
            if (ch === 0) this._currentGain = g;
        }

        // ── Throttled report to main thread ──
        this._frameCount++;
        if (this._frameCount >= VoiceGateProcessor.REPORT_INTERVAL) {
            this._frameCount = 0;
            this.port.postMessage({
                volume: rms,
                gateOpen: targetGain === 1,
            });
        }

        return true;
    }
}

registerProcessor("voice-gate-processor", VoiceGateProcessor);
