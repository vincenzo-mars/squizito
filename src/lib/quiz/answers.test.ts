import { describe, expect, it } from 'vitest';
import { normalise, parseCitations, resolveCorrect } from './answers';

describe('normalise', () => {
	it('ignores case, spazi e punteggiatura', () => {
		expect(normalise('  Roma,  Capitale!  ')).toBe(normalise('roma capitale'));
	});

	it('toglie i riferimenti NotebookLM fra parentesi quadre', () => {
		expect(normalise('Divisione cellulare [464]')).toBe(normalise('Divisione cellulare'));
		expect(normalise('Un fatto citato [451, 480] due volte')).toBe(
			normalise('Un fatto citato due volte')
		);
	});
});

describe('parseCitations', () => {
	it('riconosce una singola citazione fra virgolette', () => {
		const result = parseCitations('Corretta: "Roma". Roma è capitale dal 1871.');
		expect(result).toEqual({ texts: ['Roma'], rest: 'Roma è capitale dal 1871.' });
	});

	it('riconosce più citazioni separate da punto e virgola', () => {
		const result = parseCitations('Corrette: "Rust"; "TypeScript". Sono tipizzati staticamente.');
		expect(result?.texts).toEqual(['Rust', 'TypeScript']);
		expect(result?.rest).toBe('Sono tipizzati staticamente.');
	});

	it('accetta la virgola e "e" come separatori', () => {
		expect(parseCitations('Corrette: "A", "B". spiega')?.texts).toEqual(['A', 'B']);
		expect(parseCitations('Corrette: "A" e "B". spiega')?.texts).toEqual(['A', 'B']);
	});

	it('accetta la forma senza virgolette con un solo testo', () => {
		const result = parseCitations('Corretta: Roma. Roma è capitale dal 1871.');
		expect(result).toEqual({ texts: ['Roma'], rest: 'Roma è capitale dal 1871.' });
	});

	it('accetta singolare e plurale indifferentemente', () => {
		expect(parseCitations('Corretto: "Roma". spiega')?.texts).toEqual(['Roma']);
		expect(parseCitations('Corretti: "A"; "B". spiega')?.texts).toEqual(['A', 'B']);
	});

	it('ritorna null su una riga che non è una citazione', () => {
		expect(parseCitations('Questa è solo una spiegazione.')).toBeNull();
	});
});

describe('resolveCorrect', () => {
	it('risolve un match esatto singolo', () => {
		const result = resolveCorrect(['Milano', 'Roma', 'Napoli'], ['Roma']);
		expect(result).toEqual({ correct: [false, true, false], unmatched: [], ambiguous: [] });
	});

	it('risolve più match esatti', () => {
		const result = resolveCorrect(['Rust', 'TypeScript', 'Python'], ['Rust', 'TypeScript']);
		expect(result.correct).toEqual([true, true, false]);
	});

	it("usa il prefisso solo se l'esatto non trova nulla", () => {
		const result = resolveCorrect(['Circa 8 minuti'], ['Circa 8']);
		expect(result.correct).toEqual([true]);
		expect(result.unmatched).toEqual([]);
	});

	it("preferisce l'esatto al prefisso quando entrambi esistono", () => {
		const result = resolveCorrect(['Roma', 'Roma capitale'], ['Roma']);
		expect(result.correct).toEqual([true, false]);
		expect(result.ambiguous).toEqual([]);
	});

	it('segnala ambiguo un prefisso che combacia con più opzioni', () => {
		const result = resolveCorrect(['Roma antica', 'Roma moderna'], ['Roma']);
		expect(result.ambiguous).toEqual(['Roma']);
		expect(result.correct).toEqual([false, false]);
	});

	it('segnala non trovato un testo che non combacia con nessuna opzione', () => {
		const result = resolveCorrect(['Milano', 'Roma'], ['Torino']);
		expect(result.unmatched).toEqual(['Torino']);
	});
});
