export type QuizMode = 'study' | 'exam';

export type Attempt = {
	id: string;
	/** Epoch ms of when the attempt ended. */
	at: number;
	mode: QuizMode;
	/** A "riprova le sbagliate" run: it never counts towards the record. */
	partial: boolean;
	score: number;
	correct: number;
	total: number;
	bestStreak: number;
	durationMs: number;
	/** Indexes into the original question order, so a shuffled run stays comparable. */
	wrong: number[];
	badges: string[];
};

export type StoredQuiz = {
	/** Fingerprint of the source, also the dedup key. */
	id: string;
	title: string;
	source: string;
	addedAt: number;
	questionCount: number;
	attempts: Attempt[];
};

export type LibraryData = {
	version: 1;
	quizzes: StoredQuiz[];
};

export type BackupFile = {
	app: 'quizzo';
	version: 1;
	exportedAt: number;
	quizzes: StoredQuiz[];
};
