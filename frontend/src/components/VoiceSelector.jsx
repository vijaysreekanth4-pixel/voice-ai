import { useState } from 'react';
import { PERSONAS } from '../constants/personas';

export default function VoiceSelector({
  selectedPersona,
  personaList = PERSONAS,
  onPersonaChange,
  disabled,
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customId, setCustomId] = useState('');

  function applyCustomPersona() {
    if (!customId.trim()) return;
    onPersonaChange({
      id: customId.trim(),
      name: 'Custom',
      emoji: '🧩',
      language: 'en',
      langName: 'Custom',
      gender: '',
      accent: '',
      description: 'Custom persona ID',
      gradient: 'from-indigo-600 to-purple-600',
    });
    setShowCustom(false);
    setCustomId('');
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Persona cards */}
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
          Choose Avatar
        </label>
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {personaList.map((persona) => {
            const isSelected = selectedPersona?.id === persona.id;
            return (
              <button
                key={persona.id}
                onClick={() => onPersonaChange(persona)}
                disabled={disabled}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.98]
                  ${isSelected
                    ? 'border-indigo-500/60 bg-indigo-500/15 shadow-lg shadow-indigo-500/10'
                    : 'border-white/5 bg-white/3 hover:border-white/20 hover:bg-white/6'
                  }
                  disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {persona.avatarImageUrl ? (
                  <img
                    src={persona.avatarImageUrl}
                    alt={persona.name}
                    className="w-11 h-11 rounded-full object-cover shrink-0 border border-white/10"
                  />
                ) : (
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${persona.gradient || 'from-indigo-500 to-purple-600'}
                                 flex items-center justify-center text-2xl shrink-0`}
                  >
                    {persona.emoji}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{persona.name}</span>
                    <span className="text-xs text-white/35">{persona.gender}</span>
                    {isSelected && (
                      <span className="ml-auto text-xs text-indigo-400 font-medium">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    {[persona.langName, persona.accent].filter(Boolean).join(' · ')}
                  </p>
                  {(persona.voiceName || persona.description) && (
                    <p className="text-xs text-white/25 truncate mt-0.5">
                      {persona.voiceName || persona.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom persona ID */}
      <div className="border-t border-white/5 pt-3">
        <button
          onClick={() => setShowCustom((v) => !v)}
          className="text-xs text-white/35 hover:text-white/60 transition-colors"
        >
          {showCustom ? '▲ Hide' : '▼ Enter custom persona ID'}
        </button>
        {showCustom && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Paste Anam persona UUID…"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-xs
                         focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
            />
            <button
              onClick={applyCustomPersona}
              className="bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Use
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
