export type QuestionOption = {
	text: string;
	correct: boolean;
};

export type Question = {
	text: string;
	tag?: string;
	explanation?: string;
	options: QuestionOption[];
	/** True when the question has more than one correct option. */
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
