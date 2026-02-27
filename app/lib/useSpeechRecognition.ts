"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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

  useEffect(() => {
    setIsSupported(getRecognitionConstructor() !== null);
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) return;

    // Stop any existing instance
    recognitionRef.current?.stop();

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // committedPrefix: text from previous recognition sessions (after auto-restart)
    // sessionFinals: rebuilt from all final results in the current session each time
    let committedPrefix = "";
    let sessionFinals = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Rebuild from ALL results each time to avoid double-counting
      // (on mobile, resultIndex can be 0 on every event)
      sessionFinals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          sessionFinals += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(committedPrefix + sessionFinals + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "aborted" fires when we call stop() — not a real error
      if (event.error === "aborted") return;
      console.error("Speech recognition error:", event.error);
      shouldListenRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Browser may stop on its own (silence timeout, etc.)
      // Restart if we're still supposed to be listening
      if (shouldListenRef.current) {
        committedPrefix += sessionFinals;
        sessionFinals = "";
        try {
          recognition.start();
        } catch {
          shouldListenRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    setIsListening(true);
    setTranscript("");
    recognition.start();
  }, []);

  return { isListening, isSupported, transcript, start, stop };
}
