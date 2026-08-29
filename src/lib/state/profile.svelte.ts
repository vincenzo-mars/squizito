import { levelFor, nextLevel, progressPercent, type Level } from '$lib/quiz/levels';
import { readJson, writeJson } from '$lib/storage/safe';
import type { ProfileData } from '$lib/storage/types';

const KEY = 'profile';

function emptyData(): ProfileData {
	return { version: 1, nickname: '', xp: 0, activeDays: [] };
}

function todayKey(now = Date.now()): string {
	const d = new Date(now);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** Returns the streak length implied by the sorted activeDays array. */
function computeStreak(days: string[]): number {
	if (!days.length) return 0;

	// Work backwards from today or the latest recorded day.
	const today = todayKey();
	const sorted = [...days].sort();
	const last = sorted.at(-1)!;

	// If the last active day is neither today nor yesterday, streak is broken.
	const msPerDay = 86_400_000;
	const lastDate = new Date(last).getTime() + msPerDay; // midnight of the day after last
	const todayDate = new Date(today).getTime();
	if (todayDate - lastDate > msPerDay) return 0;

	let streak = 0;
	let cursor = last;
	const set = new Set(sorted);
	while (set.has(cursor)) {
		streak++;
		const prev = new Date(new Date(cursor).getTime() - msPerDay);
		cursor = todayKey(prev.getTime());
	}
	return streak;
}

class Profile {
	#data = $state<ProfileData>(emptyData());
	#loaded = false;

	load() {
		if (this.#loaded) return;
		const stored = readJson<Partial<ProfileData>>(KEY, {});
		this.#data = {
			...emptyData(),
			...(typeof stored.nickname === 'string' ? { nickname: stored.nickname } : {}),
			...(typeof stored.xp === 'number' ? { xp: stored.xp } : {}),
			...(Array.isArray(stored.activeDays) ? { activeDays: stored.activeDays } : {})
		};
		this.#loaded = true;
	}

	get nickname(): string {
		return this.#data.nickname;
	}

	get xp(): number {
		return this.#data.xp;
	}

	get level(): Level {
		return levelFor(this.#data.xp);
	}

	get nextLevel(): Level | null {
		return nextLevel(this.#data.xp);
	}

	get progressPercent(): number {
		return progressPercent(this.#data.xp);
	}

	get streak(): number {
		return computeStreak(this.#data.activeDays);
	}

	get activeDays(): string[] {
		return this.#data.activeDays;
	}

	get snapshot(): ProfileData {
		return { ...this.#data };
	}

	setNickname(name: string) {
		const trimmed = name.trim().slice(0, 20);
		if (!trimmed) return;
		this.#data.nickname = trimmed;
		this.#persist();
	}

	/** Adds XP and returns true when the user leveled up. */
	addXp(amount: number): boolean {
		if (amount <= 0) return false;
		const before = levelFor(this.#data.xp).number;
		this.#data.xp += amount;
		const after = levelFor(this.#data.xp).number;
		this.#persist();
		return after > before;
	}

	/** Records today as an active day. Call once per completed (non-partial) session. */
	recordDay(now = Date.now()) {
		const key = todayKey(now);
		if (this.#data.activeDays.includes(key)) return;
		this.#data.activeDays = [...this.#data.activeDays, key].sort();
		this.#persist();
	}

	/** Merges a backup profile: keeps the higher XP and unions the activeDays. */
	merge(incoming: ProfileData) {
		if (incoming.xp > this.#data.xp) this.#data.xp = incoming.xp;
		if (incoming.nickname && !this.#data.nickname) {
			this.#data.nickname = incoming.nickname;
		}
		const merged = new Set([...this.#data.activeDays, ...(incoming.activeDays ?? [])]);
		this.#data.activeDays = [...merged].sort();
		this.#persist();
	}

	#persist() {
		writeJson(KEY, this.#data);
	}
}

export const profile = new Profile();
