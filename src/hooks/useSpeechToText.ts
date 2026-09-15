import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n";
import {
  appendUniqueTranscript,
  getSpeechRecognitionConstructor,
  isInsecureContext,
  isSpeechRecognitionSupported,
  speechLocaleToBcp47,
  type AppSpeechRecognition,
} from "@/lib/speechRecognition";

export type SpeechToTextError =
  | "unsupported"
  | "insecure"
  | "permission"
  | "network"
  | "generic";

const activeStops = new Set<() => void>();

export function stopAllSpeechToText() {
  for (const stop of [...activeStops]) {
    stop();
  }
}

function mapRecognitionError(code: string): SpeechToTextError | null {
  if (code === "no-speech" || code === "aborted") return null;
  if (code === "not-allowed" || code === "service-not-allowed") return "permission";
  if (code === "network") return "network";
  return "generic";
}

export function useSpeechToText({
  value,
  onChange,
  locale,
  enabled = true,
  onError,
}: {
  value: string;
  onChange: (next: string) => void;
  locale: Locale;
  enabled?: boolean;
  onError?: (error: SpeechToTextError) => void;
}) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => isSpeechRecognitionSupported());

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const localeRef = useRef(locale);
  const enabledRef = useRef(enabled);
  const onErrorRef = useRef(onError);
  const wantListenRef = useRef(false);
  const committedRef = useRef("");
  const sessionPrefixRef = useRef("");
  const recognitionRef = useRef<AppSpeechRecognition | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const engineGenerationRef = useRef(0);

  valueRef.current = value;
  onChangeRef.current = onChange;
  enabledRef.current = enabled;
  onErrorRef.current = onError;

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current != null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const detachRecognition = useCallback((recognition: AppSpeechRecognition | null) => {
    if (!recognition) return;
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
  }, []);

  const haltRef = useRef<() => void>(() => undefined);
  const stableHalt = useCallback(() => {
    haltRef.current();
  }, []);

  const halt = useCallback(() => {
    clearRestartTimer();
    wantListenRef.current = false;
    engineGenerationRef.current += 1;
    activeStops.delete(stableHalt);
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    detachRecognition(recognition);
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        try {
          recognition.stop();
        } catch {
          /* already stopped */
        }
      }
    }
    setListening(false);
  }, [clearRestartTimer, detachRecognition, stableHalt]);

  haltRef.current = halt;

  const startEngine = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor || !wantListenRef.current || !enabledRef.current) return;

    const generation = ++engineGenerationRef.current;
    const previous = recognitionRef.current;
    recognitionRef.current = null;
    detachRecognition(previous);

    sessionPrefixRef.current = committedRef.current;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = speechLocaleToBcp47(localeRef.current);
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (generation !== engineGenerationRef.current) return;
      setListening(true);
    };

    recognition.onresult = (event) => {
      if (generation !== engineGenerationRef.current) return;

      let finals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finals += transcript;
        else interim += transcript;
      }

      committedRef.current = appendUniqueTranscript(sessionPrefixRef.current, finals);
      onChangeRef.current(
        interim
          ? appendUniqueTranscript(committedRef.current, interim)
          : committedRef.current,
      );
    };

    recognition.onerror = (event) => {
      if (generation !== engineGenerationRef.current) return;
      const mapped = mapRecognitionError(event.error);
      if (!mapped) return;
      wantListenRef.current = false;
      onErrorRef.current?.(mapped);
    };

    recognition.onend = () => {
      if (generation !== engineGenerationRef.current) return;
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      detachRecognition(recognition);

      if (!wantListenRef.current || !enabledRef.current) {
        activeStops.delete(stableHalt);
        setListening(false);
        return;
      }

      // Keep only finalized text so a new session cannot prepend the same interim words.
      if (valueRef.current.trim() !== committedRef.current.trim()) {
        onChangeRef.current(committedRef.current);
      }

      restartTimerRef.current = window.setTimeout(() => {
        if (!wantListenRef.current || !enabledRef.current) return;
        if (generation !== engineGenerationRef.current) return;
        startEngine();
      }, 280);
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      detachRecognition(recognition);
      if (generation === engineGenerationRef.current) {
        wantListenRef.current = false;
        activeStops.delete(stableHalt);
        setListening(false);
      }
    }
  }, [detachRecognition, stableHalt]);

  const begin = useCallback((): SpeechToTextError | null => {
    if (!enabledRef.current) return "generic";
    if (isInsecureContext()) return "insecure";
    if (!getSpeechRecognitionConstructor()) return "unsupported";

    for (const other of [...activeStops]) {
      if (other !== stableHalt) other();
    }
    activeStops.add(stableHalt);
    clearRestartTimer();

    wantListenRef.current = true;
    committedRef.current = valueRef.current.trimEnd();
    sessionPrefixRef.current = committedRef.current;
    startEngine();
    if (!wantListenRef.current) return "generic";
    return null;
  }, [clearRestartTimer, stableHalt, startEngine]);

  const toggle = useCallback((): SpeechToTextError | null => {
    if (wantListenRef.current) {
      halt();
      return null;
    }
    if (isInsecureContext()) return "insecure";
    if (!supported) return "unsupported";
    return begin();
  }, [begin, halt, supported]);

  useEffect(() => {
    if (!enabled) halt();
  }, [enabled, halt]);

  useEffect(() => {
    const previous = localeRef.current;
    localeRef.current = locale;
    if (previous === locale) return;
    const recognition = recognitionRef.current;
    if (!recognition || !wantListenRef.current) return;
    try {
      recognition.stop();
    } catch {
      /* onend starts a fresh engine with the new language */
    }
  }, [locale]);

  useEffect(
    () => () => {
      halt();
    },
    [halt],
  );

  return {
    listening,
    supported,
    toggle,
    stop: halt,
  };
}
