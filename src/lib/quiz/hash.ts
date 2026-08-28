/**
 * Stable, short fingerprint of a quiz source. Used as the library key, so reloading the same
 * paste reopens the existing quiz with its history instead of creating a duplicate.
 */
export function hashSource(source: string): string {
	const normalized = source.replace(/\r\n/g, '\n').trim();
	let h1 = 0x811c9dc5;
	let h2 = 0x01000193;

	for (let i = 0; i < normalized.length; i++) {
		const code = normalized.charCodeAt(i);
		h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
		h2 = Math.imul(h2 + code, 0x85ebca6b) >>> 0;
	}

	return h1.toString(36).padStart(7, '0') + h2.toString(36).padStart(7, '0');
}
