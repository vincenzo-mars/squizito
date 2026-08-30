export type PromptOptions = {
	/** Allow questions with more than one correct option. */
	multiple: boolean;
	/** Ask for a `Tag:` line, which the app shows on the question cards. */
	tags: boolean;
	/** Push for reasoning and application instead of pure recall. */
	reasoning: boolean;
	/** Ask for match-the-definition exercises alongside the questions. */
	matching: boolean;
};

export const DEFAULT_PROMPT_OPTIONS: PromptOptions = {
	multiple: true,
	tags: false,
	reasoning: false,
	matching: false
};

function formatBlock(options: PromptOptions): string {
	const lines = [
		'# <tematica> - <capitolo o argomento>',
		'> <una riga di descrizione>',
		'',
		'## <domanda>'
	];

	if (options.tags) lines.push('Tag: <argomento della domanda>');

	lines.push(
		'- [ ] <opzione sbagliata>',
		'- [x] <opzione corretta>',
		'- [ ] <opzione sbagliata>',
		'> <spiegazione esaustiva della risposta corretta>'
	);

	if (options.matching) {
		lines.push(
			'',
			'## <consegna del collegamento>',
			'- <termine breve> -> <definizione estesa>',
			'- <termine breve> -> <definizione estesa>',
			'- <termine breve> -> <definizione estesa>',
			'> <nota sulla distinzione fra i termini>'
		);
	}

	return lines.join('\n');
}

function rules(options: PromptOptions): string[] {
	const list = [
		'Il titolo deve dire di cosa parla il test: nome della materia o della tematica, poi il capitolo o l\'argomento specifico, separati da un trattino. Per esempio "Diritto privato - Capitolo 4: le obbligazioni" oppure "Storia romana - La crisi della Repubblica". Niente titoli generici come "Quiz" o "Test di verifica".',
		'La riga di descrizione dice in una frase cosa copre il test.',
		'Marca sempre con [x] le opzioni corrette e con [ ] quelle sbagliate.'
	];

	if (options.multiple) {
		list.push(
			'Se non ti chiedo altrove qualcosa di diverso, ogni domanda ha 4 opzioni.',
			"Alterna domande con una sola risposta corretta e domande con più risposte corrette: in queste ultime metti più [x]. Non c'è un limite a quante domande possono essere a risposta multipla, ma devono restare una minoranza rispetto a quelle secche.",
			'Nelle domande a risposta multipla non annunciare quante sono le corrette: la formulazione resta neutra ("Quali fra le seguenti...").'
		);
	} else {
		list.push(
			'Se non ti chiedo altrove qualcosa di diverso, ogni domanda ha 4 opzioni.',
			'Ogni domanda ha una sola risposta corretta: esattamente una [x] per domanda, mai due.'
		);
	}

	if (options.tags) {
		list.push(
			'Ogni domanda ha una riga "Tag:" subito sotto il testo, con una o due parole che dicono di quale argomento del capitolo si tratta. Riusa gli stessi tag fra domande sullo stesso argomento.'
		);
	}

	if (options.reasoning) {
		list.push(
			'Preferisci domande di ragionamento e applicazione (un caso concreto, una conseguenza, un confronto) invece di domande che chiedono solo di ricordare una definizione o una data.'
		);
	}

	if (options.matching) {
		list.push(
			'Inserisci anche esercizi di collegamento fra termine e definizione, con lo stesso "##" della consegna e poi una riga per coppia nel formato "- termine -> definizione". Non usare [x] in questi blocchi.',
			"Ogni esercizio di collegamento ha da 3 a 5 coppie, tutte corrette: è l'app a mescolarle. A sinistra della freccia il termine breve, a destra la definizione estesa, mai il contrario.",
			"I termini di uno stesso esercizio di collegamento devono appartenere allo stesso ambito e essere confondibili fra loro, altrimenti l'abbinamento è ovvio.",
			'Non usare la freccia "->" dentro il testo di una definizione, e non numerare le coppie.',
			'Alterna gli esercizi di collegamento alle normali domande, senza metterli tutti in fondo.'
		);
	}

	list.push(
		'Le opzioni sbagliate devono essere plausibili e pertinenti al contenuto, non assurde: chi non ha studiato deve poterci cadere.',
		'Le opzioni della stessa domanda devono avere lunghezza e livello di dettaglio simili, altrimenti la corretta si riconosce dalla forma invece che dal contenuto.',
		'Ordine delle opzioni casuale: la corretta non sempre nella stessa posizione.',
		'Ogni domanda si regge da sola: nessun riferimento al contesto ("come detto sopra", "nella pagina 3", "secondo l\'autore").',
		'La riga "> spiegazione" è obbligatoria e deve essere esaustiva: perché la risposta corretta è corretta e, dove serve a capire, perché le altre non lo sono. Meglio lunga che vaga.',
		'Copri punti diversi delle fonti: niente due domande sullo stesso concetto.',
		'Non inventare niente che non sia nelle fonti.',
		'Non aggiungere numerazione, titoli di sezione, introduzioni, commenti o note fuori dal formato.',
		'Il file .md salvato fra le fonti e la risposta in chat devono coincidere carattere per carattere.'
	);

	return list;
}

