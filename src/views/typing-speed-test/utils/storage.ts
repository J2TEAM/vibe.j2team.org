export interface TypingRecord {
    id: string;
    date: number;
    wpm: number;
    cpm: number;
    accuracy: number;
    duration: number;
    mode: string;
}

const PROFILE_KEY = 'typing_speed_profile';
const HISTORY_PREFIX = 'typing_speed_history_';
const HISTORY_MAX = 100;

/**
 * Get the current profile name from LocalStorage
 */
export function getSavedProfile(): string {
    return localStorage.getItem(PROFILE_KEY) || '';
}

/**
 * Save the profile name to LocalStorage
 */
export function saveProfile(name: string): void {
    localStorage.setItem(PROFILE_KEY, name.trim());
}

/**
 * Load the history records for a specific profile
 */
export function getHistory(profileName: string): TypingRecord[] {
    if (!profileName) return [];
    const key = `${HISTORY_PREFIX}${profileName.trim()}`;
    const data = localStorage.getItem(key);
    try {
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Add a new record to the profile's history (capped at HISTORY_MAX entries)
 */
export function addHistoryRecord(profileName: string, record: Omit<TypingRecord, 'id' | 'date'>): void {
    if (!profileName) return;
    const history = getHistory(profileName);
    const newRecord: TypingRecord = {
        ...record,
        id: (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 9),
        date: Date.now()
    };

    history.unshift(newRecord); // Add to beginning
    // Cap history to prevent LocalStorage quota exhaustion
    const trimmed = history.slice(0, HISTORY_MAX);
    const key = `${HISTORY_PREFIX}${profileName.trim()}`;
    localStorage.setItem(key, JSON.stringify(trimmed));
}

/**
 * Remove a single history record by its ID
 */
export function removeHistoryRecord(profileName: string, id: string): void {
    if (!profileName) return;
    let history = getHistory(profileName);
    history = history.filter(record => record.id !== id);
    const key = `${HISTORY_PREFIX}${profileName.trim()}`;
    localStorage.setItem(key, JSON.stringify(history));
}

/**
 * Clear all history for a specific profile
 */
export function clearHistory(profileName: string): void {
    if (!profileName) return;
    const key = `${HISTORY_PREFIX}${profileName.trim()}`;
    localStorage.removeItem(key);
}
