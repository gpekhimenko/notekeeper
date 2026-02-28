import { useEffect, useRef, useState } from "react";
import { suggestTitle } from "./notesApi";

export function useTitleSuggestion(body: string, title: string, model?: string) {
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear suggestion when user types their own title
    if (title.trim()) {
      setSuggestion("");
      setIsLoading(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    // Need 30+ chars of body content
    if (body.trim().length < 30) {
      setSuggestion("");
      setIsLoading(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Debounce 2 seconds
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Abort previous request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      suggestTitle(body, controller.signal, model).then((result) => {
        if (!controller.signal.aborted) {
          setSuggestion(result);
          setIsLoading(false);
        }
      });
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [body, title, model]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { suggestion, isLoading, clearSuggestion: () => setSuggestion("") };
}
