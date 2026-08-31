/** `> Corretta: "testo"` / `> Corrette: "testo1"; "testo2"` — riconosce la riga di citazione. */
const CITATION = /^\s*corrett[aeio]\s*:\s*(.*)$/i;
/** Un segmento fra virgolette all'inizio del resto della riga. */
const QUOTE_START = /^[«"“'‘]\s*([^»"”'’]+?)\s*[»"”'’]/;
/** Separatore fra due segmenti citati consecutivi: `;`, `,` o ` e `. */
const SEPARATOR_START = /^\s*(?:;|,|e\s)\s*/i;

function stripReferences(text: string): string {
	return text.replace(/\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, '');
}

/** Case, spazi, punteggiatura e riferimenti NotebookLM (`[464]`) non contano nel confronto. */
export function normalise(text: string): string {
	return stripReferences(text)
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/[.,;:!?«»""'']/g, '')
		.trim();
}

export type Citation = {
	/** Uno o più testi citati come risposta corretta, nell'ordine in cui compaiono. */
	texts: string[];
	/** Quello che resta della riga dopo la citazione: la spiegazione. */
	rest: string;
};

/**
 * Riconosce una riga `>` come dichiarazione della risposta corretta. `Corretta`/`Corrette` e
 * simili non sono distinti: il numero grammaticale non è semantico, conta quanti testi citati
 * si riescono a estrarre. `null` quando la riga non è una citazione (è normale spiegazione).
 */
export function parseCitations(line: string): Citation | null {
	const match = line.match(CITATION);
	if (!match) return null;

	const body = match[1];
	const texts: string[] = [];
	let remaining = body;

	while (true) {
		const quote = remaining.match(QUOTE_START);
		if (!quote) break;
		texts.push(quote[1].trim());
		remaining = remaining.slice(quote[0].length);
		const separator = remaining.match(SEPARATOR_START);
		if (!separator) break;
		remaining = remaining.slice(separator[0].length);
	}

	if (texts.length) {
		return {
			texts,
			rest: remaining
				.trim()
				.replace(/^[.;]\s*/, '')
				.trim()
		};
	}

	// Nessuna virgoletta: un solo testo, fino al primo punto o punto e virgola.
	const plain = body.match(/^([^.;]+)[.;]?\s*(.*)$/s);
	if (plain && plain[1].trim()) return { texts: [plain[1].trim()], rest: plain[2].trim() };

	return { texts: [], rest: body.trim() };
}

export type Resolution = {
	/** Per ogni opzione, se è risultata corretta dal matching con le citazioni. */
	correct: boolean[];
	/** Testi citati che non combaciano con nessuna opzione. */
	unmatched: string[];
	/** Testi citati che combaciano con più di un'opzione. */
	ambiguous: string[];
};

/**
 * Ogni testo citato deve risolvere a esattamente un'opzione: prima per uguaglianza esatta
 * (normalizzata), poi per prefisso solo se l'uguaglianza esatta non ha trovato nulla — il
 * prefisso da solo renderebbe ambigue opzioni tipo "Roma" e "Roma capitale".
 */
export function resolveCorrect(optionTexts: string[], citedTexts: string[]): Resolution {
	const normalised = optionTexts.map(normalise);
	const correct = new Array(optionTexts.length).fill(false);
	const unmatched: string[] = [];
	const ambiguous: string[] = [];

	for (const cited of citedTexts) {
		const target = normalise(cited);

		let candidates = normalised
			.map((option, index) => ({ option, index }))
			.filter(({ option }) => option === target);

		if (candidates.length === 0) {
			// La citazione può essere troncata dal modello: l'opzione intera deve iniziare con il
			// testo citato, mai il contrario, altrimenti una citazione con più testo di qualunque
			// opzione (es. un elenco senza virgolette) combacerebbe per errore con la prima parola.
			candidates = normalised
				.map((option, index) => ({ option, index }))
				.filter(({ option }) => option.startsWith(target));
		}

		if (candidates.length === 0) unmatched.push(cited);
		else if (candidates.length > 1) ambiguous.push(cited);
		else correct[candidates[0].index] = true;
	}

	return { correct, unmatched, ambiguous };
}
