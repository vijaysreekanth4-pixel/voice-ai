import { useEffect, useRef } from 'react';

/**
 * Scrolling conversation subtitles overlay.
 *
 * Props:
 *   messages        — [{id, role:'user'|'assistant', text}]
 *   interimText     — user's live speech-to-text (while PTT held)
 *   isListening     — true while PTT button held
 *   streamingCaption — live word-by-word text from Anam SDK (avatar speaking now)
 */
export default function LiveSubtitles({ messages = [], interimText, isListening, streamingCaption }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, interimText, streamingCaption]);

  const hasContent = messages.length > 0 || (isListening && interimText) || streamingCaption;
  if (!hasContent) return null;

  return (
    <div className="w-full max-w-lg mx-auto px-3 flex flex-col gap-2 max-h-[36vh] overflow-y-auto subtitle-scroll">

      {/* Conversation history */}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`caption-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`rounded-2xl px-3.5 py-2 text-sm leading-snug max-w-[88%] ${
              msg.role === 'user'
                ? 'bg-white/15 text-white/70 italic rounded-br-sm'
                : 'bg-black/80 backdrop-blur-sm text-white font-medium rounded-bl-sm'
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}

      {/* Avatar streaming caption (word-by-word from Anam SDK) */}
      {streamingCaption && (
        <div className="caption-in flex justify-start">
          <div className="rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[88%] bg-black/80 backdrop-blur-sm border border-white/10">
            <p className="text-white font-medium text-sm leading-snug caption-cursor">{streamingCaption}</p>
          </div>
        </div>
      )}

      {/* User live interim (while PTT held) */}
      {isListening && interimText && (
        <div className="caption-in flex justify-end">
          <div className="rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[88%] border border-white/10">
            <p className="text-white/35 text-sm italic leading-snug">{interimText}</p>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
