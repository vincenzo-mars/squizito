import { describe, expect, it } from 'vitest';
import { parseQuiz } from './parser';

const basic = `# Storia romana
> Un quiz veloce sulle fonti.

## Qual è la capitale d'Italia?
- Milano
- Roma
- Napoli
> Corretta: "Roma". Roma è capitale dal 1871.
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

	it('marca come multipla una domanda con più risposte citate', () => {
		const quiz = expectOk(`## Quali sono tipizzati staticamente?
- Rust
- TypeScript
- Python
> Corrette: "Rust"; "TypeScript".
`);
		expect(quiz.questions[0].multiple).toBe(true);
		expect(quiz.questions[0].options.filter((o) => o.correct).map((o) => o.text)).toEqual([
			'Rust',
			'TypeScript'
		]);
	});

	it('accetta la risposta multipla anche su righe Corretta: ripetute', () => {
		const quiz = expectOk(`## Quali sono tipizzati staticamente?
- Rust
- TypeScript
- Python
> Corretta: "Rust".
> Corretta: "TypeScript".
`);
		expect(quiz.questions[0].multiple).toBe(true);
		expect(quiz.questions[0].options.filter((o) => o.correct).map((o) => o.text)).toEqual([
			'Rust',
			'TypeScript'
		]);
	});

	it('tollera code fence, numerazione e bullet diversi', () => {
		const quiz = expectOk(
			'```markdown\n' +
				`# Quiz
## 3. Domanda numerata?
* Giusta
+ Sbagliata
> Corretta: "Giusta".
` +
				'```\n'
		);
		expect(quiz.questions[0].text).toBe('Domanda numerata?');
		expect(quiz.questions[0].options[0].correct).toBe(true);
	});

	it('rimuove grassetto, corsivo e backtick dai testi', () => {
		const quiz = expectOk(`## Cosa fa **git rebase**?
- Riscrive la \`storia\`
- __Niente__
> Corretta: "Riscrive la storia".
`);
		expect(quiz.questions[0].text).toBe('Cosa fa git rebase?');
		expect(quiz.questions[0].options[0].text).toBe('Riscrive la storia');
		expect(quiz.questions[0].options[1].text).toBe('Niente');
		expect(quiz.questions[0].options[0].correct).toBe(true);
	});

	it('legge il tag opzionale e unisce le spiegazioni su più righe', () => {
		const quiz = expectOk(`## Domanda?
Tag: linguaggi
- Giusta
- Sbagliata
> Corretta: "Giusta".
> Prima riga.
> Seconda riga.
`);
		expect(quiz.questions[0].tag).toBe('linguaggi');
		expect(quiz.questions[0].explanation).toBe('Prima riga. Seconda riga.');
	});

	it('ignora separatori, righe vuote e prosa fuori formato', () => {
		const quiz = expectOk(`## Domanda?
Ecco un po' di testo che non c'entra.
- Giusta
- Sbagliata
> Corretta: "Giusta".

---
`);
		expect(quiz.questions).toHaveLength(1);
	});

	it('la spiegazione non ha default quando manca', () => {
		const quiz = expectOk(`## Domanda?
- Giusta
- Sbagliata
> Corretta: "Giusta".
`);
		expect(quiz.questions[0].explanation).toBeUndefined();
	});

	it('mette un titolo di riserva quando manca', () => {
		const quiz = expectOk(`## Domanda?
- Giusta
- Sbagliata
> Corretta: "Giusta".
`);
		expect(quiz.title).toBe('Quiz senza titolo');
	});

	it('segnala una domanda con meno di due opzioni', () => {
		const result = parseQuiz(`## Domanda?
- Sola
> Corretta: "Sola".
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].line).toBe(1);
		expect(result.errors[0].message).toContain('almeno 2');
	});

	it('segnala una domanda senza citazione della risposta', () => {
		const result = parseQuiz(`## Domanda?
- Una
- Due
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('Corretta');
	});

	it('segnala una citazione che non corrisponde a nessuna opzione', () => {
		const result = parseQuiz(`## Domanda?
- Una
- Due
> Corretta: "Tre".
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('Tre');
	});

	it('segnala una citazione che corrisponde a più di una opzione', () => {
		const result = parseQuiz(`## Domanda?
- Uguale
- Uguale
> Corretta: "Uguale".
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('più di una opzione');
	});

	it('segnala una domanda dove tutte le opzioni sono corrette', () => {
		const result = parseQuiz(`## Domanda?
- Una
- Due
> Corrette: "Una"; "Due".
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('sbagliata');
	});

	it('segnala le opzioni scritte prima di una domanda', () => {
		const result = parseQuiz(`- Orfana
- Altra
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

	it('segnala la vecchia sintassi [x]/[ ] con un messaggio dedicato', () => {
		const result = parseQuiz(`## Domanda?
- [x] Giusta
- [ ] Sbagliata
`);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].message).toContain('vecchia sintassi');
	});

	it('risolve una citazione troncata per prefisso', () => {
		const quiz = expectOk(`## Quanto impiega la luce a raggiungere la Terra?
- Circa 8 minuti
- Circa 8 ore
- Circa 8 secondi
> Corretta: "Circa 8 min".
`);
		expect(quiz.questions[0].options[0].correct).toBe(true);
		expect(quiz.questions[0].options[1].correct).toBe(false);
		expect(quiz.questions[0].options[2].correct).toBe(false);
	});

	it('preferisce il match esatto al prefisso quando entrambi esistono', () => {
		const quiz = expectOk(`## Qual è la capitale d'Italia?
- Roma
- Roma capitale
> Corretta: "Roma".
`);
		expect(quiz.questions[0].options[0].correct).toBe(true);
		expect(quiz.questions[0].options[1].correct).toBe(false);
	});

	it('una citazione multipla senza virgolette non risolve e fa fallire il caricamento', () => {
		const result = parseQuiz(`## Domanda?
- Rust
- TypeScript
- Python
> Corrette: Rust, TypeScript.
`);
		expect(result.ok).toBe(false);
	});

	it('accetta la virgola e "e" come separatori fra le risposte citate', () => {
		const quiz = expectOk(`## Quali sono tipizzati staticamente?
- Rust
- TypeScript
- Python
> Corrette: "Rust" e "TypeScript".
`);
		expect(quiz.questions[0].options.filter((o) => o.correct).map((o) => o.text)).toEqual([
			'Rust',
			'TypeScript'
		]);
	});

	it('non distingue il numero grammaticale di Corretta/Corretto/Corrette/Corretti', () => {
		const quiz = expectOk(`## Domanda?
- Giusta
- Sbagliata
> Corretti: "Giusta".
`);
		expect(quiz.questions[0].options[0].correct).toBe(true);
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
- Giusta
- Sbagliata
> Corretta: "Giusta".
`);
		expect(quiz.questions[0].kind).toBe('choice');
		expect(quiz.questions[0].pairs).toEqual([]);
	});

	it("la citazione decide che è una domanda a scelta anche se un'opzione contiene una freccia", () => {
		const quiz = expectOk(`## Domanda?
- A -> B è corretto
- Sbagliata
> Corretta: "A -> B è corretto".
`);
		expect(quiz.questions[0].kind).toBe('choice');
		expect(quiz.questions[0].options[0].text).toBe('A -> B è corretto');
		expect(quiz.questions[0].options[0].correct).toBe(true);
	});

	it("un'opzione con freccia senza citazione diventa un collegamento", () => {
		const quiz = expectOk(`## Domanda?
- A -> B
- C -> D
`);
		expect(quiz.questions[0].kind).toBe('match');
	});

	it('un collegamento con una riga Corretta: viene letto come domanda a scelta', () => {
		const result = parseQuiz(`## Collega
- Mitosi -> Divisione cellulare
- Meiosi -> Dimezza i cromosomi
> Corretta: "Mitosi -> Divisione cellulare".
`);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.quiz.questions[0].kind).toBe('choice');
	});

	it('rifiuta un blocco che mescola opzioni e coppie', () => {
		const result = parseQuiz(`## Domanda?
- Giusta
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
- Giusta
- Sbagliata
> Corretta: "Giusta". Nota uno.
## Seconda?
- Sbagliata
- Giusta
> Corretta: "Giusta". Nota due.`);
		expect(quiz.questions).toHaveLength(2);
		expect(quiz.questions[0].explanation).toBe('Nota uno.');
	});

	it('regge righe vuote di troppo, anche dentro le opzioni', () => {
		const quiz = expectOk(`# Titolo


## Domanda?

- Giusta


- Sbagliata


> Corretta: "Giusta". Nota.
`);
		expect(quiz.questions[0].options).toHaveLength(2);
		expect(quiz.questions[0].explanation).toBe('Nota.');
	});

	it('regge spazi in coda, indentazione e tabulazioni', () => {
		const quiz = expectOk(
			'##   Domanda con spazi?   \n\t-   Giusta   \n  - Sbagliata  \n   >   Corretta: "Giusta".   \n'
		);
		expect(quiz.questions[0].text).toBe('Domanda con spazi?');
		expect(quiz.questions[0].options[0].text).toBe('Giusta');
		expect(quiz.questions[0].options[0].correct).toBe(true);
	});

	it('regge le interruzioni di riga in stile Windows', () => {
		const quiz = expectOk(
			'# Titolo\r\n\r\n## Domanda?\r\n- Giusta\r\n- Sbagliata\r\n> Corretta: "Giusta".\r\n'
		);
		expect(quiz.questions).toHaveLength(1);
		expect(quiz.questions[0].options[1].text).toBe('Sbagliata');
	});

	it('regge gli spazi unificatori che gli LLM infilano ogni tanto', () => {
		const nbsp = ' ';
		const quiz = expectOk(
			`##${nbsp}Domanda?\n-${nbsp}Giusta${nbsp}\n- Sbagliata\n>${nbsp}Corretta:${nbsp}"Giusta".${nbsp}Nota.\n`
		);
		expect(quiz.questions[0].text).toBe('Domanda?');
		expect(quiz.questions[0].options[0]).toEqual({ text: 'Giusta', correct: true });
		expect(quiz.questions[0].explanation).toBe('Nota.');
	});

	it('accetta trattini lunghi e pallini al posto del trattino', () => {
		const quiz = expectOk(`## Domanda?
– Giusta
— Sbagliata
• Altra
> Corretta: "Giusta".
`);
		expect(quiz.questions[0].options).toHaveLength(3);
		expect(quiz.questions[0].options[0].correct).toBe(true);
	});

	it('accetta il trattino senza spazio prima del testo', () => {
		const quiz = expectOk(`## Domanda?
-Giusta
-Sbagliata
> Corretta: "Giusta".
`);
		expect(quiz.questions[0].options[0].correct).toBe(true);
		expect(quiz.questions[0].options[1].correct).toBe(false);
	});

	it('accetta la spiegazione senza spazio dopo il maggiore', () => {
		const quiz = expectOk(`## Domanda?
- Giusta
- Sbagliata
>Corretta: "Giusta". Nota attaccata.
`);
		expect(quiz.questions[0].explanation).toBe('Nota attaccata.');
	});

	it('accetta un titolo senza spazio dopo il cancelletto', () => {
		const quiz = expectOk(`#Titolo attaccato
##Domanda attaccata?
- Giusta
- Sbagliata
> Corretta: "Giusta".
`);
		expect(quiz.title).toBe('Titolo attaccato');
		expect(quiz.questions[0].text).toBe('Domanda attaccata?');
	});

	it('ignora la prosa che NotebookLM mette prima e dopo il blocco', () => {
		const quiz = expectOk(`Certo! Ecco il quiz che hai chiesto:

\`\`\`markdown
# Titolo
## Domanda?
- Giusta
- Sbagliata
> Corretta: "Giusta".
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
- Giusta
- Sbagliata
> Corretta: "Giusta".
# Secondo titolo ignorato
## Altra domanda?
- Giusta
- Sbagliata
> Corretta: "Giusta".
`);
		expect(quiz.title).toBe('Primo titolo');
		expect(quiz.questions).toHaveLength(2);
	});
});

