import { describe, expect, it } from 'vitest';
import { DEMO_SOURCE } from './demo';
import { parseQuiz } from './parser';

describe('DEMO_SOURCE', () => {
	it('si carica senza errori ed è quello che una libreria vuota mostra per prima', () => {
		const result = parseQuiz(DEMO_SOURCE);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.quiz.questions).toHaveLength(5);
		expect(result.quiz.questions[1].multiple).toBe(true);
		expect(result.quiz.questions[1].options.filter((o) => o.correct).map((o) => o.text)).toEqual([
			'Giove',
			'Saturno'
		]);
	});
});
