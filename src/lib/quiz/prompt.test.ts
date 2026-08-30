import { describe, expect, it } from 'vitest';
import { buildPrompt, DEFAULT_PROMPT_OPTIONS, isBatched, type PromptOptions } from './prompt';

const base: PromptOptions = {
	...DEFAULT_PROMPT_OPTIONS,
	source: 'Imparare',
	chapter: 'Capitolo 2'
};

describe('buildPrompt', () => {
	it('asks for a single file when the quiz is short', () => {
		const prompt = buildPrompt({ ...base, count: '12' });

		expect(prompt).toContain('Genera esattamente 12 domande.');
		expect(prompt).toContain('una nuova nota intitolata "Imparare - Capitolo 2"');
		expect(prompt).toContain('mai fra le fonti');
		expect(prompt).not.toContain('blocchi');
	});

	it('leaves the amount open when the count is not a number', () => {
		const prompt = buildPrompt({ ...base, count: 'tante' });

		expect(prompt).not.toContain('Genera esattamente');
		expect(prompt).toContain('una nuova nota intitolata "Imparare - Capitolo 2"');
	});

	it('splits long quizzes into cumulative notes ending in a FINALE one', () => {
		const prompt = buildPrompt({ ...base, count: '50' });

		expect(prompt).toContain('Procedi a blocchi da 15 domande, ognuno cumulativo');
		expect(prompt).toContain('mai fra le fonti');
		expect(prompt).toContain('una nuova nota intitolata "Imparare - Capitolo 2 - 1"');
		expect(prompt).toContain('"Imparare - Capitolo 2 - FINALE" e contiene tutte e 50 le domande');
		expect(prompt).toContain('ricopiale identiche');
		expect(prompt).toContain('"blocco <n>: <domande finora> su 50"');
		expect(prompt).not.toContain('rispondi in chat con lo stesso identico contenuto');
	});

	it('keeps the format block and the self-check rule in both modes', () => {
		for (const count of ['12', '50']) {
			const prompt = buildPrompt({ ...base, count });

			expect(prompt).toContain('- [x] <opzione corretta>');
			expect(prompt).toContain('> Corretta: "<testo identico dell\'opzione corretta>"');
			expect(prompt).toContain('la marcatura è sbagliata, correggila');
		}
	});

	it('flags the batched mode only past the round size', () => {
		expect(isBatched({ ...base, count: '15' })).toBe(false);
		expect(isBatched({ ...base, count: '16' })).toBe(true);
		expect(isBatched({ ...base, count: '' })).toBe(false);
	});
});
