"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Desktop Chrome doesn't auto-convert spoken punctuation like mobile does
function convertPunctuation(text: string): string {
  return text
    .replace(/\bperiod\b/gi, ".")
    .replace(/\bcomma\b/gi, ",")
    .replace(/\bquestion mark\b/gi, "?")
    .replace(/\bexclamation mark\b/gi, "!")
    .replace(/\bexclamation point\b/gi, "!")
    .replace(/\bcolon\b/gi, ":")
    .replace(/\bsemicolon\b/gi, ";")
    .replace(/\bnew line\b/gi, "\n")
    .replace(/\bnew paragraph\b/gi, "\n\n")
    .replace(/\s+([.,?!:;])/g, "$1");
}

function getRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition as
      | (new () => SpeechRecognition)
      | undefined ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition as
      | (new () => SpeechRecognition)
      | undefined ??
    null
  );
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const accumulatedFinalsRef = useRef("");
  const sessionFinalsRef = useRef("");
  const isMobileRef = useRef(false);

  useEffect(() => {
    setIsSupported(getRecognitionConstructor() !== null);
    isMobileRef.current = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);

  const launchSession = useCallback(() => {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) return;

    sessionFinalsRef.current = "";
    const mobile = isMobileRef.current;

    const recognition = new Ctor();
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Only use continuous mode on desktop — it causes word duplication on mobile
    if (!mobile) {
      recognition.continuous = true;
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let sessionFinals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          sessionFinals += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      sessionFinalsRef.current = sessionFinals;
      const raw = accumulatedFinalsRef.current + sessionFinals + interim;
      setTranscript(mobile ? raw : convertPunctuation(raw));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      console.error("Speech recognition error:", event.error);
      shouldListenRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Accumulate finals from this session, ensuring space between sessions
      if (accumulatedFinalsRef.current && sessionFinalsRef.current && !accumulatedFinalsRef.current.endsWith(" ")) {
        accumulatedFinalsRef.current += " ";
      }
      accumulatedFinalsRef.current += sessionFinalsRef.current;
      sessionFinalsRef.current = "";

      if (shouldListenRef.current) {
        if (mobile) {
          // Mobile: restart after a short delay to let the browser
          // clean up the previous session. Without continuous mode,
          // each session captures one utterance cleanly — no overlap.
          setTimeout(() => {
            if (shouldListenRef.current) launchSession();
          }, 250);
        } else {
          launchSession();
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const start = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    accumulatedFinalsRef.current = "";
    sessionFinalsRef.current = "";
    shouldListenRef.current = true;
    setIsListening(true);
    setTranscript("");
    launchSession();
  }, [launchSession]);

  return { isListening, isSupported, transcript, start, stop };
}
