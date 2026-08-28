import type { BackupFile } from './types';

function stamp(date: Date): string {
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, '0'),
		String(date.getDate()).padStart(2, '0')
	].join('-');
}

/** Saves the whole library to a .json the user can keep or move to another browser. */
export function downloadBackup(backup: BackupFile) {
	const blob = new Blob([JSON.stringify(backup, null, '\t')], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.href = url;
	link.download = `quizzo-backup-${stamp(new Date())}.json`;
	link.click();

	URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<unknown> {
	try {
		return JSON.parse(await file.text());
	} catch {
		throw new Error('Il file non è un JSON valido.');
	}
}
