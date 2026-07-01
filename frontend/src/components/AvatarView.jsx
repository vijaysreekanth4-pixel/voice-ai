import { useCallback, useRef } from 'react';

/**
 * Full-screen avatar layer — video, effects, idle state, swipe.
 * Subtitles, dots, header, and control bar live in the App overlay.
 */
export default function AvatarView({
  status,
  persona,
  error,
  personaList = [],
  personaIndex = 0,
  onNext,
  onPrev,
}) {
  const showVideo = status === 'ready' || status === 'speaking' || status === 'connecting';

  // ── Swipe handling ───────────────────────────────────────────────────────
  const touchRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, down: false });

  const handleTouchStart = useCallback((e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      dx < 0 ? onNext?.() : onPrev?.();
    }
  }, [onNext, onPrev]);

  const handleMouseDown = useCallback((e) => {
    mouseRef.current = { x: e.clientX, down: true };
  }, []);

  const handleMouseUp = useCallback((e) => {
    if (!mouseRef.current.down) return;
    mouseRef.current.down = false;
    const dx = e.clientX - mouseRef.current.x;
    if (Math.abs(dx) > 60) dx < 0 ? onNext?.() : onPrev?.();
  }, [onNext, onPrev]);

  // ────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="absolute inset-0 bg-[#0a0a0f] overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Audio / Video */}
      <audio id="anam-audio" autoPlay hidden />
      <video
        id="anam-video"
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          showVideo && status !== 'connecting' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Vignette */}
      <div className="avatar-vignette absolute inset-0 pointer-events-none" />

      {/* ── Idle / Connecting placeholder ── */}
      {(status === 'idle' || status === 'connecting') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6">
          {/* Avatar with soft glow */}
          <div className={`relative ${status === 'connecting' ? 'animate-pulse' : ''}`}>
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 scale-125 blur-2xl" />
            {persona?.avatarImageUrl ? (
              <img
                src={persona.avatarImageUrl}
                alt={persona.name}
                className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full object-cover border-2 border-white/10 shadow-2xl"
              />
            ) : (
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-8xl">
                {persona?.emoji || '🤖'}
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-white font-bold text-2xl tracking-tight">{persona?.name}</p>
            {persona?.description && (
              <p className="text-white/40 text-sm mt-2 max-w-xs leading-relaxed">{persona.description}</p>
            )}
          </div>

          {status === 'idle' && (
            <p className="text-white/30 text-xs tracking-wide">
              Swipe to change avatar · Press <span className="text-white/60 font-semibold">Start</span>
            </p>
          )}

          {status === 'connecting' && (
            <div className="flex gap-2 items-center mt-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/50"
                  style={{ animation: `bounce 0.9s ${i * 0.15}s ease-in-out infinite` }}
                />
              ))}
              <span className="text-white/50 text-sm ml-1">Starting avatar…</span>
            </div>
          )}
        </div>
      )}

      {/* Equalizer — avatar speaking */}
      {status === 'speaking' && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[30%] flex items-end gap-[3px] h-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="w-[3px] bg-white/50 rounded-full origin-bottom"
              style={{ height: '100%', animation: `eq 0.5s ${i * 0.06}s ease-in-out infinite` }}
            />
          ))}
        </div>
      )}

      {/* Bottom gradient */}
      <div className="bottom-fade absolute bottom-0 left-0 right-0 h-80 pointer-events-none" />
    </div>
  );
}
