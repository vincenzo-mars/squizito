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

/** Spaced-repetition state of a single question, scoped to the quiz it belongs to. */
export type ReviewState = {
	/** Hash of the normalised question text: survives a re-paste of the same quiz. */
	key: string;
	text: string;
	tag?: string;
	/** Consecutive correct answers. */
	reps: number;
	ease: number;
	/** Days until the next review. */
	interval: number;
	due: number;
	lapses: number;
	seen: number;
	correct: number;
	lastAt: number;
};

export type StoredQuiz = {
	/** Fingerprint of the source, also the dedup key. */
	id: string;
	title: string;
	source: string;
	addedAt: number;
	questionCount: number;
	attempts: Attempt[];
	/** Per-question review state, keyed by question hash. */
	review?: Record<string, ReviewState>;
};

export type LibraryData = {
	version: 1;
	quizzes: StoredQuiz[];
};

export type BackupFile = {
	app: 'squizito';
	version: 1;
	exportedAt: number;
	quizzes: StoredQuiz[];
};
