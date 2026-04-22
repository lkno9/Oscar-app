import { OscarAvatar } from "./OscarAvatar";

interface OscarSpeechBubbleProps {
  /** The message Oscar says */
  message: string;
  /** Optional extra CSS class */
  className?: string;
  /** Stagger delay index for entry animation (0-5) */
  stagger?: number;
}

/**
 * Oscar's speech bubble — shows a message in a bubble
 * next to his avatar. Used for tips, encouragements, greetings.
 * Does NOT modify OscarAvatar.
 */
export function OscarSpeechBubble({
  message,
  className = "",
  stagger = 0,
}: OscarSpeechBubbleProps) {
  const delayClass = stagger > 0 ? `stagger-${Math.min(stagger, 6)}` : "";

  return (
    <div
      className={`flex items-end gap-2.5 animate-bounce-in ${delayClass} ${className}`}
      style={{ padding: "0 16px", marginTop: 12 }}
    >
      {/* Avatar — floating gently */}
      <div className="flex-shrink-0 animate-float" style={{ marginBottom: 2 }}>
        <OscarAvatar size="sm" />
      </div>

      {/* Speech bubble with bottom-left tail */}
      <div className="oscar-speech-bubble flex-1" style={{ marginBottom: 8 }}>
        <p
          style={{
            fontSize: 13.5,
            color: "#374151",
            lineHeight: 1.5,
            margin: 0,
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
