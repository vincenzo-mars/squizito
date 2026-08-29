import { hashSource } from '$lib/quiz/hash';
import type { Question } from '$lib/quiz/types';
import type { ReviewState } from '$lib/storage/types';

export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;
export const DAY = 24 * 60 * 60 * 1000;

/** Thresholds in days that separate the six mastery levels. */
const MASTERY_STEPS = [1, 3, 7, 21];

/**
 * Identity of a question inside its quiz. Normalising the text means that re-pasting the same
 * quiz, or a regenerated one that repeats a question verbatim, keeps its review history.
 */
export function questionKey(text: string): string {
	return hashSource(
		text
			.toLowerCase()
			.replace(/\s+/g, ' ')
			.replace(/[^\p{L}\p{N} ]/gu, '')
			.trim()
	);
}

export function createState(question: Question, now = Date.now()): ReviewState {
	return {
		key: questionKey(question.text),
		text: question.text,
		tag: question.tag,
		reps: 0,
		ease: 2.5,
		interval: 0,
		due: now,
		lapses: 0,
		seen: 0,
		correct: 0,
		lastAt: 0
	};
}

export function isDue(state: ReviewState, now = Date.now()): boolean {
	return state.due <= now;
}

/**
 * SM-2 without the self-grading: a right answer promotes the question, a wrong one sends it back
 * to today and shortens the following intervals.
 *
 * Counters always move, so repeating the same test twice in one afternoon is recorded both times.
 * The interval only grows when the question was actually due, otherwise answering early would
 * inflate the schedule without any real recall effort behind it.
 */
export function applyAnswer(state: ReviewState, correct: boolean, now = Date.now()): ReviewState {
	const next: ReviewState = {
		...state,
		seen: state.seen + 1,
		correct: state.correct + (correct ? 1 : 0),
		lastAt: now
	};

	if (!correct) {
		next.reps = 0;
		next.lapses = state.lapses + 1;
		next.ease = Math.max(MIN_EASE, state.ease - 0.2);
		next.interval = 0;
		next.due = now;
		return next;
	}

	next.reps = state.reps + 1;
	next.ease = Math.min(MAX_EASE, state.ease + 0.1);

	if (!isDue(state, now)) return next;

	if (next.reps === 1) next.interval = 1;
	else if (next.reps === 2) next.interval = 3;
	else next.interval = Math.round(Math.max(1, state.interval) * next.ease);

	next.due = now + next.interval * DAY;
	return next;
}

/** 0 = mai vista o appena sbagliata, 5 = consolidata. */
export function masteryLevel(state: ReviewState | undefined): number {
	if (!state || !state.seen) return 0;
	if (!state.reps) return 0;

	const level = MASTERY_STEPS.filter((step) => state.interval >= step).length + 1;
	return Math.min(5, level);
}

/** Average mastery of a set of questions, as a 0-100 percentage. */
export function masteryPercent(states: (ReviewState | undefined)[]): number {
	if (!states.length) return 0;
	const total = states.reduce((sum, state) => sum + masteryLevel(state), 0);
	return Math.round((total / (states.length * 5)) * 100);
}

/**
 * Higher comes first in a review session: questions you got wrong, then the ones you have never
 * seen, then the shaky ones, with overdue and repeatedly failed questions pulled forward.
 */
export function priority(state: ReviewState | undefined, now = Date.now()): number {
	if (!state || !state.seen) return 950;

	const overdue = Math.max(0, (now - state.due) / DAY);
	return 1000 - masteryLevel(state) * 100 + Math.min(overdue, 30) * 10 + state.lapses * 5;
}

export function describeDue(due: number, now = Date.now()): string {
	const days = Math.round((due - now) / DAY);
	if (days <= 0) return 'oggi';
	if (days === 1) return 'domani';
	if (days < 30) return `fra ${days} giorni`;
	const months = Math.round(days / 30);
	return months === 1 ? 'fra un mese' : `fra ${months} mesi`;
}
