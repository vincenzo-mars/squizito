import { describe, expect, it } from 'vitest';
import { BASE_POINTS, maxScore, multiplierFor, pointsFor } from './scoring';

describe('multiplierFor', () => {
	it('parte da 1 e sale con la serie', () => {
		expect(multiplierFor(0)).toBe(1);
		expect(multiplierFor(1)).toBe(1);
		expect(multiplierFor(2)).toBe(1.2);
		expect(multiplierFor(4)).toBe(1.5);
		expect(multiplierFor(5)).toBe(2);
	});

	it('si ferma al massimo anche con serie lunghissime', () => {
		expect(multiplierFor(50)).toBe(2);
	});

	it('non scende mai sotto 1', () => {
		expect(multiplierFor(-3)).toBe(1);
	});
});

describe('pointsFor', () => {
	it('la prima risposta giusta vale i punti base', () => {
		expect(pointsFor(0)).toBe(BASE_POINTS);
	});

	it('cresce con la serie e si stabilizza al doppio', () => {
		expect([0, 1, 2, 3, 4, 5, 9].map(pointsFor)).toEqual([100, 120, 120, 150, 200, 200, 200]);
	});

	it('non decresce mai al crescere della serie', () => {
		const values = Array.from({ length: 12 }, (_, i) => pointsFor(i));
		for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
	});

	it('resta un multiplo di 5, così il punteggio non ha decimali', () => {
		for (let i = 0; i < 12; i++) expect(pointsFor(i) % 5).toBe(0);
	});
});

describe('maxScore', () => {
	it('è zero su un quiz vuoto', () => {
		expect(maxScore(0)).toBe(0);
	});

	it('somma la scala dei moltiplicatori', () => {
		expect(maxScore(1)).toBe(100);
		expect(maxScore(5)).toBe(690);
	});

	it('non è mai inferiore al punteggio raggiungibile davvero', () => {
		let running = 0;
		for (let i = 0; i < 20; i++) running += pointsFor(i);
		expect(maxScore(20)).toBe(running);
	});
});
