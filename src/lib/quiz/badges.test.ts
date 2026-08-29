import { describe, expect, it } from 'vitest';
import { awardBadges, badgeById, type BadgeInput } from './badges';

function ids(input: Partial<BadgeInput>): string[] {
	return awardBadges({
		correct: 0,
		total: 10,
		bestStreak: 0,
		comeback: false,
		firstAttempt: false,
		newRecord: false,
		...input
	}).map((badge) => badge.id);
}

describe('awardBadges', () => {
	it('dà Perfetto solo senza errori', () => {
		expect(ids({ correct: 10, total: 10 })).toContain('perfect');
		expect(ids({ correct: 9, total: 10 })).not.toContain('perfect');
	});

	it('dà Sufficienza dal 60% in su, ma non insieme a Perfetto', () => {
		expect(ids({ correct: 6, total: 10 })).toContain('half');
		expect(ids({ correct: 5, total: 10 })).not.toContain('half');
		expect(ids({ correct: 10, total: 10 })).not.toContain('half');
	});

	it('premia una sola soglia di serie, la più alta raggiunta', () => {
		expect(ids({ bestStreak: 4 })).not.toContain('streak5');
		expect(ids({ bestStreak: 5 })).toEqual(expect.arrayContaining(['streak5']));
		expect(ids({ bestStreak: 12 })).toContain('streak10');
		expect(ids({ bestStreak: 12 })).not.toContain('streak5');
	});

	it('riporta rimonta, primo tentativo e record quando indicati', () => {
		const list = ids({ comeback: true, firstAttempt: true, newRecord: true });
		expect(list).toEqual(expect.arrayContaining(['comeback', 'first', 'record']));
	});

	it('non inventa badge su un test andato male', () => {
		expect(ids({ correct: 1, total: 10 })).toEqual([]);
	});

	it('non si rompe su un quiz senza domande', () => {
		expect(ids({ correct: 0, total: 0 })).toEqual([]);
	});

	it('ogni badge ha etichetta, emoji e descrizione', () => {
		for (const id of ids({
			correct: 10,
			total: 10,
			bestStreak: 12,
			comeback: true,
			newRecord: true
		})) {
			const badge = badgeById(id);
			expect(badge?.label).toBeTruthy();
			expect(badge?.emoji).toBeTruthy();
			expect(badge?.description).toBeTruthy();
		}
	});

	it('badgeById ignora un id sconosciuto', () => {
		expect(badgeById('non-esiste')).toBeUndefined();
	});
});
