/**
 * Floating bottom control bar — push-to-talk edition.
 * Positioned by the parent (App.jsx flex column). No absolute positioning here.
 */
export default function ControlBar({
  status,
  isListening,
  isProcessing,
  onStart,
  onStop,
  onPttStart,
  onPttEnd,
  onOpenVoices,
  onOpenChat,
  messageCount,
  persona,
}) {
  const isConnected  = status === 'ready' || status === 'speaking';
  const isConnecting = status === 'connecting';
  const isBusy       = isProcessing || status === 'speaking';

  return (
    <div className="flex justify-center px-4">
      <div className="flex items-center gap-2 sm:gap-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 sm:px-5 py-3 shadow-2xl w-full max-w-sm">

        {/* Avatar selector */}
        <IconBtn onClick={onOpenVoices} title="Change avatar" disabled={isConnecting}>
          {persona?.avatarImageUrl ? (
            <img src={persona.avatarImageUrl} alt={persona.name} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <span className="text-xl leading-none">{persona?.emoji || '🤖'}</span>
          )}
          <span className="text-[10px] text-white/40 truncate max-w-[52px] leading-none">{persona?.name}</span>
        </IconBtn>

        <Divider />

        {/* ── Primary action ── */}
        {!isConnected && !isConnecting ? (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500
                       active:bg-indigo-700 text-white text-sm font-semibold px-4 py-3 rounded-xl
                       transition-all active:scale-95 shadow-lg shadow-indigo-500/30 min-h-[48px]"
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Start</span>
          </button>

        ) : isConnecting ? (
          <button disabled className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white/50 text-sm font-semibold px-4 py-3 rounded-xl min-h-[48px]">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Starting…</span>
          </button>

        ) : (
          /* PUSH-TO-TALK */
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-red-500 mic-ring pointer-events-none" />
              )}
              <button
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onPttStart?.(); }}
                onPointerUp={onPttEnd}
                onPointerCancel={onPttEnd}
                disabled={isBusy}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center
                            transition-all active:scale-95 shadow-xl select-none touch-none
                            ${isListening ? 'bg-red-600 shadow-red-500/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30'}
                            disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isBusy ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : isListening ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="5" y="5" width="14" height="14" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v6a2 2 0 004 0V5a2 2 0 00-2-2zm-7 8h2a5 5 0 0010 0h2a7 7 0 01-6 6.92V20h3v2H8v-2h3v-2.08A7 7 0 015 11z" />
                  </svg>
                )}
              </button>
            </div>
            <span className="text-[9px] leading-none text-white/40 select-none">
              {isBusy ? 'Wait…' : isListening ? 'Release to send' : 'Hold to speak'}
            </span>
          </div>
        )}

        {/* STOP */}
        {isConnected && (
          <>
            <Divider />
            <IconBtn onClick={onStop} title="End session" danger>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
              <span className="text-[10px] leading-none">Stop</span>
            </IconBtn>
          </>
        )}

        <Divider />

        {/* Chat history */}
        <div className="relative">
          <IconBtn onClick={onOpenChat} title="Conversation">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="text-[10px] text-white/40 leading-none">Chat</span>
          </IconBtn>
          {messageCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white pointer-events-none">
              {messageCount > 9 ? '9+' : messageCount}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-8 bg-white/10 shrink-0" />;
}

function IconBtn({ onClick, title, disabled, danger, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] justify-center
        ${danger ? 'text-red-400 hover:bg-red-500/10 active:bg-red-500/20' : 'text-white/60 hover:bg-white/8 hover:text-white/90 active:bg-white/12'}
        disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
