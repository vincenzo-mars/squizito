import { readJson, writeJson } from '$lib/storage/safe';
import type { QuizMode } from '$lib/storage/types';

const KEY = 'settings';

type SettingsData = {
	mode: QuizMode;
	autoAdvance: boolean;
	shuffle: boolean;
	sound: boolean;
};

function defaults(): SettingsData {
	return { mode: 'study', autoAdvance: false, shuffle: true, sound: true };
}

class Settings {
	#data = $state<SettingsData>(defaults());
	#loaded = false;

	load() {
		if (this.#loaded) return;
		this.#data = { ...defaults(), ...readJson<Partial<SettingsData>>(KEY, {}) };
		this.#loaded = true;
	}

	get mode() {
		return this.#data.mode;
	}
	set mode(value: QuizMode) {
		this.#data.mode = value;
		this.#persist();
	}

	get autoAdvance() {
		return this.#data.autoAdvance;
	}
	set autoAdvance(value: boolean) {
		this.#data.autoAdvance = value;
		this.#persist();
	}

	get shuffle() {
		return this.#data.shuffle;
	}
	set shuffle(value: boolean) {
		this.#data.shuffle = value;
		this.#persist();
	}

	get sound() {
		return this.#data.sound;
	}
	set sound(value: boolean) {
		this.#data.sound = value;
		this.#persist();
	}

	get snapshot(): SettingsData {
		return { ...this.#data };
	}

	#persist() {
		writeJson(KEY, this.#data);
	}
}

export const settings = new Settings();
