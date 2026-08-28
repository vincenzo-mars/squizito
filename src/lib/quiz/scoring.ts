export const BASE_POINTS = 100;

/** Streak multipliers, indexed by the length of the current run of correct answers. */
const MULTIPLIERS = [1, 1, 1.2, 1.2, 1.5, 2];

export function multiplierFor(streak: number): number {
	if (streak <= 0) return 1;
	return MULTIPLIERS[Math.min(streak, MULTIPLIERS.length - 1)];
}

/** Points awarded for a correct answer given the streak *before* it, rounded to the nearest 5. */
export function pointsFor(streakBefore: number): number {
	const raw = BASE_POINTS * multiplierFor(streakBefore + 1);
	return Math.round(raw / 5) * 5;
}

/** Highest score reachable on a quiz, used for the percentage on the results screen. */
export function maxScore(questionCount: number): number {
	let total = 0;
	for (let i = 0; i < questionCount; i++) total += pointsFor(i);
	return total;
}
