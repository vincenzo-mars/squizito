import { parseCitations, resolveCorrect } from './answers';
import type { MatchPair, ParseIssue, ParseResult, Question } from './types';

const FENCE = /^\s*```/;
const TITLE = /^\s*#\s*(.*)$/;
const HEADING = /^\s*#{2,6}\s*(.*)$/;
/** Una voce puntata: bullet legittimi che un LLM emette, trattino, asterisco, più, punto, en/em dash. */
const BULLET = /^\s*[-*+•–—]\s*(.+)$/;
/** Il vecchio formato a casella, ancora riconoscibile per dare un errore chiaro invece di uno confuso. */
const LEGACY_BOX = /^\s*[[(]\s*[xX]?\s*[\])]/;
const TAG = /^\s*(?:tag|tags|categoria|category)\s*:\s*(.*)$/i;
const QUOTE = /^\s*>\s?(.*)$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
/** `nome -> definizione`, applicata al testo già spogliato del carattere di elenco. */
const PAIR = /^(.+?)\s*(?:->|→|=>|-->|›)\s*(.*)$/;
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
	quotes: string[];
	bullets: { line: number; text: string }[];
};

/**
 * Parses the Markdown quiz syntax documented in the README. The parser is deliberately forgiving:
 * code fences, numbered headings, `*` bullets and stray prose are tolerated, only the structure
 * that carries meaning (headings, bullets, the `Corretta:`/`Corrette:` citation) is enforced.
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
				quotes: [],
				bullets: []
			};
			drafts.push(current);
			continue;
		}

		const bulletMatch = line.match(BULLET);
		if (bulletMatch) {
			if (!current) {
				errors.push({ line: number, message: 'Elenco trovato prima di una domanda `## ...`.' });
				continue;
			}
			const text = clean(bulletMatch[1]);
			if (!text) {
				errors.push({ line: number, message: 'Voce senza testo.' });
				continue;
			}
			current.bullets.push({ line: number, text });
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
			if (current) current.quotes.push(text);
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
		if (!draft.bullets.length) {
			errors.push({ line: draft.line, message: `La domanda ${label} non ha nessuna opzione.` });
			continue;
		}

		const legacy = draft.bullets.find((bullet) => LEGACY_BOX.test(bullet.text));
		if (legacy) {
			errors.push({
				line: legacy.line,
				message: `La domanda ${label} usa la vecchia sintassi [x]/[ ]: ora le opzioni sono trattini semplici e la risposta si dichiara con una riga > Corretta: "<testo dell'opzione>".`
			});
			continue;
		}

		const citedTexts: string[] = [];
		const explanationParts: string[] = [];
		for (const quote of draft.quotes) {
			const citation = parseCitations(quote);
			if (citation) {
				citedTexts.push(...citation.texts);
				if (citation.rest) explanationParts.push(citation.rest);
			} else {
				explanationParts.push(quote);
			}
		}
		const explanation = explanationParts.length ? explanationParts.join(' ') : undefined;

		if (!citedTexts.length) {
			const pairCandidates = draft.bullets.map((bullet) => bullet.text.match(PAIR));
			const pairCount = pairCandidates.filter(Boolean).length;

			if (pairCount > 0 && pairCount < draft.bullets.length) {
				errors.push({
					line: draft.line,
					message: `La domanda ${label} mescola opzioni e coppie "nome -> definizione": tienile separate.`
				});
				continue;
			}

			if (pairCount > 0 && pairCount === draft.bullets.length) {
				if (pairCount < 2) {
					errors.push({
						line: draft.line,
						message: `Il collegamento ${label} ha una sola coppia: ne servono almeno 2.`
					});
					continue;
				}
				if (pairCount > 8) {
					errors.push({
						line: draft.line,
						message: `Il collegamento ${label} ha ${pairCount} coppie: il massimo è 8.`
					});
					continue;
				}
				const pairs: MatchPair[] = pairCandidates.map((match) => ({
					name: clean(match![1]),
					definition: clean(match![2])
				}));
				if (pairs.some((pair) => !pair.name || !pair.definition)) {
					errors.push({
						line: draft.line,
						message: `Coppia incompleta nella domanda ${label}: serve "nome -> definizione".`
					});
					continue;
				}
				questions.push({
					text: draft.text,
					tag: draft.tag,
					explanation,
					kind: 'match',
					options: [],
					pairs,
					multiple: false
				});
				continue;
			}

			errors.push({
				line: draft.line,
				message: `La domanda ${label} non dichiara la risposta: aggiungi una riga > Corretta: "<testo esatto dell'opzione giusta>".`
			});
			continue;
		}

		if (draft.bullets.length < 2) {
			errors.push({
				line: draft.line,
				message: `La domanda ${label} ha ${draft.bullets.length} opzione: ne servono almeno 2.`
			});
			continue;
		}

		const optionTexts = draft.bullets.map((bullet) => bullet.text);
		const { correct, unmatched, ambiguous } = resolveCorrect(optionTexts, citedTexts);

		if (unmatched.length) {
			errors.push({
				line: draft.line,
				message: `Nella domanda ${label} la risposta citata "${unmatched[0]}" non corrisponde a nessuna opzione: copiala identica da una delle opzioni.`
			});
			continue;
		}
		if (ambiguous.length) {
			errors.push({
				line: draft.line,
				message: `Nella domanda ${label} la risposta citata "${ambiguous[0]}" corrisponde a più di una opzione: le opzioni devono essere tutte diverse fra loro.`
			});
			continue;
		}

		const correctCount = correct.filter(Boolean).length;
		if (correctCount === 0) {
			errors.push({
				line: draft.line,
				message: `La domanda ${label} non ha nessuna opzione corretta: cita il testo dell'opzione giusta dopo "Corretta:".`
			});
			continue;
		}
		if (correctCount === optionTexts.length) {
			errors.push({
				line: draft.line,
				message: `Nella domanda ${label} tutte le opzioni risultano corrette: serve almeno una opzione sbagliata.`
			});
			continue;
		}

		questions.push({
			text: draft.text,
			tag: draft.tag,
			explanation,
			kind: 'choice',
			options: optionTexts.map((text, index) => ({ text, correct: correct[index] })),
			pairs: [],
			multiple: correctCount > 1
		});
	}

	if (!questions.length && !errors.length) {
		errors.push({
			line: 0,
			message:
				'Nessuna domanda trovata: ogni domanda inizia con `##`, ha almeno due opzioni `- <testo>` e una riga `> Corretta: "..."`.'
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
