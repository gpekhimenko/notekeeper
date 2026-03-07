"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { transcribeAudio } from "./notesApi";

const SEGMENT_MS = 3000;

export function useGroqWhisper(deviceId?: string) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accumulatedRef = useRef("");
  const pendingRef = useRef(0);
  const stoppingRef = useRef(false);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  const finalize = useCallback(() => {
    setIsTranscribing(false);
    setIsListening(false);
    stoppingRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const sendSegment = useCallback(
    async (blob: Blob) => {
      if (blob.size === 0) {
        if (stoppingRef.current && pendingRef.current === 0) finalize();
        return;
      }
      pendingRef.current++;
      try {
        const text = await transcribeAudio(blob);
        if (text) {
          accumulatedRef.current +=
            (accumulatedRef.current ? " " : "") + text;
          setTranscript(accumulatedRef.current);
        }
      } catch (err) {
        console.error("Groq Whisper transcription failed:", err);
      } finally {
        pendingRef.current--;
        if (stoppingRef.current && pendingRef.current === 0) {
          finalize();
        }
      }
    },
    [finalize]
  );

  const startSegment = useCallback(
    (stream: MediaStream) => {
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        sendSegment(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    },
    [sendSegment]
  );

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stoppingRef.current = true;
    setIsTranscribing(true);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    } else if (pendingRef.current === 0) {
      finalize();
    }
  }, [finalize]);

  const start = useCallback(async () => {
    accumulatedRef.current = "";
    stoppingRef.current = false;
    pendingRef.current = 0;
    setTranscript("");
    setIsListening(true);
    setIsTranscribing(false);

    try {
      const audioConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : {};
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch {
        // Fallback to default device if the specified one fails
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      startSegment(stream);

      // Every SEGMENT_MS, stop the current segment and start a new one.
      // Stopping fires onstop → sendSegment → transcript updates progressively.
      intervalRef.current = setInterval(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
        startSegment(stream);
      }, SEGMENT_MS);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsListening(false);
    }
  }, [startSegment]);

  return { isListening, isTranscribing, isSupported, transcript, start, stop };
}