/** Full prompt to paste into NotebookLM, built from the options picked on the home page. */
export function buildPrompt(options: PromptOptions): string {
	return [
		'Genera un quiz a risposta multipla basato esclusivamente sulle fonti di questo notebook.',
		'',
		'Salva SEMPRE il risultato come nuova fonte di questo notebook, in un file Markdown chiamato "<tematica>-<capitolo>.md", così posso scaricarlo. Quel file deve contenere SOLO il quiz nel formato qui sotto: niente titoli aggiuntivi, niente introduzioni, niente commenti, niente note finali. Deve essere caricabile così com\'è in un\'app di quiz esterna, senza che io debba ripulirlo.',
		'',
		'Rispondi poi in chat con lo stesso identico contenuto del file, senza testo prima o dopo:',
		'',
		formatBlock(options),
		'',
		'Regole:',
		...rules(options).map((rule) => `- ${rule}`)
	].join('\n');
}

/** Compact version, meant to be appended to a request the user has already written. */
export function buildSnippet(options: PromptOptions): string {
	const tail = [
		"Salva sempre il risultato come nuova fonte del notebook, in un file .md che contenga solo il quiz, così posso scaricarlo e caricarlo in un'app esterna.",
		'Il titolo deve essere la materia o tematica seguita dal capitolo o argomento, non un generico "Quiz".',
		'Marca sempre con [x] le corrette e con [ ] le sbagliate.',
		options.multiple
			? 'Alterna domande secche e domande con più risposte corrette (più [x] nella stessa domanda), tenendo le multiple in minoranza.'
			: 'Una sola risposta corretta per domanda: esattamente una [x].',
		options.tags ? 'Aggiungi una riga "Tag:" sotto ogni domanda con l\'argomento.' : '',
		options.reasoning ? 'Preferisci domande di ragionamento, non di sola memoria.' : '',
		options.matching
			? 'Inserisci anche esercizi di collegamento: stessa "##" per la consegna, poi una riga per coppia come "- termine -> definizione", da 3 a 5 coppie, senza [x].'
			: '',
		'Le sbagliate devono essere plausibili e lunghe quanto la corretta, in ordine casuale.',
		'La riga > è obbligatoria e deve spiegare per esteso perché la risposta è quella.',
		'Niente numerazione, commenti o note fuori dal formato.'
	]
		.filter(Boolean)
		.join(' ');

	return `Formatta la risposta esattamente così, senza testo prima o dopo:\n\n${formatBlock(options)}\n\n${tail}`;
}

export const SYNTAX_EXAMPLE = `# Titolo del quiz
> Descrizione breve, una riga. Opzionale.

## Qual è la capitale d'Italia?
- [ ] Milano
- [x] Roma
- [ ] Napoli
> Roma è capitale dal 1871. Riga opzionale.

## Quali di questi sono tipizzati staticamente?
Tag: linguaggi
- [x] Rust
- [x] TypeScript
- [ ] Python
> Due [x] significa risposta multipla.

## Collega ogni linguaggio al suo ambito
- Rust -> Sistemi e programmi dove contano memoria e prestazioni
- SQL -> Interrogazione di basi di dati relazionali
- CSS -> Presentazione e impaginazione di documenti web
> Le righe con la freccia diventano un esercizio di collegamento.`;
