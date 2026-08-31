export type QuestionOption = {
	text: string;
	correct: boolean;
};

/** One row of a matching exercise: a short name on the left, its definition on the right. */
export type MatchPair = {
	name: string;
	definition: string;
};

export type Question = {
	text: string;
	tag?: string;
	explanation?: string;
	/** `choice` is the classic multiple choice, `match` links names to definitions. */
	kind: 'choice' | 'match';
	/** Empty on a `match` question. */
	options: QuestionOption[];
	/** Empty on a `choice` question. */
	pairs: MatchPair[];
	/** True when more than one option is correct, as declared by the `Corrette:` citation. */
	multiple: boolean;
};

export type Quiz = {
	title: string;
	description?: string;
	questions: Question[];
};

export type ParseIssue = {
	/** 1-based line in the pasted source, 0 when the issue is about the document as a whole. */
	line: number;
	message: string;
};

export type ParseResult = { ok: true; quiz: Quiz } | { ok: false; errors: ParseIssue[] };
