import { useEffect, useRef } from 'react';

const TYPE_STYLES = {
  weather: 'border-l-2 border-blue-500 bg-blue-500/10',
  error: 'border-l-2 border-danger bg-danger/10',
  clarification: 'border-l-2 border-warning bg-warning/10',
  general: '',
};

/**
 * Scrollable conversation history panel.
 *
 * Each message: { id, role: 'user'|'assistant', text, type, timestamp }
 */
export default function Conversation({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <span className="text-4xl opacity-20">💬</span>
        <p className="text-white/30 text-sm">
          Start the avatar and speak to begin a conversation.
        </p>
        <p className="text-white/20 text-xs">Try: "What's the weather in Mumbai?"</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm
              ${
                msg.role === 'user'
                  ? 'bg-accent text-white rounded-br-sm'
                  : `bg-card text-white/90 rounded-bl-sm ${TYPE_STYLES[msg.type] || ''}`
              }`}
          >
            {msg.text}
          </div>
          <span className="text-[10px] text-white/25 mt-1 px-1">
            {msg.role === 'user' ? 'You' : 'Avatar'} ·{' '}
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
