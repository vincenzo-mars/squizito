import { awardBadges, badgeById, type Badge } from '$lib/quiz/badges';
import { parseQuiz } from '$lib/quiz/parser';
import { pointsFor } from '$lib/quiz/scoring';
import { shuffled } from '$lib/quiz/shuffle';
import type { Question, Quiz } from '$lib/quiz/types';
import { clearSession, readSession, writeSession } from '$lib/storage/safe';
import type { Attempt, QuizMode, StoredQuiz } from '$lib/storage/types';
import { library } from './library.svelte';

const KEY = 'run';

export type RunQuestion = {
	/** Index into the original, unshuffled question list. */
	index: number;
	/** Display order of the option indexes. */
	optionOrder: number[];
	selected: number[];
	answered: boolean;
	correct: boolean;
	points: number;
};

type RunData = {
	quizId: string;
	partial: boolean;
	mode: QuizMode;
	autoAdvance: boolean;
	startedAt: number;
	finishedAt: number | null;
	attemptId: string | null;
	current: number;
	score: number;
	streak: number;
	bestStreak: number;
	hadWrong: boolean;
	comeback: boolean;
	questions: RunQuestion[];
};

export type RunOptions = {
	mode: QuizMode;
	autoAdvance: boolean;
	shuffle: boolean;
};

function sameSet(a: number[], b: number[]): boolean {
	if (a.length !== b.length) return false;
	const sorted = [...a].sort();
	return [...b].sort().every((value, i) => value === sorted[i]);
}

class Run {
	#data = $state<RunData | null>(null);
	#quiz = $state<Quiz | null>(null);

	get active(): boolean {
		return this.#data !== null && this.#quiz !== null;
	}

	get quiz(): Quiz | null {
		return this.#quiz;
	}

	get data(): RunData | null {
		return this.#data;
	}

	get quizId(): string | null {
		return this.#data?.quizId ?? null;
	}

	get total(): number {
		return this.#data?.questions.length ?? 0;
	}

