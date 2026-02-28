import { useEffect, useRef, useState, useMemo } from "react";
import { suggestTags } from "./notesApi";

export function useTagSuggestion(
  body: string,
  currentTags: string[],
  allTags: string[],
  model?: string
) {
  const [rawSuggestions, setRawSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions based on body and allTags only (not currentTags)
  useEffect(() => {
    if (body.trim().length < 30) {
      setRawSuggestions([]);
      setIsLoading(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      suggestTags(body, allTags, controller.signal, model).then((result) => {
        if (!controller.signal.aborted) {
          setRawSuggestions(result);
          setIsLoading(false);
        }
      });
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [body, allTags, model]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Filter out tags that the user has already added
  const suggestions = useMemo(
    () => rawSuggestions.filter((t) => !currentTags.includes(t)),
    [rawSuggestions, currentTags]
  );

  return { suggestions, isLoading };
}
