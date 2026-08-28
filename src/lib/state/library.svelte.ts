import { hashSource } from '$lib/quiz/hash';
import type { Quiz } from '$lib/quiz/types';
import { readJson, writeJson } from '$lib/storage/safe';
import type { Attempt, BackupFile, LibraryData, StoredQuiz } from '$lib/storage/types';

const KEY = 'library';

function emptyData(): LibraryData {
	return { version: 1, quizzes: [] };
}

function isStoredQuiz(value: unknown): value is StoredQuiz {
	if (!value || typeof value !== 'object') return false;
	const quiz = value as Partial<StoredQuiz>;
	return (
		typeof quiz.id === 'string' &&
		typeof quiz.title === 'string' &&
		typeof quiz.source === 'string' &&
		Array.isArray(quiz.attempts)
	);
}

class Library {
	#data = $state<LibraryData>(emptyData());
	#loaded = false;

	/** Reads localStorage once, on the first call from the browser. */
	load() {
		if (this.#loaded) return;
		const stored = readJson<LibraryData>(KEY, emptyData());
		this.#data = {
			version: 1,
			quizzes: Array.isArray(stored.quizzes) ? stored.quizzes.filter(isStoredQuiz) : []
		};
		this.#loaded = true;
	}

	get quizzes(): StoredQuiz[] {
		return [...this.#data.quizzes].sort((a, b) => this.#lastActivity(b) - this.#lastActivity(a));
	}

	get count(): number {
		return this.#data.quizzes.length;
	}

	find(id: string): StoredQuiz | undefined {
		return this.#data.quizzes.find((quiz) => quiz.id === id);
	}

	/** Saves a freshly parsed quiz, or returns the existing entry when the source is identical. */
	save(source: string, quiz: Quiz): StoredQuiz {
		const id = hashSource(source);
		const existing = this.find(id);
		if (existing) return existing;

		const entry: StoredQuiz = {
			id,
			title: quiz.title,
			source,
			addedAt: Date.now(),
			questionCount: quiz.questions.length,
			attempts: []
		};
		this.#data.quizzes.push(entry);
		this.#persist();
		return entry;
	}

	rename(id: string, title: string) {
		const quiz = this.find(id);
		if (!quiz) return;
		quiz.title = title.trim() || quiz.title;
		this.#persist();
	}

	remove(id: string) {
		this.#data.quizzes = this.#data.quizzes.filter((quiz) => quiz.id !== id);
		this.#persist();
	}

	addAttempt(id: string, attempt: Attempt) {
		const quiz = this.find(id);
		if (!quiz) return;
		quiz.attempts.push(attempt);
		this.#persist();
	}

	/** Best full attempt on a quiz: partial "retry the wrong ones" runs never count. */
	best(id: string): Attempt | undefined {
		const attempts = this.find(id)?.attempts.filter((attempt) => !attempt.partial) ?? [];
		return attempts.reduce<Attempt | undefined>(
			(best, attempt) => (!best || attempt.score > best.score ? attempt : best),
			undefined
		);
	}

	last(id: string): Attempt | undefined {
		return this.find(id)?.attempts.at(-1);
	}

	toBackup(): BackupFile {
		return { app: 'quizzo', version: 1, exportedAt: Date.now(), quizzes: this.#data.quizzes };
	}

	/** Merges a backup into the library: known quizzes keep their attempts, new ones are added. */
	merge(backup: unknown): { quizzes: number; attempts: number } {
		const file = backup as Partial<BackupFile>;
		if (!file || file.app !== 'quizzo' || !Array.isArray(file.quizzes)) {
			throw new Error('Il file non è un backup di Quizzo.');
		}

		let quizzes = 0;
		let attempts = 0;

		for (const incoming of file.quizzes.filter(isStoredQuiz)) {
			const existing = this.find(incoming.id);
			if (!existing) {
				this.#data.quizzes.push(incoming);
				quizzes++;
				attempts += incoming.attempts.length;
				continue;
			}
			const known = new Set(existing.attempts.map((attempt) => attempt.id));
			for (const attempt of incoming.attempts) {
				if (known.has(attempt.id)) continue;
				existing.attempts.push(attempt);
				attempts++;
			}
			existing.attempts.sort((a, b) => a.at - b.at);
		}

		this.#persist();
		return { quizzes, attempts };
	}

	#lastActivity(quiz: StoredQuiz): number {
		return quiz.attempts.at(-1)?.at ?? quiz.addedAt;
	}

	#persist() {
		writeJson(KEY, this.#data);
	}
}

export const library = new Library();
