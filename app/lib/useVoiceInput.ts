"use client";

import { useSpeechRecognition } from "./useSpeechRecognition";
import { useGroqWhisper } from "./useGroqWhisper";

export function useVoiceInput(provider?: string, deviceId?: string) {
  const webSpeech = useSpeechRecognition();
  const groqWhisper = useGroqWhisper(deviceId);

  if (provider === "groq-whisper") {
    return {
      ...groqWhisper,
      isTranscribing: groqWhisper.isTranscribing,
    };
  }

  return {
    ...webSpeech,
    isTranscribing: false as const,
  };
}
