import { browser } from '$app/environment';

export const NAMESPACE = 'squizito:v1';
const LEGACY_NAMESPACE = 'quizzo:v1';

/** The app was called Quizzo before: carry over whatever the old keys still hold. */
function migrateLegacy() {
	if (!browser || migrated) return;
	migrated = true;
	try {
		for (const key of Object.keys(localStorage)) {
			if (!key.startsWith(`${LEGACY_NAMESPACE}:`)) continue;
			const renamed = `${NAMESPACE}:${key.slice(LEGACY_NAMESPACE.length + 1)}`;
			if (localStorage.getItem(renamed) === null) {
				localStorage.setItem(renamed, localStorage.getItem(key) ?? '');
			}
			localStorage.removeItem(key);
		}
	} catch {
		// Storage unavailable: nothing to migrate, the app starts empty.
	}
}

let migrated = false;

export class StorageFullError extends Error {
	constructor() {
		super('Lo spazio del browser è pieno: esporta un backup ed elimina qualche quiz.');
		this.name = 'StorageFullError';
	}
}

function isQuotaError(error: unknown): boolean {
	return (
		error instanceof DOMException &&
		(error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
	);
}

export function readJson<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	migrateLegacy();
	try {
		const raw = localStorage.getItem(`${NAMESPACE}:${key}`);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		// Corrupted or unreadable entry: start over rather than breaking the whole app.
		return fallback;
	}
}

export function writeJson(key: string, value: unknown): void {
	if (!browser) return;
	try {
		localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value));
	} catch (error) {
		if (isQuotaError(error)) throw new StorageFullError();
		throw error;
	}
}

export function readSession<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const raw = sessionStorage.getItem(`${NAMESPACE}:${key}`);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function writeSession(key: string, value: unknown): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value));
	} catch (error) {
		if (isQuotaError(error)) throw new StorageFullError();
		throw error;
	}
}

export function clearSession(key: string): void {
	if (!browser) return;
	sessionStorage.removeItem(`${NAMESPACE}:${key}`);
}
