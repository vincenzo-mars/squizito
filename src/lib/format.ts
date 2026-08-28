const DATE = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDate(epoch: number): string {
	return DATE.format(new Date(epoch));
}

export function formatDuration(ms: number): string {
	const total = Math.round(ms / 1000);
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function percentage(correct: number, total: number): number {
	if (!total) return 0;
	return Math.round((correct / total) * 100);
}

export const LETTERS = 'ABCDEFGHIJ';
