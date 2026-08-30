import { DEFAULT_PROMPT_OPTIONS, type PromptOptions } from '$lib/quiz/prompt';
import { readJson, writeJson } from '$lib/storage/safe';
import type { QuizMode } from '$lib/storage/types';

const KEY = 'settings';

type SettingsData = {
	mode: QuizMode;
	autoAdvance: boolean;
	shuffle: boolean;
	sound: boolean;
	/** What the NotebookLM prompt on the home page asks for. */
	prompt: PromptOptions;
};

function defaults(): SettingsData {
	return {
		mode: 'study',
		autoAdvance: false,
		shuffle: true,
		sound: true,
		prompt: { ...DEFAULT_PROMPT_OPTIONS }
	};
}

class Settings {
	#data = $state<SettingsData>(defaults());
	#loaded = false;

	load() {
		if (this.#loaded) return;
		const stored = readJson<Partial<SettingsData>>(KEY, {});
		this.#data = {
			...defaults(),
			...stored,
			prompt: { ...DEFAULT_PROMPT_OPTIONS, ...(stored.prompt ?? {}) }
		};
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

	get prompt(): PromptOptions {
		return this.#data.prompt;
	}

	get promptSource() {
		return this.#data.prompt.source;
	}
	set promptSource(value: string) {
		this.#data.prompt.source = value;
		this.#persist();
	}

	get promptChapter() {
		return this.#data.prompt.chapter;
	}
	set promptChapter(value: string) {
		this.#data.prompt.chapter = value;
		this.#persist();
	}

	get promptCount() {
		return this.#data.prompt.count;
	}
	set promptCount(value: string) {
		this.#data.prompt.count = value;
		this.#persist();
	}

	get promptMultiple() {
		return this.#data.prompt.multiple;
	}
	set promptMultiple(value: boolean) {
		this.#data.prompt.multiple = value;
		this.#persist();
	}

	get promptTags() {
		return this.#data.prompt.tags;
	}
	set promptTags(value: boolean) {
		this.#data.prompt.tags = value;
		this.#persist();
	}

	get promptReasoning() {
		return this.#data.prompt.reasoning;
	}
	set promptReasoning(value: boolean) {
		this.#data.prompt.reasoning = value;
		this.#persist();
	}

	get promptMatching() {
		return this.#data.prompt.matching;
	}
	set promptMatching(value: boolean) {
		this.#data.prompt.matching = value;
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
