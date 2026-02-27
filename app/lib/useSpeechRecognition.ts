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
  const accumulatedFinalsRef = useRef("");
  const sessionFinalsRef = useRef("");

  useEffect(() => {
    setIsSupported(getRecognitionConstructor() !== null);
  }, []);

  const launchSession = useCallback(() => {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) return;

    sessionFinalsRef.current = "";

    const recognition = new Ctor();
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.lang = "en-US";

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
      setTranscript(accumulatedFinalsRef.current + sessionFinals + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      console.error("Speech recognition error:", event.error);
      shouldListenRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Accumulate finals from this session
      accumulatedFinalsRef.current += sessionFinalsRef.current;
      sessionFinalsRef.current = "";

      if (shouldListenRef.current) {
        // Auto-restart: keep listening until user explicitly stops
        launchSession();
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
