import { useEffect, useCallback } from 'react';

/**
 * Push-to-Talk button — hold mouse/touch OR hold Space to record.
 *
 * Props:
 *   isListening   — true while mic is active
 *   isConnected   — false when avatar not yet started
 *   isProcessing  — true while backend request is in flight
 *   onStart()     — begin recording
 *   onStop()      — end recording and submit
 */
export default function TalkButton({
  isListening,
  isConnected,
  isProcessing,
  onStart,
  onStop,
}) {
  const disabled = !isConnected || isProcessing;

  // Space-bar hold support
  const handleKeyDown = useCallback(
    (e) => {
      if (e.code === 'Space' && !e.repeat && !disabled && !isListening) {
        e.preventDefault();
        onStart();
      }
    },
    [disabled, isListening, onStart],
  );

  const handleKeyUp = useCallback(
    (e) => {
      if (e.code === 'Space' && isListening) {
        e.preventDefault();
        onStop();
      }
    },
    [isListening, onStop],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main button */}
      <button
        onMouseDown={disabled ? undefined : onStart}
        onMouseUp={isListening ? onStop : undefined}
        onMouseLeave={isListening ? onStop : undefined}
        onTouchStart={disabled ? undefined : (e) => { e.preventDefault(); onStart(); }}
        onTouchEnd={isListening ? (e) => { e.preventDefault(); onStop(); } : undefined}
        disabled={disabled}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center
                    select-none transition-all duration-150 shadow-xl
                    ${
                      isListening
                        ? 'bg-danger scale-110 shadow-danger/40 shadow-2xl'
                        : disabled
                        ? 'bg-white/10 cursor-not-allowed'
                        : 'bg-accent hover:bg-accent-hover active:scale-95 shadow-accent/30'
                    }`}
      >
        {/* Pulse ring while listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-danger opacity-30 animate-ping" />
        )}

        {/* Mic icon */}
        <svg
          className={`w-8 h-8 ${disabled && !isListening ? 'text-white/30' : 'text-white'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {isListening ? (
            // Stop square
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            // Mic
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-7 8h2a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.92V20h3v2H8v-2h3v-2.08A7 7 0 0 1 5 11z" />
          )}
        </svg>

        {/* Processing spinner overlay */}
        {isProcessing && (
          <span className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        )}
      </button>

      {/* Label */}
      <p className="text-xs text-white/40 select-none">
        {isProcessing
          ? 'Processing…'
          : isListening
          ? 'Release to send'
          : disabled && !isConnected
          ? 'Start avatar first'
          : 'Hold to speak  ·  Space'}
      </p>
    </div>
  );
}
