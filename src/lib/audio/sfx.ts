import { browser } from '$app/environment';

type Voice = {
	/** Frequency in Hz. */
	freq: number;
	/** Offset from the start of the sound, in seconds. */
	at: number;
	duration: number;
	gain?: number;
	type?: OscillatorType;
};

/**
 * Every sound is synthesised on the fly: no audio files in the repo, nothing to download.
 * The context is created on the first playback, which always follows a click, so browsers
 * never block it as autoplay.
 */
class Sfx {
	#context: AudioContext | null = null;
	#enabled = true;

	set enabled(value: boolean) {
		this.#enabled = value;
	}

	#ctx(): AudioContext | null {
		if (!browser || !this.#enabled) return null;
		if (!this.#context) {
			const Ctor =
				window.AudioContext ??
				(window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!Ctor) return null;
			this.#context = new Ctor();
		}
		if (this.#context.state === 'suspended') void this.#context.resume();
		return this.#context;
	}

	#play(voices: Voice[]) {
		const ctx = this.#ctx();
		if (!ctx) return;

		const now = ctx.currentTime;
		for (const voice of voices) {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			const peak = voice.gain ?? 0.18;
			const start = now + voice.at;

			osc.type = voice.type ?? 'triangle';
			osc.frequency.setValueAtTime(voice.freq, start);

			// Percussive envelope: near-instant attack, exponential tail, like a soft marimba.
			gain.gain.setValueAtTime(0.0001, start);
			gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
			gain.gain.exponentialRampToValueAtTime(0.0001, start + voice.duration);

			osc.connect(gain).connect(ctx.destination);
			osc.start(start);
			osc.stop(start + voice.duration + 0.05);
		}
	}

	select() {
		this.#play([{ freq: 523.25, at: 0, duration: 0.09, gain: 0.08 }]);
	}

	correct() {
		this.#play([
			{ freq: 659.25, at: 0, duration: 0.18 },
			{ freq: 987.77, at: 0.075, duration: 0.28 }
		]);
	}

	wrong() {
		this.#play([
			{ freq: 196, at: 0, duration: 0.22, type: 'sine', gain: 0.16 },
			{ freq: 155.56, at: 0.09, duration: 0.34, type: 'sine', gain: 0.14 }
		]);
	}

	/** Rising arpeggio that climbs with the streak, so a long run literally sounds higher. */
	streak(length: number) {
		const step = Math.min(length, 8) - 2;
		const root = 523.25 * Math.pow(2, step / 12);
		this.#play([
			{ freq: root, at: 0, duration: 0.14, gain: 0.12 },
			{ freq: root * 1.26, at: 0.06, duration: 0.16, gain: 0.12 },
			{ freq: root * 1.5, at: 0.12, duration: 0.26, gain: 0.14 }
		]);
	}

	badge() {
		this.#play([
			{ freq: 880, at: 0, duration: 0.16, gain: 0.12 },
			{ freq: 1318.51, at: 0.08, duration: 0.3, gain: 0.1 }
		]);
	}

	finish(success: boolean) {
		const notes = success ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 493.88, 440, 392];
		this.#play(
			notes.map((freq, index) => ({
				freq,
				at: index * 0.11,
				duration: index === notes.length - 1 ? 0.7 : 0.22,
				gain: 0.15
			}))
		);
	}
}

export const sfx = new Sfx();
