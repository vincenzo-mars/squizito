import type { Question, Quiz } from './types';

export type CoherenceIssue = {
	/** 1-based position of the question in the quiz. */
	number: number;
	text: string;
	/** What the source marked with [x]. */
	marked: string;
	/** What the explanation says the answer is. */
	cited: string;
};

function normalise(text: string): string {
	return text
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/[.,;:!?"'«»“”]/g, '')
		.trim();
}

function mismatched(question: Question): CoherenceIssue['cited'] | null {
	if (question.kind !== 'choice' || !question.citedAnswer) return null;

	const correct = question.options.filter((option) => option.correct);
	if (correct.length !== 1) return null;

	const marked = normalise(correct[0].text);
	const cited = normalise(question.citedAnswer);
	// The citation may be trimmed by the model: a prefix match is close enough.
	if (marked === cited || marked.startsWith(cited) || cited.startsWith(marked)) return null;

	return question.citedAnswer;
}

/**
 * Questions whose explanation quotes an option other than the one marked [x]. Only quizzes whose
 * source declares the answer with `> Corretta: "..."` can be checked: without that redundancy
 * there is nothing to compare, and no issue is reported.
 */
export function coherenceIssues(quiz: Quiz): CoherenceIssue[] {
	const issues: CoherenceIssue[] = [];

	quiz.questions.forEach((question, index) => {
		const cited = mismatched(question);
		if (!cited) return;

		issues.push({
			number: index + 1,
			text: question.text,
			marked: question.options.find((option) => option.correct)?.text ?? '',
			cited
		});
	});

	return issues;
}
