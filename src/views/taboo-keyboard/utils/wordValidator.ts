import { WORDLIST } from "./wordlist";

const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

// In-memory cache for current session
const sessionCache = new Map<string, boolean>();

// LRU cache in sessionStorage (max 500 words)
const LRU_KEY = "taboo_word_cache";
const MAX_LRU_SIZE = 500;

interface LRUEntry {
  valid: boolean;
  timestamp: number;
}

function getLRUCache(): Record<string, LRUEntry> {
  try {
    const data = sessionStorage.getItem(LRU_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setLRUCache(cache: Record<string, LRUEntry>): void {
  try {
    const entries = Object.entries(cache);
    if (entries.length > MAX_LRU_SIZE) {
      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toKeep = sorted.slice(-MAX_LRU_SIZE);
      const newCache: Record<string, LRUEntry> = {};
      toKeep.forEach(([key, value]) => {
        newCache[key] = value;
      });
      sessionStorage.setItem(LRU_KEY, JSON.stringify(newCache));
    } else {
      sessionStorage.setItem(LRU_KEY, JSON.stringify(cache));
    }
  } catch {
    // sessionStorage might be full or disabled
  }
}

function getCachedWord(word: string): boolean | null {
  const lower = word.toLowerCase();

  if (sessionCache.has(lower)) {
    return sessionCache.get(lower) ?? null;
  }

  const lru = getLRUCache();
  if (lru[lower]) {
    lru[lower].timestamp = Date.now();
    setLRUCache(lru);
    sessionCache.set(lower, lru[lower].valid);
    return lru[lower].valid;
  }

  return null;
}

function setCachedWord(word: string, valid: boolean): void {
  const lower = word.toLowerCase();
  sessionCache.set(lower, valid);
  const lru = getLRUCache();
  lru[lower] = { valid, timestamp: Date.now() };
  setLRUCache(lru);
}

function isInFallbackList(word: string): boolean {
  return WORDLIST.includes(word.toLowerCase());
}

interface ValidationResult {
  valid: boolean;
  reason: string;
  fromCache?: boolean;
  fallback?: boolean;
  fallbackMessage?: string;
}

/**
 * Validate a word using Dictionary API
 */
async function validateWithAPI(word: string): Promise<ValidationResult> {
  const lower = word.toLowerCase();

  if (isInFallbackList(lower)) {
    return { valid: true, reason: "", fromCache: false, fallback: true, fallbackMessage: "" };
  }

  const cached = getCachedWord(lower);
  if (cached !== null) {
    return { valid: cached, reason: cached ? "" : "Not a valid English word", fromCache: true };
  }

  try {
    const response = await fetch(`${API_URL}${lower}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCachedWord(lower, true);
        return { valid: true, reason: "", fromCache: false };
      }
    }

    setCachedWord(lower, false);
    return { valid: false, reason: "Not a valid English word", fromCache: false };
  } catch {
    // API unavailable, check fallback
    if (isInFallbackList(lower)) {
      return { valid: true, reason: "", fromCache: false, fallback: true };
    }
    return {
      valid: false,
      reason: "Not found in word list (API unavailable)",
      fromCache: false,
      fallback: true,
    };
  }
}

/**
 * Quick validation checks before API call
 */
function quickValidate(
  word: string,
  bannedLetters: string[],
  acceptedWords: string[],
): ValidationResult | null {
  if (!/^[a-zA-Z]+$/.test(word)) {
    return { valid: false, reason: "Only letters A-Z allowed (no spaces or special characters)" };
  }

  if (word.length < 2) {
    return { valid: false, reason: "Word must be at least 2 letters" };
  }

  const upperWord = word.toUpperCase();
  for (const letter of bannedLetters) {
    if (upperWord.includes(letter)) {
      return { valid: false, reason: `Contains banned letter "${letter}"` };
    }
  }

  const lower = word.toLowerCase();
  if (acceptedWords.includes(lower)) {
    return { valid: false, reason: "Word already submitted" };
  }

  return null;
}

/**
 * Full word validation pipeline
 */
export async function validateWord(
  word: string,
  bannedLetters: string[],
  acceptedWords: string[],
): Promise<ValidationResult> {
  const quickResult = quickValidate(word, bannedLetters, acceptedWords);
  if (quickResult) {
    return quickResult;
  }

  const apiResult = await validateWithAPI(word);
  return {
    valid: apiResult.valid,
    reason: apiResult.reason,
    fromCache: apiResult.fromCache,
    fallback: apiResult.fallback,
    fallbackMessage: apiResult.fallbackMessage,
  };
}

/**
 * Synchronous pre-check (for immediate UI feedback)
 */
export function preValidateWord(
  word: string,
  bannedLetters: string[],
  acceptedWords: string[],
): ValidationResult | null {
  return quickValidate(word, bannedLetters, acceptedWords);
}
