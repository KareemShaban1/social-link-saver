import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n";
import {
  getSpeechRecognitionConstructor,
  isInsecureContext,
  isSpeechRecognitionSupported,
  joinSpeechParts,
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
  const prefixRef = useRef("");
  const recognitionRef = useRef<AppSpeechRecognition | null>(null);
  const restartTimerRef = useRef<number | null>(null);

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

  const haltRef = useRef<() => void>(() => undefined);
  const stableHalt = useCallback(() => {
    haltRef.current();
  }, []);

  const halt = useCallback(() => {
    clearRestartTimer();
    wantListenRef.current = false;
    activeStops.delete(stableHalt);
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
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
  }, [clearRestartTimer, stableHalt]);

  haltRef.current = halt;

  const begin = useCallback((): SpeechToTextError | null => {
    if (!enabledRef.current) return "generic";
    if (isInsecureContext()) return "insecure";
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return "unsupported";

    for (const other of [...activeStops]) {
      if (other !== stableHalt) other();
    }
    activeStops.add(stableHalt);
    clearRestartTimer();

    wantListenRef.current = true;
    prefixRef.current = valueRef.current.trimEnd();

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = speechLocaleToBcp47(localeRef.current);
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let finals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finals += transcript;
        else interim += transcript;
      }
      onChangeRef.current(joinSpeechParts(prefixRef.current, finals, interim));
    };

    recognition.onerror = (event) => {
      const mapped = mapRecognitionError(event.error);
      if (!mapped) return;
      wantListenRef.current = false;
      onErrorRef.current?.(mapped);
    };

    recognition.onend = () => {
      if (!wantListenRef.current || !enabledRef.current) {
        recognitionRef.current = null;
        activeStops.delete(stableHalt);
        setListening(false);
        return;
      }

      prefixRef.current = valueRef.current.trimEnd();
      recognition.lang = speechLocaleToBcp47(localeRef.current);
      restartTimerRef.current = window.setTimeout(() => {
        if (!wantListenRef.current || !enabledRef.current) return;
        try {
          recognition.start();
        } catch {
          wantListenRef.current = false;
          recognitionRef.current = null;
          activeStops.delete(stableHalt);
          setListening(false);
        }
      }, 160);
    };

    try {
      recognition.start();
    } catch {
      wantListenRef.current = false;
      recognitionRef.current = null;
      activeStops.delete(stableHalt);
      return "generic";
    }

    return null;
  }, [clearRestartTimer, stableHalt]);

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
    recognition.lang = speechLocaleToBcp47(locale);
    try {
      recognition.stop();
    } catch {
      /* onend restarts with the new language */
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
