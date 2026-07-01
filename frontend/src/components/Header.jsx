export default function Header({ isConnected }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-panel border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
          V
        </div>
        <span className="text-white font-semibold tracking-wide">Voice AI</span>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-white/20'}`}
        />
        <span className={isConnected ? 'text-success' : 'text-white/40'}>
          {isConnected ? 'Avatar Online' : 'Not Connected'}
        </span>
      </div>
    </header>
  );
}
