"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal Web Speech API typings (not in lib.dom for all TS versions).
type SRAlternative = { transcript: string };
type SRResult = { isFinal: boolean; 0: SRAlternative; length: number };
type SREvent = { resultIndex: number; results: { length: number; [i: number]: SRResult } };
type SRErrorEvent = { error: string };
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
}

function getSR(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

export type MicError = "denied" | "unsupported" | "no-speech" | null;

/** Voice input. Audio is processed by the browser; nothing is stored by the app. */
export function useSpeechInput(lang: string, onFinal?: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<MicError>(null);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const supported = typeof window !== "undefined" && !!getSR();

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const SR = getSR();
    if (!SR) {
      setError("unsupported");
      return;
    }
    stopSpeaking();
    rec.current?.abort();
    const r = new SR();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    finalRef.current = "";
    setTranscript("");
    setError(null);
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalRef.current += res[0].transcript;
        else interim += res[0].transcript;
      }
      setTranscript((finalRef.current + " " + interim).trim());
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("denied");
      else if (e.error === "no-speech") setError("no-speech");
    };
    r.onend = () => {
      setListening(false);
      const text = finalRef.current.trim();
      if (text) onFinalRef.current?.(text);
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [lang]);

  useEffect(() => () => rec.current?.abort(), []);

  return { supported, listening, transcript, setTranscript, error, start, stop };
}

/** Ask for mic permission up front (onboarding M04). */
export async function requestMic(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, lang: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.95;
  const voice = synth.getVoices().find((v) => v.lang === lang) ?? synth.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (voice) u.voice = voice;
  u.onend = () => {
    if (currentUtterance === u) currentUtterance = null;
    onEnd?.();
  };
  currentUtterance = u;
  synth.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  currentUtterance = null;
}

/** Listen button state hook. */
export function useSpeaker() {
  const [speaking, setSpeaking] = useState(false);
  const toggle = useCallback(
    (text: string, lang: string) => {
      if (speaking) {
        stopSpeaking();
        setSpeaking(false);
        return;
      }
      setSpeaking(true);
      speak(text, lang, () => setSpeaking(false));
    },
    [speaking],
  );
  useEffect(() => () => stopSpeaking(), []);
  return { speaking, toggle };
}
