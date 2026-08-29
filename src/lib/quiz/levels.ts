export type Level = {
	/** 1-based level number. */
	number: number;
	name: string;
	emoji: string;
	/** Minimum XP to reach this level. */
	minXp: number;
};

const LEVELS: Level[] = [
	{ number: 1, name: 'Zucchina', emoji: '🥒', minXp: 0 },
	{ number: 2, name: 'Funghetto', emoji: '🍄', minXp: 500 },
	{ number: 3, name: 'Donuttino', emoji: '🍩', minXp: 1500 },
	{ number: 4, name: 'Pokè', emoji: '🍱', minXp: 3500 },
	{ number: 5, name: 'Pastina coi cieci', emoji: '🫘', minXp: 7000 },
	{ number: 6, name: 'Sushi pazzesco', emoji: '🍣', minXp: 13000 },
	{ number: 7, name: 'Panino P.P.P.', emoji: '🥪', minXp: 22000 },
	{ number: 8, name: 'Toast', emoji: '🍞', minXp: 35000 },
	{ number: 9, name: 'Gelato alla Cannella', emoji: '🍦', minXp: 52000 },
	{ number: 10, name: 'Kinder Cereali', emoji: '🥣', minXp: 75000 }
];

/** Current level for the given XP total. */
export function levelFor(xp: number): Level {
	// Walk backwards to find the highest level the user has reached.
	for (let i = LEVELS.length - 1; i >= 0; i--) {
		if (xp >= LEVELS[i].minXp) return LEVELS[i];
	}
	return LEVELS[0];
}

/** Next level, or null if already at the maximum. */
export function nextLevel(xp: number): Level | null {
	const current = levelFor(xp);
	if (current.number === LEVELS.length) return null;
	return LEVELS[current.number] ?? null; // number is 1-based, so index is number
}

/**
 * Progress percentage (0–100) from the current level towards the next.
 * Returns 100 when at the maximum level.
 */
export function progressPercent(xp: number): number {
	const current = levelFor(xp);
	const next = nextLevel(xp);
	if (!next) return 100;
	const range = next.minXp - current.minXp;
	const earned = xp - current.minXp;
	return Math.min(100, Math.round((earned / range) * 100));
}
