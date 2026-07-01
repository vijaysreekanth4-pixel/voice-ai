import { useEffect, useRef } from 'react';

const STATUS_LABELS = {
  idle: 'Press "Start Avatar" to begin',
  connecting: 'Connecting to avatar...',
  ready: 'Avatar ready — hold the mic to speak',
  speaking: 'Avatar is speaking...',
  error: 'Connection error',
};

const STATUS_COLORS = {
  idle: 'text-white/40',
  connecting: 'text-warning',
  ready: 'text-success',
  speaking: 'text-accent',
  error: 'text-danger',
};

export default function AvatarPanel({ status, error, interimTranscript, persona }) {
  const label = STATUS_LABELS[status] || STATUS_LABELS.idle;
  const labelColor = STATUS_COLORS[status] || STATUS_COLORS.idle;

  return (
    <div className="relative flex flex-col items-center justify-center bg-panel rounded-2xl overflow-hidden aspect-video w-full max-w-2xl mx-auto shadow-2xl border border-white/5">
      {/* Hidden audio element — Anam uses it for audio output */}
      <audio id="anam-audio" autoPlay hidden />

      {/* Avatar video */}
      <video
        id="anam-video"
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          status === 'idle' || status === 'connecting' ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Placeholder shown when not connected */}
      {(status === 'idle' || status === 'connecting') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          {persona?.avatarImageUrl ? (
            <img
              src={persona.avatarImageUrl}
              alt={persona.name}
              className={`w-32 h-32 rounded-full object-cover border-2 border-white/10 select-none
                          ${status === 'connecting' ? 'animate-pulse' : ''}`}
            />
          ) : (
            <div
              className={`text-6xl select-none ${status === 'connecting' ? 'animate-pulse' : ''}`}
            >
              {persona?.emoji || '🤖'}
            </div>
          )}
          {status === 'connecting' && (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent"
                  style={{ animation: `bounce 1s ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Speaking waveform overlay */}
      {status === 'speaking' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-accent rounded-full"
              style={{
                height: `${30 + Math.random() * 70}%`,
                animation: `equalizer 0.6s ${i * 0.08}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Interim transcript overlay (what user is saying live) */}
      {interimTranscript && (
        <div className="absolute bottom-6 left-4 right-4 text-center">
          <p className="text-white/70 text-sm bg-black/50 rounded-lg px-3 py-1.5 inline-block">
            "{interimTranscript}"
          </p>
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-3 right-3">
        <span className={`text-xs font-medium ${labelColor}`}>{label}</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-danger text-xs text-center bg-black/60 rounded px-2 py-1">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
