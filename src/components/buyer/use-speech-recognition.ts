"use client";

// Reusable Web Speech API hook. Shared by the search bar (one-shot) and the
// concierge drawer (push-to-talk per turn). The DOM lib doesn't ship these
// types, so we declare a minimal surface.

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEvent = {
  results: { length: number; 0: SpeechRecognitionResult; [k: number]: SpeechRecognitionResult };
};
type SpeechRecognitionErrorEvent = { error: string };
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type UseSpeechRecognitionOptions = {
  continuous?: boolean;
  lang?: string;
  onFinal?: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
  onError?: (message: string) => void;
};

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}) {
  const { continuous = false, lang = "en-US", onFinal, onInterim, onError } = opts;
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  // Keep latest callbacks without re-creating the recognition instance.
  const cbs = useRef({ onFinal, onInterim, onError });
  cbs.current = { onFinal, onInterim, onError };

  useEffect(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const res = e.results[e.results.length - 1] ?? e.results[0];
      const transcript = res?.[0]?.transcript ?? "";
      if (!transcript) return;
      if (res.isFinal) cbs.current.onFinal?.(transcript.trim());
      else cbs.current.onInterim?.(transcript);
    };
    rec.onerror = (e) => {
      setListening(false);
      const message =
        e.error === "not-allowed"
          ? "Microphone access was blocked."
          : e.error === "no-speech"
            ? "Didn't catch that — try again."
            : "Voice input error.";
      cbs.current.onError?.(message);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    };
  }, [continuous, lang]);

  const start = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.start();
      setListening(true);
    } catch {
      // start() throws if already started — ignore.
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, start, stop, toggle };
}
