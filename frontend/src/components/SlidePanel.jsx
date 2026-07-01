/**
 * Generic slide-over panel from the right.
 * Props: open, onClose, title, children
 */
export default function SlidePanel({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="slide-in absolute right-0 top-0 bottom-0 w-80 bg-[#13131f] border-l border-white/8 flex flex-col z-30 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}
