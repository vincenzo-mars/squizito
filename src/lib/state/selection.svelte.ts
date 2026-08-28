import { clearSession, readSession, writeSession } from '$lib/storage/safe';

const KEY = 'selected';

/** The quiz the user opened from the library, kept across pages without a dynamic route. */
class Selection {
	#id = $state<string | null>(null);
	#loaded = false;

	load() {
		if (this.#loaded) return;
		this.#id = readSession<string | null>(KEY, null);
		this.#loaded = true;
	}

	get id(): string | null {
		return this.#id;
	}

	select(id: string) {
		this.#id = id;
		writeSession(KEY, id);
	}

	clear() {
		this.#id = null;
		clearSession(KEY);
	}
}

export const selection = new Selection();
