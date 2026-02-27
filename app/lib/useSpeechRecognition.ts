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
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Rebuild from ALL results each time to avoid double-counting
      let finals = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finals += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finals + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;
      console.error("Speech recognition error:", event.error);
      shouldListenRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Don't auto-restart — mobile browsers re-capture overlapping audio
      // on restart, causing word duplication. User can tap Dictate again.
      shouldListenRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    setIsListening(true);
    setTranscript("");
    recognition.start();
  }, []);

  return { isListening, isSupported, transcript, start, stop };
}
