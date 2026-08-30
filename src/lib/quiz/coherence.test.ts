import { describe, expect, it } from 'vitest';
import { coherenceIssues } from './coherence';
import { parseQuiz } from './parser';

function quiz(source: string) {
	const result = parseQuiz(source);
	if (!result.ok) throw new Error(result.errors.map((e) => e.message).join(', '));
	return result.quiz;
}

describe('coherenceIssues', () => {
	it('non segnala niente quando la citazione coincide con la marcata', () => {
		expect(
			coherenceIssues(
				quiz(`## Chi scrisse il Discorso sul metodo?
- [x] René Descartes
- [ ] John Locke
> Corretta: "René Descartes". Lo pubblicò nel 1637.`)
			)
		).toEqual([]);
	});

	it('segnala la domanda quando la citazione indica un altra opzione', () => {
		const issues = coherenceIssues(
			quiz(`## Chi scrisse il Discorso sul metodo?
- [x] John Locke
- [ ] René Descartes
> Corretta: "René Descartes". Lo pubblicò nel 1637.`)
		);
		expect(issues).toHaveLength(1);
		expect(issues[0]).toMatchObject({ number: 1, marked: 'John Locke', cited: 'René Descartes' });
	});

	it('tollera una citazione troncata dal modello', () => {
		expect(
			coherenceIssues(
				quiz(`## Domanda?
- [x] Una risposta lunga e articolata che il modello potrebbe accorciare
- [ ] Altra
> Corretta: "Una risposta lunga e articolata". Spiegazione.`)
			)
		).toEqual([]);
	});

	it('ignora i quiz che non dichiarano la risposta, niente falsi positivi', () => {
		expect(
			coherenceIssues(
				quiz(`## Domanda?
- [x] Giusta
- [ ] Sbagliata
> Una spiegazione senza citazione.`)
			)
		).toEqual([]);
	});

	it('ignora le domande a risposta multipla', () => {
		expect(
			coherenceIssues(
				quiz(`## Domanda?
- [x] Prima
- [x] Seconda
- [ ] Terza
> Corretta: "Prima". Entrambe valgono.`)
			)
		).toEqual([]);
	});

	it('ignora gli esercizi di collegamento', () => {
		expect(
			coherenceIssues(
				quiz(`## Collega
- Uno -> Primo
- Due -> Secondo
> Corretta: "qualcosa".`)
			)
		).toEqual([]);
	});
});

describe('parseQuiz, citazione della risposta', () => {
	it('estrae la citazione e la toglie dalla spiegazione mostrata', () => {
		const question = quiz(`## Domanda?
- [x] Giusta
- [ ] Sbagliata
> Corretta: "Giusta". Perché lo dice la fonte.`).questions[0];
		expect(question.citedAnswer).toBe('Giusta');
		expect(question.explanation).toBe('Perché lo dice la fonte.');
	});

	it('lascia intatta una spiegazione senza citazione', () => {
		const question = quiz(`## Domanda?
- [x] Giusta
- [ ] Sbagliata
> Perché lo dice la fonte.`).questions[0];
		expect(question.citedAnswer).toBeUndefined();
		expect(question.explanation).toBe('Perché lo dice la fonte.');
	});

	it('accetta le virgolette basse e il femminile', () => {
		const question = quiz(`## Domanda?
- [x] Giusta
- [ ] Sbagliata
> Corretto: «Giusta». Spiegazione.`).questions[0];
		expect(question.citedAnswer).toBe('Giusta');
	});
});
