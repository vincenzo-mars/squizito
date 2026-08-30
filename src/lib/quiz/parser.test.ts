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

describe('parseQuiz, collegamenti', () => {
	it('riconosce un esercizio di collegamento dalle righe con la freccia', () => {
		const quiz = expectOk(`## Collega ogni termine alla sua definizione
- Mitosi -> Divisione cellulare che produce due cellule identiche
- Meiosi -> Divisione che dimezza il corredo cromosomico
- Apoptosi -> Morte cellulare programmata
> Sono tre processi distinti.
`);
		const question = quiz.questions[0];
		expect(question.kind).toBe('match');
		expect(question.options).toEqual([]);
		expect(question.pairs).toHaveLength(3);
		expect(question.pairs[0]).toEqual({
			name: 'Mitosi',
			definition: 'Divisione cellulare che produce due cellule identiche'
		});
		expect(question.explanation).toBe('Sono tre processi distinti.');
	});

	it('accetta anche → e =>', () => {
		const quiz = expectOk(`## Collega
- Uno → Primo
- Due => Secondo
`);
		expect(quiz.questions[0].pairs.map((pair) => pair.definition)).toEqual(['Primo', 'Secondo']);
	});

	it('marca le domande a scelta come kind choice', () => {
		const quiz = expectOk(`## Domanda?
- [x] Giusta
- [ ] Sbagliata
`);
		expect(quiz.questions[0].kind).toBe('choice');
		expect(quiz.questions[0].pairs).toEqual([]);
	});

	it('non confonde una opzione che contiene una freccia', () => {
		const quiz = expectOk(`## Domanda?
- [x] A -> B è corretto
- [ ] Sbagliata
`);
		expect(quiz.questions[0].kind).toBe('choice');
		expect(quiz.questions[0].options[0].text).toBe('A -> B è corretto');
	});

	it('rifiuta un blocco che mescola opzioni e coppie', () => {
		const result = parseQuiz(`## Domanda?
- [x] Giusta
- Nome -> Definizione
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('mescola');
	});

	it('rifiuta un collegamento con una sola coppia', () => {
		const result = parseQuiz(`## Collega
- Solo -> Una
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('almeno 2');
	});

	it('rifiuta un collegamento con più di otto coppie', () => {
		const pairs = Array.from({ length: 9 }, (_, i) => `- Nome ${i} -> Definizione ${i}`).join('\n');
		const result = parseQuiz(`## Collega\n${pairs}\n`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('massimo è 8');
	});

	it('segnala una coppia senza definizione', () => {
		const result = parseQuiz(`## Collega
- Nome ->
- Altro -> Definizione
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('incompleta');
	});
});

describe('parseQuiz, tenuta del markdown', () => {
	it('regge righe vuote mancanti fra i blocchi', () => {
		const quiz = expectOk(`# Titolo
> Descrizione
## Prima?
- [x] Giusta
- [ ] Sbagliata
> Nota uno.
## Seconda?
- [ ] Sbagliata
- [x] Giusta
> Nota due.`);
		expect(quiz.questions).toHaveLength(2);
		expect(quiz.questions[0].explanation).toBe('Nota uno.');
	});

	it('regge righe vuote di troppo, anche dentro le opzioni', () => {
		const quiz = expectOk(`# Titolo


## Domanda?

- [x] Giusta


- [ ] Sbagliata


> Nota.
`);
		expect(quiz.questions[0].options).toHaveLength(2);
		expect(quiz.questions[0].explanation).toBe('Nota.');
	});

	it('regge spazi in coda, indentazione e tabulazioni', () => {
		const quiz = expectOk(
			'##   Domanda con spazi?   \n\t- [x]   Giusta   \n  - [ ] Sbagliata  \n   >   Nota.   \n'
		);
		expect(quiz.questions[0].text).toBe('Domanda con spazi?');
		expect(quiz.questions[0].options[0].text).toBe('Giusta');
		expect(quiz.questions[0].explanation).toBe('Nota.');
	});

	it('regge le interruzioni di riga in stile Windows', () => {
		const quiz = expectOk('# Titolo\r\n\r\n## Domanda?\r\n- [x] Giusta\r\n- [ ] Sbagliata\r\n');
		expect(quiz.questions).toHaveLength(1);
		expect(quiz.questions[0].options[1].text).toBe('Sbagliata');
	});

	it('regge gli spazi unificatori che gli LLM infilano ogni tanto', () => {
		const nbsp = '\u00a0';
		const quiz = expectOk(
			`##${nbsp}Domanda?\n-${nbsp}[x]${nbsp}Giusta${nbsp}\n- [ ] Sbagliata\n>${nbsp}Nota.\n`
		);
		expect(quiz.questions[0].text).toBe('Domanda?');
		expect(quiz.questions[0].options[0]).toEqual({ text: 'Giusta', correct: true });
		expect(quiz.questions[0].explanation).toBe('Nota.');
	});

	it('accetta trattini lunghi e pallini al posto del trattino', () => {
		const quiz = expectOk(`## Domanda?
– [x] Giusta
— [ ] Sbagliata
• [ ] Altra
`);
		expect(quiz.questions[0].options).toHaveLength(3);
		expect(quiz.questions[0].options[0].correct).toBe(true);
	});

	it('accetta la casella senza spazio e con la x maiuscola', () => {
		const quiz = expectOk(`## Domanda?
-[X] Giusta
-[ ] Sbagliata
`);
		expect(quiz.questions[0].options[0].correct).toBe(true);
		expect(quiz.questions[0].options[1].correct).toBe(false);
	});

	it('accetta la spiegazione senza spazio dopo il maggiore', () => {
		const quiz = expectOk(`## Domanda?
- [x] Giusta
- [ ] Sbagliata
>Nota attaccata.
`);
		expect(quiz.questions[0].explanation).toBe('Nota attaccata.');
	});

	it('accetta un titolo senza spazio dopo il cancelletto', () => {
		const quiz = expectOk(`#Titolo attaccato
##Domanda attaccata?
- [x] Giusta
- [ ] Sbagliata
`);
		expect(quiz.title).toBe('Titolo attaccato');
		expect(quiz.questions[0].text).toBe('Domanda attaccata?');
	});

	it('ignora la prosa che NotebookLM mette prima e dopo il blocco', () => {
		const quiz = expectOk(`Certo! Ecco il quiz che hai chiesto:

\`\`\`markdown
# Titolo
## Domanda?
- [x] Giusta
- [ ] Sbagliata
\`\`\`

Fammi sapere se vuoi altre domande.`);
		expect(quiz.title).toBe('Titolo');
		expect(quiz.questions).toHaveLength(1);
	});

	it('regge un collegamento con righe vuote e spazi sparsi', () => {
		const quiz = expectOk(`##  Collega  

-  Mitosi   ->   Due cellule identiche  

-  Meiosi -> Corredo dimezzato

`);
		expect(quiz.questions[0].kind).toBe('match');
		expect(quiz.questions[0].pairs[0]).toEqual({
			name: 'Mitosi',
			definition: 'Due cellule identiche'
		});
	});

	it('non spezza una domanda se il titolo compare a metà documento', () => {
		const quiz = expectOk(`# Primo titolo
## Domanda?
- [x] Giusta
- [ ] Sbagliata
# Secondo titolo ignorato
## Altra domanda?
- [x] Giusta
- [ ] Sbagliata
`);
		expect(quiz.title).toBe('Primo titolo');
		expect(quiz.questions).toHaveLength(2);
	});
});

/**
 * Un output di NotebookLM può arrivare sporco in molti modi. Quello che non deve mai succedere è
 * che la [x] finisca su un'opzione diversa da quella marcata nel file: o si legge giusto, o il
 * caricamento fallisce con un errore visibile.
 */
describe('parseQuiz, nessun errore silenzioso sulla risposta corretta', () => {
	const giusta = (source: string) => {
		const result = parseQuiz(source);
		if (!result.ok) return { caricato: false as const, errore: result.errors[0].message };
		const corrette = result.quiz.questions[0].options.filter((option) => option.correct);
		return { caricato: true as const, corrette: corrette.map((option) => option.text) };
	};

	it('tiene la [x] al suo posto con le citazioni di NotebookLM', () => {
		expect(
			giusta(`## Come viene definita la capacità del bambino?
- [x] Linguaggio del pensiero (o linguaggio della mente). [464]
- [ ] Bootstrapping del barone di Münchhausen. [451]
- [ ] Postura pedagogica ostensiva. [472, 480]
> Il bambino possiede un linguaggio del pensiero [464, 476].`)
		).toEqual({
			caricato: true,
			corrette: ['Linguaggio del pensiero (o linguaggio della mente). [464]']
		});
	});

	it('tiene la [x] al suo posto col grassetto sul testo', () => {
		expect(
			giusta(`## Domanda?
- [x] **Giusta**
- [ ] Sbagliata`)
		).toEqual({ caricato: true, corrette: ['Giusta'] });
	});

	it('tiene la [x] al suo posto con spazi e maiuscola', () => {
		expect(
			giusta(`## Domanda?
-  [ X ]  Giusta
-  [   ]  Sbagliata`)
		).toEqual({ caricato: true, corrette: ['Giusta'] });
	});

	it('non si carica se la casella è avvolta dal grassetto', () => {
		expect(
			giusta(`## Domanda?
- **[x] Giusta**
- [ ] Sbagliata`).caricato
		).toBe(false);
	});

	it('non si carica se la spunta non è una x', () => {
		expect(
			giusta(`## Domanda?
- [✓] Giusta
- [ ] Sbagliata`).caricato
		).toBe(false);
	});

	it('non si carica con la lettera davanti alla casella', () => {
		expect(
			giusta(`## Domanda?
A. [x] Giusta
B. [ ] Sbagliata`).caricato
		).toBe(false);
	});

	it('non si carica con la numerazione davanti al trattino', () => {
		expect(
			giusta(`## Domanda?
1. - [x] Giusta
2. - [ ] Sbagliata`).caricato
		).toBe(false);
	});

	it('la citazione attaccata alla casella resta nel testo, non sposta la [x]', () => {
		expect(
			giusta(`## Domanda?
- [x][464] Giusta
- [ ] Sbagliata`)
		).toEqual({ caricato: true, corrette: ['[464] Giusta'] });
	});

	it('una opzione spezzata su due righe perde la coda ma non la marcatura', () => {
		expect(
			giusta(`## Domanda?
- [x] Giusta
  continuazione ignorata
- [ ] Sbagliata`)
		).toEqual({ caricato: true, corrette: ['Giusta'] });
	});

	it('nessuna [x] anywhere fa fallire il caricamento invece di indovinare', () => {
		expect(
			giusta(`## Domanda?
- [ ] Una
- [ ] Due`).caricato
		).toBe(false);
	});
});