/**
 * Un output di NotebookLM può arrivare sporco in molti modi. Quello che non deve mai succedere è
 * che una domanda si carichi con una risposta corretta diversa da quella che l'autore intendeva:
 * o la citazione risolve in modo univoco, o il caricamento fallisce con un errore visibile.
 */
describe('parseQuiz, nessun errore silenzioso sulla risposta corretta', () => {
	const giusta = (source: string) => {
		const result = parseQuiz(source);
		if (!result.ok) return { caricato: false as const, errore: result.errors[0].message };
		const corrette = result.quiz.questions[0].options.filter((option) => option.correct);
		return { caricato: true as const, corrette: corrette.map((option) => option.text) };
	};

	it('la citazione risolve anche con i riferimenti NotebookLM fra parentesi quadre', () => {
		expect(
			giusta(`## Come viene definita la capacità del bambino?
- Linguaggio del pensiero (o linguaggio della mente). [464]
- Bootstrapping del barone di Münchhausen. [451]
- Postura pedagogica ostensiva. [472, 480]
> Corretta: "Linguaggio del pensiero (o linguaggio della mente)". Il bambino possiede un linguaggio del pensiero [464, 476].`)
		).toEqual({
			caricato: true,
			corrette: ['Linguaggio del pensiero (o linguaggio della mente). [464]']
		});
	});

	it('la citazione risolve anche con markdown intorno al testo', () => {
		expect(
			giusta(`## Domanda?
- **Giusta**
- Sbagliata
> Corretta: "Giusta".`)
		).toEqual({ caricato: true, corrette: ['Giusta'] });
	});

	it('la citazione risolve con spazi extra e virgolette diverse', () => {
		expect(
			giusta(`## Domanda?
-  Giusta
-  Sbagliata
>  Corretta:  «Giusta» .`)
		).toEqual({ caricato: true, corrette: ['Giusta'] });
	});

	it('non riconosce un elenco con lettere invece del trattino', () => {
		expect(
			giusta(`## Domanda?
A. Giusta
B. Sbagliata`).caricato
		).toBe(false);
	});

	it('non riconosce un trattino preceduto da numerazione', () => {
		expect(
			giusta(`## Domanda?
1. - Giusta
2. - Sbagliata`).caricato
		).toBe(false);
	});

	it('una opzione spezzata su due righe perde la coda ma non la corrispondenza', () => {
		expect(
			giusta(`## Domanda?
- Giusta
  continuazione ignorata
- Sbagliata
> Corretta: "Giusta".`)
		).toEqual({ caricato: true, corrette: ['Giusta'] });
	});

	it('nessuna citazione fa fallire il caricamento invece di indovinare', () => {
		expect(
			giusta(`## Domanda?
- Una
- Due`).caricato
		).toBe(false);
	});
});
