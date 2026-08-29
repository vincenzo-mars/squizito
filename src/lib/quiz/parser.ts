import type { MatchPair, ParseIssue, ParseResult, Question, QuestionOption } from './types';

const FENCE = /^\s*```/;
const TITLE = /^\s*#\s*(.*)$/;
const HEADING = /^\s*#{2,6}\s*(.*)$/;
/** Bullets an LLM actually emits: hyphen, asterisk, plus, bullet, en dash, em dash. */
const OPTION = /^\s*[-*+•–—]\s*[[(]\s*([xX]?)\s*[\])]\s*(.*)$/;
const TAG = /^\s*(?:tag|tags|categoria|category)\s*:\s*(.*)$/i;
const QUOTE = /^\s*>\s?(.*)$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const PAIR = /^\s*[-*+•–—]\s*(.+?)\s*(?:->|→|=>|-->|›)\s*(.*)$/;
const NUMBERING = /^\d+\s*[.)\]]\s*/;

/** Strips the inline markdown NotebookLM tends to sprinkle around, so the UI renders plain text. */
function clean(raw: string): string {
	return raw
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/__(.+?)__/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.trim();
}

type Draft = {
	line: number;
	text: string;
	tag?: string;
	explanation: string[];
	options: QuestionOption[];
	pairs: MatchPair[];
};

/**
 * Parses the Markdown quiz syntax documented in the README. The parser is deliberately forgiving:
 * code fences, numbered headings, `*` bullets and stray prose are tolerated, only the structure
 * that carries meaning (headings, `[x]` options) is enforced.
 */
export function parseQuiz(source: string): ParseResult {
	const errors: ParseIssue[] = [];
	const drafts: Draft[] = [];

	let title = '';
	const description: string[] = [];
	let current: Draft | null = null;

	const lines = source.split(/\r?\n/);

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const number = i + 1;

		if (!line.trim() || FENCE.test(line) || RULE.test(line)) continue;

		const headingMatch = line.match(HEADING);
		if (!headingMatch) {
			const titleMatch = line.match(TITLE);
			if (titleMatch) {
				if (!title) title = clean(titleMatch[1]);
				continue;
			}
		}

		if (headingMatch) {
			current = {
				line: number,
				text: clean(headingMatch[1]).replace(NUMBERING, ''),
				explanation: [],
				options: [],
				pairs: []
			};
			drafts.push(current);
			continue;
		}

		const optionMatch = line.match(OPTION);
		if (optionMatch) {
			if (!current) {
				errors.push({ line: number, message: 'Opzione trovata prima di una domanda `## ...`.' });
				continue;
			}
			const text = clean(optionMatch[2]);
			if (!text) {
				errors.push({ line: number, message: 'Opzione senza testo.' });
				continue;
			}
			current.options.push({ text, correct: optionMatch[1].toLowerCase() === 'x' });
			continue;
		}

		const pairMatch = line.match(PAIR);
		if (pairMatch) {
			if (!current) {
				errors.push({ line: number, message: 'Coppia trovata prima di una domanda `## ...`.' });
				continue;
			}
			const name = clean(pairMatch[1]);
			const definition = clean(pairMatch[2]);
			if (!name || !definition) {
				errors.push({ line: number, message: 'Coppia incompleta: serve `- nome -> definizione`.' });
				continue;
			}
			current.pairs.push({ name, definition });
			continue;
		}

		const tagMatch = line.match(TAG);
		if (tagMatch && current && !current.tag) {
			const tag = clean(tagMatch[1]);
			if (tag) current.tag = tag;
			continue;
		}

		const quoteMatch = line.match(QUOTE);
		if (quoteMatch) {
			const text = clean(quoteMatch[1]);
			if (!text) continue;
			if (current) current.explanation.push(text);
			else description.push(text);
			continue;
		}
	}

	const questions: Question[] = [];

	for (const draft of drafts) {
		const label = draft.text ? `"${draft.text}"` : 'senza testo';

		if (!draft.text) {
			errors.push({ line: draft.line, message: 'Domanda senza testo.' });
			continue;
		}
		if (draft.options.length && draft.pairs.length) {
			errors.push({
				line: draft.line,
				message: `La domanda ${label} mescola opzioni [x] e coppie "nome -> definizione": tienile separate.`
			});
			continue;
		}

		if (draft.pairs.length) {
			if (draft.pairs.length < 2) {
				errors.push({
					line: draft.line,
					message: `Il collegamento ${label} ha una sola coppia: ne servono almeno 2.`
				});
				continue;
			}
			if (draft.pairs.length > 8) {
				errors.push({
					line: draft.line,
					message: `Il collegamento ${label} ha ${draft.pairs.length} coppie: il massimo è 8.`
				});
				continue;
			}

			questions.push({
				text: draft.text,
				tag: draft.tag,
				explanation: draft.explanation.length ? draft.explanation.join(' ') : undefined,
				kind: 'match',
				options: [],
				pairs: draft.pairs,
				multiple: false
			});
			continue;
		}

		if (draft.options.length < 2) {
			errors.push({
				line: draft.line,
				message: `La domanda ${label} ha ${draft.options.length} opzioni: ne servono almeno 2.`
			});
			continue;
		}
		const correct = draft.options.filter((option) => option.correct).length;
		if (correct === 0) {
			errors.push({
				line: draft.line,
				message: `La domanda ${label} non ha nessuna opzione corretta: marcane almeno una con [x].`
			});
			continue;
		}
		if (correct === draft.options.length) {
			errors.push({
				line: draft.line,
				message: `Nella domanda ${label} tutte le opzioni sono corrette: serve almeno una opzione sbagliata.`
			});
			continue;
		}

		questions.push({
			text: draft.text,
			tag: draft.tag,
			explanation: draft.explanation.length ? draft.explanation.join(' ') : undefined,
			kind: 'choice',
			options: draft.options,
			pairs: [],
			multiple: correct > 1
		});
	}

	if (!questions.length && !errors.length) {
		errors.push({
			line: 0,
			message:
				'Nessuna domanda trovata: ogni domanda inizia con `##` e ha opzioni `- [ ]` / `- [x]`.'
		});
	}

	if (errors.length) return { ok: false, errors };

	return {
		ok: true,
		quiz: {
			title: title || 'Quiz senza titolo',
			description: description.length ? description.join(' ') : undefined,
			questions
		}
	};
}
