import { describe, expect, it } from 'vitest';
import { parseQuiz } from './parser';

const basic = `# Storia romana
> Un quiz veloce sulle fonti.

## Qual è la capitale d'Italia?
- [ ] Milano
- [x] Roma
- [ ] Napoli
> Roma è capitale dal 1871.
`;

function expectOk(source: string) {
	const result = parseQuiz(source);
	if (!result.ok)
		throw new Error(`parse fallito: ${result.errors.map((e) => e.message).join(', ')}`);
	return result.quiz;
}

describe('parseQuiz', () => {
	it('legge titolo, descrizione, domanda, opzioni e spiegazione', () => {
		const quiz = expectOk(basic);
		expect(quiz.title).toBe('Storia romana');
		expect(quiz.description).toBe('Un quiz veloce sulle fonti.');
		expect(quiz.questions).toHaveLength(1);
		expect(quiz.questions[0].text).toBe("Qual è la capitale d'Italia?");
		expect(quiz.questions[0].options.map((o) => o.text)).toEqual(['Milano', 'Roma', 'Napoli']);
		expect(quiz.questions[0].options[1].correct).toBe(true);
		expect(quiz.questions[0].explanation).toBe('Roma è capitale dal 1871.');
		expect(quiz.questions[0].multiple).toBe(false);
	});

	it('marca come multipla una domanda con più opzioni corrette', () => {
		const quiz = expectOk(`## Quali sono tipizzati staticamente?
- [x] Rust
- [x] TypeScript
- [ ] Python
`);
		expect(quiz.questions[0].multiple).toBe(true);
	});

	it('tollera code fence, numerazione, bullet e maiuscole nella X', () => {
		const quiz = expectOk(
			'```markdown\n' +
				`# Quiz
## 3. Domanda numerata?
* [X] Giusta
+ [ ] Sbagliata
` +
				'```\n'
		);
		expect(quiz.questions[0].text).toBe('Domanda numerata?');
		expect(quiz.questions[0].options[0].correct).toBe(true);
	});

	it('rimuove grassetto, corsivo e backtick dai testi', () => {
		const quiz = expectOk(`## Cosa fa **git rebase**?
- [x] Riscrive la \`storia\`
- [ ] __Niente__
`);
		expect(quiz.questions[0].text).toBe('Cosa fa git rebase?');
		expect(quiz.questions[0].options[0].text).toBe('Riscrive la storia');
		expect(quiz.questions[0].options[1].text).toBe('Niente');
	});

	it('legge il tag opzionale e unisce le spiegazioni su più righe', () => {
		const quiz = expectOk(`## Domanda?
Tag: linguaggi
- [x] Giusta
- [ ] Sbagliata
> Prima riga.
> Seconda riga.
`);
		expect(quiz.questions[0].tag).toBe('linguaggi');
		expect(quiz.questions[0].explanation).toBe('Prima riga. Seconda riga.');
	});

	it('ignora separatori, righe vuote e prosa fuori formato', () => {
		const quiz = expectOk(`## Domanda?
Ecco un po' di testo che non c'entra.
- [x] Giusta
- [ ] Sbagliata

---
`);
		expect(quiz.questions).toHaveLength(1);
	});

	it('la spiegazione non ha default quando manca', () => {
		const quiz = expectOk(`## Domanda?
- [x] Giusta
- [ ] Sbagliata
`);
		expect(quiz.questions[0].explanation).toBeUndefined();
	});

	it('mette un titolo di riserva quando manca', () => {
		const quiz = expectOk(`## Domanda?
- [x] Giusta
- [ ] Sbagliata
`);
		expect(quiz.title).toBe('Quiz senza titolo');
	});

	it('segnala una domanda con meno di due opzioni', () => {
		const result = parseQuiz(`## Domanda?
- [x] Sola
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].line).toBe(1);
		expect(result.errors[0].message).toContain('almeno 2');
	});

	it('segnala una domanda senza opzioni corrette', () => {
		const result = parseQuiz(`## Domanda?
- [ ] Una
- [ ] Due
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('[x]');
	});

	it('segnala una domanda dove tutte le opzioni sono corrette', () => {
		const result = parseQuiz(`## Domanda?
- [x] Una
- [x] Due
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('sbagliata');
	});

	it('segnala le opzioni scritte prima di una domanda', () => {
		const result = parseQuiz(`- [x] Orfana
- [ ] Altra
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].line).toBe(1);
	});

	it('segnala un documento senza domande', () => {
		const result = parseQuiz('# Solo un titolo\n> e una descrizione\n');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].line).toBe(0);
	});
});
