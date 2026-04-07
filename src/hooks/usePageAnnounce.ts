import { useEffect } from "react";
import { useTextToSpeech } from "./useTextToSpeech";

/**
 * Reads the page title aloud when vocal mode is enabled.
 * Like Samsung TV screen-reader: announces where you are when navigating.
 */
export function usePageAnnounce(title: string, subtitle?: string) {
  const { speak, stop, isSupported } = useTextToSpeech();

  useEffect(() => {
    const voiceEnabled = localStorage.getItem("oscar_voice_enabled");
    if (voiceEnabled !== "true" || !isSupported) return;

    const text = subtitle ? `${title}. ${subtitle}` : title;

    // Small delay to let the page render first
    const timer = setTimeout(() => speak(text), 400);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [title, subtitle, isSupported]);
}
