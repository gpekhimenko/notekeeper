"use client";

import { useSpeechRecognition } from "./useSpeechRecognition";
import { useGroqWhisper } from "./useGroqWhisper";

export function useVoiceInput(provider?: string) {
  const webSpeech = useSpeechRecognition();
  const groqWhisper = useGroqWhisper();

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
