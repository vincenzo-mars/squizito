import { describe, expect, it } from 'vitest';
import {
	applyAnswer,
	createState,
	DAY,
	masteryLevel,
	masteryPercent,
	priority,
	questionKey
} from './schedule';
import type { Question } from '$lib/quiz/types';

const question: Question = {
	text: 'Qual è la capitale?',
	kind: 'choice',
	options: [
		{ text: 'Roma', correct: true },
		{ text: 'Milano', correct: false }
	],
	pairs: [],
	multiple: false
};

const NOW = Date.UTC(2026, 7, 29, 10, 0, 0);

describe('questionKey', () => {
	it('ignora maiuscole, punteggiatura e spazi doppi', () => {
		expect(questionKey('Qual è  la Capitale?')).toBe(questionKey('qual è la capitale'));
	});

	it('distingue domande diverse', () => {
		expect(questionKey('Prima domanda')).not.toBe(questionKey('Seconda domanda'));
	});
});

describe('applyAnswer', () => {
	it('promuove a un giorno alla prima risposta giusta', () => {
		const state = applyAnswer(createState(question, NOW), true, NOW);
		expect(state.reps).toBe(1);
		expect(state.interval).toBe(1);
		expect(state.due).toBe(NOW + DAY);
	});

	it('sale a tre giorni alla seconda giusta', () => {
		const first = applyAnswer(createState(question, NOW), true, NOW);
		const second = applyAnswer(first, true, first.due);
		expect(second.interval).toBe(3);
	});

	it('dalla terza in poi moltiplica per l ease', () => {
		let state = applyAnswer(createState(question, NOW), true, NOW);
		state = applyAnswer(state, true, state.due);
		const third = applyAnswer(state, true, state.due);
		expect(third.interval).toBeGreaterThan(3);
		expect(third.ease).toBeCloseTo(2.8, 5);
	});

	it('un errore riporta la domanda a oggi e abbassa l ease', () => {
		const promoted = applyAnswer(createState(question, NOW), true, NOW);
		const failed = applyAnswer(promoted, false, promoted.due);
		expect(failed.reps).toBe(0);
		expect(failed.interval).toBe(0);
		expect(failed.due).toBe(promoted.due);
		expect(failed.lapses).toBe(1);
		expect(failed.ease).toBeLessThan(promoted.ease);
	});

	it('conta ogni ripetizione, anche due volte lo stesso giorno', () => {
		const first = applyAnswer(createState(question, NOW), true, NOW);
		const again = applyAnswer(first, true, NOW + 60_000);
		expect(again.seen).toBe(2);
		expect(again.correct).toBe(2);
	});

	it('non allunga l intervallo se rispondi in anticipo', () => {
		const first = applyAnswer(createState(question, NOW), true, NOW);
		const again = applyAnswer(first, true, NOW + 60_000);
		expect(again.interval).toBe(first.interval);
		expect(again.due).toBe(first.due);
	});

	it('registra comunque l errore fatto in anticipo', () => {
		const first = applyAnswer(createState(question, NOW), true, NOW);
		const failed = applyAnswer(first, false, NOW + 60_000);
		expect(failed.due).toBe(NOW + 60_000);
		expect(failed.reps).toBe(0);
	});

	it('non scende mai sotto l ease minimo', () => {
		let state = createState(question, NOW);
		for (let i = 0; i < 20; i++) state = applyAnswer(state, false, NOW);
		expect(state.ease).toBeCloseTo(1.3, 5);
	});
});

describe('masteryLevel', () => {
	it('è zero per una domanda mai vista o appena sbagliata', () => {
		expect(masteryLevel(undefined)).toBe(0);
		expect(masteryLevel(createState(question, NOW))).toBe(0);
	});

	it('cresce con l intervallo', () => {
		const first = applyAnswer(createState(question, NOW), true, NOW);
		const second = applyAnswer(first, true, first.due);
		expect(masteryLevel(second)).toBeGreaterThan(masteryLevel(first));
	});

	it('non supera cinque', () => {
		let state = createState(question, NOW);
		let now = NOW;
		for (let i = 0; i < 10; i++) {
			state = applyAnswer(state, true, now);
			now = state.due;
		}
		expect(masteryLevel(state)).toBe(5);
	});
});

describe('masteryPercent', () => {
	it('è zero su una lista mai studiata', () => {
		expect(masteryPercent([undefined, undefined])).toBe(0);
	});
});

describe('priority', () => {
	it('mette davanti le domande mai viste rispetto a quelle consolidate', () => {
		let strong = createState(question, NOW);
		let now = NOW;
		for (let i = 0; i < 4; i++) {
			strong = applyAnswer(strong, true, now);
			now = strong.due;
		}
		expect(priority(undefined, NOW)).toBeGreaterThan(priority(strong, NOW));
	});

	it('mette davanti una domanda scaduta da tempo', () => {
		const fresh = applyAnswer(createState(question, NOW), true, NOW);
		const late = { ...fresh, due: NOW - 10 * DAY };
		expect(priority(late, NOW)).toBeGreaterThan(priority(fresh, NOW));
	});
});