	get position(): number {
		return (this.#data?.current ?? 0) + 1;
	}

	get score(): number {
		return this.#data?.score ?? 0;
	}

	get streak(): number {
		return this.#data?.streak ?? 0;
	}

	get bestStreak(): number {
		return this.#data?.bestStreak ?? 0;
	}

	get mode(): QuizMode {
		return this.#data?.mode ?? 'study';
	}

	get autoAdvance(): boolean {
		return this.#data?.autoAdvance ?? false;
	}

	get partial(): boolean {
		return this.#data?.partial ?? false;
	}

	get finished(): boolean {
		return this.#data?.finishedAt !== null && this.#data?.finishedAt !== undefined;
	}

	get correctCount(): number {
		return this.#data?.questions.filter((entry) => entry.correct).length ?? 0;
	}

	get current(): RunQuestion | null {
		if (!this.#data) return null;
		return this.#data.questions[this.#data.current] ?? null;
	}

	get currentQuestion(): Question | null {
		const entry = this.current;
		if (!entry || !this.#quiz) return null;
		return this.#quiz.questions[entry.index] ?? null;
	}

	get isLast(): boolean {
		if (!this.#data) return false;
		return this.#data.current === this.#data.questions.length - 1;
	}

	/** In study mode the answer is revealed as soon as it is given. */
	get revealed(): boolean {
		return this.mode === 'study' && (this.current?.answered ?? false);
	}

	questionAt(entry: RunQuestion): Question | null {
		return this.#quiz?.questions[entry.index] ?? null;
	}

	get entries(): RunQuestion[] {
		return this.#data?.questions ?? [];
	}

	start(stored: StoredQuiz, quiz: Quiz, options: RunOptions, subset?: number[]) {
		const indexes = subset?.length ? [...subset] : quiz.questions.map((_, index) => index);
		const order = options.shuffle ? shuffled(indexes) : indexes;

		this.#quiz = quiz;
		this.#data = {
			quizId: stored.id,
			partial: Boolean(subset?.length),
			mode: options.mode,
			autoAdvance: options.autoAdvance,
			startedAt: Date.now(),
			finishedAt: null,
			attemptId: null,
			current: 0,
			score: 0,
			streak: 0,
			bestStreak: 0,
			hadWrong: false,
			comeback: false,
			questions: order.map((index) => {
				const positions = quiz.questions[index].options.map((_, i) => i);
				return {
					index,
					optionOrder: options.shuffle ? shuffled(positions) : positions,
					selected: [],
					answered: false,
					correct: false,
					points: 0
				};
			})
		};
		this.#persist();
	}

	/** Rebuilds the run after a page reload by re-parsing the source kept in the library. */
	restore(): boolean {
		if (this.active) return true;

		const data = readSession<RunData | null>(KEY, null);
		if (!data) return false;

		library.load();
		const stored = library.find(data.quizId);
		if (!stored) return false;

		const parsed = parseQuiz(stored.source);
		if (!parsed.ok) return false;

		this.#quiz = parsed.quiz;
		this.#data = data;
		return true;
	}

	toggle(option: number) {
		const entry = this.current;
		const question = this.currentQuestion;
		if (!entry || !question || !this.#data) return;
		if (this.mode === 'study' && entry.answered) return;

		if (!question.multiple) {
			entry.selected = [option];
			if (this.mode === 'study') this.answer();
			else this.#persist();
			return;
		}

		entry.selected = entry.selected.includes(option)
			? entry.selected.filter((value) => value !== option)
			: [...entry.selected, option];
		this.#persist();
	}

	/** Scores the current question. Returns true when the answer was right. */
	answer(): boolean {
		const entry = this.current;
		const question = this.currentQuestion;
		if (!entry || !question || !this.#data || entry.answered) return false;

		const correctOptions = question.options
			.map((option, index) => (option.correct ? index : -1))
			.filter((index) => index >= 0);

		entry.correct = sameSet(entry.selected, correctOptions);
		entry.answered = true;

		if (entry.correct) {
			entry.points = pointsFor(this.#data.streak);
			this.#data.score += entry.points;
			this.#data.streak += 1;
			this.#data.bestStreak = Math.max(this.#data.bestStreak, this.#data.streak);
			if (this.#data.hadWrong && this.#data.streak >= 3) this.#data.comeback = true;
		} else {
			entry.points = 0;
			this.#data.streak = 0;
			this.#data.hadWrong = true;
		}

		library.recordAnswer(this.#data.quizId, question, entry.correct);

		this.#persist();
		return entry.correct;
	}

	next() {
		if (!this.#data) return;
		if (this.isLast) return;
		this.#data.current += 1;
		this.#persist();
	}

	/** Closes the run, writes the attempt to the library and returns the badges earned. */
	finish(): Badge[] {
		if (!this.#data) return [];
		if (this.#data.finishedAt) return this.#badgesOfAttempt();

		const data = this.#data;
		const previousBest = library.best(data.quizId)?.score ?? -1;
		const firstAttempt = (library.find(data.quizId)?.attempts.length ?? 0) === 0;
		const correct = data.questions.filter((entry) => entry.correct).length;

		const badges = awardBadges({
			correct,
			total: data.questions.length,
			bestStreak: data.bestStreak,
			comeback: data.comeback,
			firstAttempt,
			newRecord: !data.partial && data.score > previousBest && previousBest >= 0
		});

		const attempt: Attempt = {
			id: `${data.startedAt}-${Math.random().toString(36).slice(2, 8)}`,
			at: Date.now(),
			mode: data.mode,
			partial: data.partial,
			score: data.score,
			correct,
			total: data.questions.length,
			bestStreak: data.bestStreak,
			durationMs: Date.now() - data.startedAt,
			wrong: data.questions.filter((entry) => !entry.correct).map((entry) => entry.index),
			badges: badges.map((badge) => badge.id)
		};

		data.finishedAt = attempt.at;
		data.attemptId = attempt.id;
		library.addAttempt(data.quizId, attempt);
		this.#persist();

		return badges;
	}

	get attempt(): Attempt | undefined {
		if (!this.#data?.attemptId) return undefined;
		return library.find(this.#data.quizId)?.attempts.find((a) => a.id === this.#data?.attemptId);
	}

	/** Question indexes answered wrong, in the original order, for the "retry the wrong ones" run. */
	get wrongIndexes(): number[] {
		return (this.#data?.questions ?? [])
			.filter((entry) => !entry.correct)
			.map((entry) => entry.index)
			.sort((a, b) => a - b);
	}

	reset() {
		this.#data = null;
		this.#quiz = null;
		clearSession(KEY);
	}

	#badgesOfAttempt(): Badge[] {
		return (this.attempt?.badges ?? [])
			.map((id) => badgeById(id))
			.filter((badge): badge is Badge => badge !== undefined);
	}

	#persist() {
		writeSession(KEY, this.#data);
	}
}

export const run = new Run();
