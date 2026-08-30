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
	/** Text the explanation quotes as the correct option, when the source declares it. */
	citedAnswer?: string;
	/** `choice` is the classic multiple choice, `match` links names to definitions. */
	kind: 'choice' | 'match';
	/** Empty on a `match` question. */
	options: QuestionOption[];
	/** Empty on a `choice` question. */
	pairs: MatchPair[];
	/** True when a `choice` question has more than one correct option. */
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
