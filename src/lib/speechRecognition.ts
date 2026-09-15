import type { Locale } from "@/i18n";

export const SPEECH_LOCALE_STORAGE_KEY = "socialsaver-speech-locale";

type SpeechRecognitionConstructor = new () => AppSpeechRecognition;

export interface AppSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: AppSpeechRecognitionEvent) => void) | null;
}

export interface AppSpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

function getWindowWithSpeech(): Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
} {
  return window;
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = getWindowWithSpeech();
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!getSpeechRecognitionConstructor() && window.isSecureContext;
}

export function isInsecureContext(): boolean {
  return typeof window !== "undefined" && !window.isSecureContext;
}

export function speechLocaleToBcp47(locale: Locale): string {
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  const navLower = nav.toLowerCase();
  if (locale === "ar") {
    return navLower.startsWith("ar") ? nav : "ar-SA";
  }
  return navLower.startsWith("en") ? nav : "en-US";
}

export function readStoredSpeechLocale(fallback: Locale): Locale {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(SPEECH_LOCALE_STORAGE_KEY);
  return stored === "ar" || stored === "en" ? stored : fallback;
}

export function persistSpeechLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SPEECH_LOCALE_STORAGE_KEY, locale);
}

export function joinSpeechParts(prefix: string, finalText: string, interimText: string): string {
  return appendUniqueTranscript(appendUniqueTranscript(prefix, finalText), interimText);
}

function normalizeSpeech(text: string): string {
  return text
    .replace(/[.,!?;:"'()[\]{}]/g, "")
    .replace(/[،؛؟«»]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function collapseRepeatedPhrase(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 4) return text.trim();
  const half = Math.floor(words.length / 2);
  if (words.length === half * 2) {
    const first = normalizeSpeech(words.slice(0, half).join(" "));
    const second = normalizeSpeech(words.slice(half).join(" "));
    if (first && first === second) return words.slice(0, half).join(" ");
  }
  return text.trim();
}

/** Append newly recognized speech without duplicating words Chrome already committed. */
export function appendUniqueTranscript(existing: string, incoming: string): string {
  const left = existing.trimEnd();
  const right = collapseRepeatedPhrase(incoming.trim());
  if (!right) return left;
  if (!left) return right;

  const leftNorm = normalizeSpeech(left);
  const rightNorm = normalizeSpeech(right);
  if (!rightNorm || leftNorm.endsWith(rightNorm)) return left;

  // Incoming is a longer version of the same utterance ("hello" → "hello world").
  if (rightNorm.startsWith(leftNorm)) {
    const restNorm = rightNorm.slice(leftNorm.length).trim();
    if (!restNorm || !restNorm.startsWith(leftNorm)) return right;
  }

  const leftWords = left.split(/\s+/).filter(Boolean);
  const rightWords = right.split(/\s+/).filter(Boolean);
  const maxOverlap = Math.min(leftWords.length, rightWords.length);

  for (let n = maxOverlap; n > 0; n--) {
    const suffix = normalizeSpeech(leftWords.slice(-n).join(" "));
    const prefix = normalizeSpeech(rightWords.slice(0, n).join(" "));
    if (suffix && suffix === prefix) {
      return [...leftWords, ...rightWords.slice(n)].join(" ");
    }
  }

  return `${left} ${right}`;
}

