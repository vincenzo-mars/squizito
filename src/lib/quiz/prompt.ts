export type PromptOptions = {
	/** Name of the source to work on. Empty means "the whole notebook". */
	source: string;
	/** Chapter or topic to restrict to. Empty means "the whole source". */
	chapter: string;
	/** How many questions to ask for. Empty means "decide tu". */
	count: string;
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
	source: '',
	chapter: '',
	count: '',
	multiple: true,
	tags: false,
	reasoning: false,
	matching: false
};

/** Questions per round when the quiz is long enough that a single answer would get truncated. */
export const BATCH_SIZE = 15;

/** Only a plain positive number counts: anything else means "decide tu". */
function requested(options: PromptOptions): number | null {
	const count = Number.parseInt(options.count.trim(), 10);
	return Number.isFinite(count) && count > 0 ? count : null;
}

/** Whether the prompt asks for the quiz in cumulative rounds instead of one shot. */
export function isBatched(options: PromptOptions): boolean {
	const count = requested(options);
	return count !== null && count > BATCH_SIZE;
}

/**
 * A bare number is a chapter number: spell it out, so "3" doesn't end up alone in a note title.
 * Uppercase in titles, where it has to stand out, plain in the middle of a sentence.
 */
function chapterLabel(raw: string, shouting = false): string {
	const chapter = raw.trim();
	if (!/^\d+([.,]\d+)?$/.test(chapter)) return chapter;
	return `${shouting ? 'CAPITOLO' : 'capitolo'} ${chapter}`;
}

function titlePlaceholder(options: PromptOptions): string {
	const source = options.source.trim() || '<materia o fonte>';
	const chapter = chapterLabel(options.chapter, true) || '<capitolo o argomento>';
	return `${source} - ${chapter}`;
}

/** Title of the note holding the whole quiz: the one to load, telling it apart from the rounds. */
function noteTitle(options: PromptOptions): string {
	return `${titlePlaceholder(options)} COMPLETO`;
}

function scope(options: PromptOptions): string {
	const source = options.source.trim();
	const chapter = options.chapter.trim();

	if (source && chapter)
		return `Lavora sulla fonte "${source}", solo sul ${chapterLabel(chapter)}.`;
	if (source) return `Lavora sulla fonte "${source}", coprila per intero.`;
	if (chapter) return `Lavora solo sul ${chapterLabel(chapter)}.`;
	return 'Lavora su tutte le fonti del notebook.';
}

/**
 * How the quiz has to come out of NotebookLM. It lands in the notebook's notes, never in its
 * sources, so the quiz is not fed back into the next generation. Past a certain length one answer
 * gets truncated, so the quiz is grown in cumulative rounds: every round rewrites the previous
 * questions verbatim and appends new ones, and only the note marked FINALE is the one to load.
 */
function delivery(options: PromptOptions): string[] {
	const title = titlePlaceholder(options);
	const count = requested(options);

	if (!isBatched(options))
		return [
			`Salvalo fra le NOTE del notebook, mai fra le fonti: una nuova nota intitolata "${noteTitle(options)}" che contenga solo il quiz, e rispondi in chat con lo stesso identico contenuto, senza testo prima o dopo.`
		];

	return [
		`Procedi a blocchi da ${BATCH_SIZE} domande, ognuno cumulativo. Ogni blocco lo salvi fra le NOTE del notebook, mai fra le fonti:`,
		`- Primo blocco: una nuova nota intitolata "${title} - 1" con le prime ${BATCH_SIZE} domande.`,
		`- Blocchi successivi: ogni volta una NUOVA nota intitolata "${title} - <n>", che ripete alla lettera tutte le domande dei blocchi precedenti e aggiunge in coda ${BATCH_SIZE} domande nuove.`,
		`- L'ultima nota la intitoli "${noteTitle(options)}" e contiene tutte e ${count} le domande.`,
		'- Non riformulare, non riordinare e non togliere le domande già generate: ricopiale identiche.',
		`- Chiudi ogni blocco scrivendo in chat solo "blocco <n>: <domande finora> su ${count}", poi fermati e aspetta che io scriva "continua". La nota la scrivi comunque per intero, in chat non ripetere il quiz.`
	];
}

function format(options: PromptOptions): string {
	const lines = [
		`# ${titlePlaceholder(options)}`,
		'> <una riga su cosa copre>',
		'',
		'## <domanda>'
	];

	if (options.tags) lines.push('Tag: <argomento>');

	lines.push(
		'- [x] <opzione corretta>',
		'- [ ] <opzione sbagliata>',
		'- [ ] <opzione sbagliata>',
		'> Corretta: "<testo identico dell\'opzione corretta>". <spiegazione esaustiva>'
	);

	if (options.matching) {
		lines.push(
			'',
			'## <consegna del collegamento>',
			'- <termine> -> <definizione estesa>',
			'- <termine> -> <definizione estesa>',
			'> <nota sulla distinzione>'
		);
	}

	return lines.join('\n');
}

function rules(options: PromptOptions): string[] {
	const list = [
		options.multiple
			? '4 opzioni per domanda. Alterna domande con una sola [x] e domande con più [x], queste ultime in minoranza e senza dire quante siano le corrette.'
			: '4 opzioni per domanda, una sola [x].',
		"Metti sempre la risposta corretta come PRIMA opzione e marcala. Non mescolare le opzioni: al mescolamento pensa l'app.",
		'Distrattori plausibili e lunghi quanto la corretta.',
		'Ogni domanda si regge da sola: niente rimandi a pagine, paragrafi o "come sopra".',
		'La riga "> " inizia citando alla lettera l\'opzione corretta: > Corretta: "<testo identico dell\'opzione marcata>". Poi spiega perché è corretta e, se serve, perché le altre no.',
		'Prima di consegnare rileggi ogni domanda: se il testo dopo "Corretta:" non è identico all\'opzione marcata [x], la marcatura è sbagliata, correggila.',
		'Copri punti diversi, non ripetere lo stesso concetto, non uscire dalle fonti.'
	];

	if (options.tags)
		list.push('Tag: una o due parole per argomento, riusa gli stessi fra domande affini.');
	if (options.reasoning) list.push('Domande di applicazione e ragionamento, non di sola memoria.');
	if (options.matching) {
		list.push(
			'Collegamenti: 3-5 coppie "termine -> definizione", senza [x], termini dello stesso ambito e confondibili fra loro, alternati alle altre domande.'
		);
	}

	list.push('Solo il formato: niente numerazione, introduzioni, commenti o note.');
	return list;
}

function amount(options: PromptOptions): string {
	const count = requested(options);
	return count ? `Genera esattamente ${count} domande.` : '';
}

/** Prompt to paste into NotebookLM, built from the fields and options picked on the home page. */
export function buildPrompt(options: PromptOptions): string {
	return [
		'Genera un quiz di ripasso dalle fonti accademiche di questo notebook.',
		scope(options),
		amount(options),
		'',
		...delivery(options),
		'',
		format(options),
		'',
		'Regole:',
		...rules(options).map((rule) => `- ${rule}`)
	]
		.filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
		.join('\n');
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
