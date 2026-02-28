"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { transcribeAudio } from "./notesApi";

export function useGroqWhisper() {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    chunksRef.current = [];
    setTranscript("");
    setIsListening(true);
    setIsTranscribing(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        if (blob.size === 0) {
          setIsListening(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(blob);
          setTranscript(text);
        } catch (err) {
          console.error("Groq Whisper transcription failed:", err);
        } finally {
          setIsTranscribing(false);
          setIsListening(false);
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsListening(false);
    }
  }, []);

  return { isListening, isTranscribing, isSupported, transcript, start, stop };
}
