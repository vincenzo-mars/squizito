export type Badge = {
	id: string;
	emoji: string;
	label: string;
	description: string;
};

export type BadgeInput = {
	correct: number;
	total: number;
	bestStreak: number;
	/** A streak of at least 3 built after having already answered something wrong. */
	comeback: boolean;
	firstAttempt: boolean;
	newRecord: boolean;
};

const CATALOG: Record<string, Omit<Badge, 'id'>> = {
	perfect: { emoji: '💯', label: 'Perfetto', description: 'Nessun errore in tutto il test.' },
	streak5: { emoji: '🔥', label: 'Serie da 5', description: 'Cinque risposte giuste di fila.' },
	streak10: { emoji: '⚡', label: 'Serie da 10', description: 'Dieci risposte giuste di fila.' },
	comeback: { emoji: '🛠️', label: 'Rimonta', description: 'Tre giuste di fila dopo un errore.' },
	first: { emoji: '🌱', label: 'Primo tentativo', description: 'Prima volta su questo quiz.' },
	record: { emoji: '🏆', label: 'Nuovo record', description: 'Miglior punteggio su questo quiz.' },
	half: { emoji: '👍', label: 'Sufficienza', description: 'Almeno il 60% di risposte giuste.' }
};

function badge(id: string): Badge {
	return { id, ...CATALOG[id] };
}

export function awardBadges(input: BadgeInput): Badge[] {
	const ids: string[] = [];

	if (input.total > 0 && input.correct === input.total) ids.push('perfect');
	else if (input.correct / Math.max(input.total, 1) >= 0.6) ids.push('half');

	if (input.bestStreak >= 10) ids.push('streak10');
	else if (input.bestStreak >= 5) ids.push('streak5');

	if (input.comeback) ids.push('comeback');
	if (input.newRecord) ids.push('record');
	if (input.firstAttempt) ids.push('first');

	return ids.map(badge);
}

export function badgeById(id: string): Badge | undefined {
	return CATALOG[id] ? badge(id) : undefined;
}
