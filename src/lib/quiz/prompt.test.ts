import { describe, expect, it } from 'vitest';
import { buildPrompt, DEFAULT_PROMPT_OPTIONS, type PromptOptions } from './prompt';

const base: PromptOptions = {
	...DEFAULT_PROMPT_OPTIONS,
	source: 'Imparare',
	chapter: 'Capitolo 2'
};

describe('buildPrompt', () => {
	it('asks for a single file when the quiz is short', () => {
		const prompt = buildPrompt({ ...base, count: '12' });

		expect(prompt).toContain('Genera esattamente 12 domande.');
		expect(prompt).toContain('in un file "Imparare - Capitolo 2.md"');
		expect(prompt).not.toContain('blocchi');
	});

	it('leaves the amount open when the count is not a number', () => {
		const prompt = buildPrompt({ ...base, count: 'tante' });

		expect(prompt).not.toContain('Genera esattamente');
		expect(prompt).toContain('in un file "Imparare - Capitolo 2.md"');
	});

	it('splits long quizzes into cumulative rounds ending in a FINALE file', () => {
		const prompt = buildPrompt({ ...base, count: '50' });

		expect(prompt).toContain('Procedi a blocchi da 15 domande, ognuno cumulativo:');
		expect(prompt).toContain('"Imparare - Capitolo 2 - 1.md" con le prime 15 domande');
		expect(prompt).toContain(
			'"Imparare - Capitolo 2 - FINALE.md" e contiene tutte e 50 le domande'
		);
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
});
