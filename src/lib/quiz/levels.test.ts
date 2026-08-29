import { describe, expect, it } from 'vitest';
import { levelFor, nextLevel, progressPercent } from './levels';

describe('levelFor', () => {
	it('returns level 1 at 0 XP', () => {
		expect(levelFor(0).number).toBe(1);
	});

	it('returns level 1 at 499 XP', () => {
		expect(levelFor(499).number).toBe(1);
	});

	it('returns level 2 at exactly 500 XP', () => {
		expect(levelFor(500).number).toBe(2);
	});

	it('returns level 5 at exactly 7000 XP', () => {
		expect(levelFor(7000).number).toBe(5);
	});

	it('returns level 10 at exactly 75000 XP', () => {
		expect(levelFor(75000).number).toBe(10);
	});

	it('caps at level 10 above 75000 XP', () => {
		expect(levelFor(999999).number).toBe(10);
	});

	it('returns correct name for level 1', () => {
		expect(levelFor(0).name).toBe('Zucchina');
	});

	it('returns correct name for level 10', () => {
		expect(levelFor(75000).name).toBe('Kinder Cereali');
	});
});

describe('nextLevel', () => {
	it('returns level 2 when at level 1', () => {
		expect(nextLevel(0)?.number).toBe(2);
	});

	it('returns null at level 10', () => {
		expect(nextLevel(75000)).toBeNull();
	});

	it('returns null above level 10', () => {
		expect(nextLevel(100000)).toBeNull();
	});
});

describe('progressPercent', () => {
	it('returns 0 at the start of level 1', () => {
		expect(progressPercent(0)).toBe(0);
	});

	it('returns 100 at level 10 max', () => {
		expect(progressPercent(75000)).toBe(100);
	});

	it('returns 100 above level 10 max', () => {
		expect(progressPercent(99999)).toBe(100);
	});

	it('returns 50 halfway through level 1 (0–500)', () => {
		expect(progressPercent(250)).toBe(50);
	});

	it('returns 0 at the exact start of a new level', () => {
		// level 2 starts at 500, level 3 at 1500 → 500 XP range
		expect(progressPercent(500)).toBe(0);
	});
});
