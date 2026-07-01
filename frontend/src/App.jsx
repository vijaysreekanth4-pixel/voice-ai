import { useState, useCallback, useEffect } from 'react';
import { useAnam } from './hooks/useAnam';
import { useSpeech } from './hooks/useSpeech';
import { api } from './services/api';
import { PERSONAS, DEFAULT_PERSONA } from './constants/personas';
import AvatarView from './components/AvatarView';
import ControlBar from './components/ControlBar';
import LiveSubtitles from './components/LiveSubtitles';
import SlidePanel from './components/SlidePanel';
import VoiceSelector from './components/VoiceSelector';
import Conversation from './components/Conversation';

function normalizeAnamPersona(p) {
  const gender  = p.voice?.gender || '';
  const country = p.voice?.country || 'US';
  return {
    id: p.id,
    name: p.name || 'Unknown',
    gender: gender === 'FEMALE' ? 'Female' : 'Male',
    language: 'en',
    langName: 'English',
    accent: country === 'GB' ? 'British' : 'American',
    emoji: gender === 'FEMALE' ? '👩‍💼' : '👨‍💼',
    recognitionLang: country === 'GB' ? 'en-GB' : 'en-US',
    description: p.personaDescription || '',
    voiceName: p.voice?.displayName || '',
    avatarImageUrl: p.avatar?.portraitImageUrl || p.avatar?.imageUrl || null,
    gradient: gender === 'FEMALE' ? 'from-pink-500 to-rose-600' : 'from-blue-600 to-indigo-700',
    _fromApi: true,
  };
}

const STATUS_DOT = {
  idle:       { color: 'bg-white/20',                 label: 'Offline' },
  connecting: { color: 'bg-yellow-400 animate-pulse', label: 'Connecting…' },
  ready:      { color: 'bg-green-400 animate-pulse',  label: 'Live' },
  speaking:   { color: 'bg-blue-400 animate-pulse',   label: 'Speaking' },
  error:      { color: 'bg-red-400',                  label: 'Error' },
};

export default function App() {
  const [personaList,    setPersonaList]    = useState(PERSONAS);
  const [personaIndex,   setPersonaIndex]   = useState(0);
  const [isProcessing,   setIsProcessing]   = useState(false);
  const [messages,       setMessages]       = useState([]);
  const [panel,          setPanel]          = useState(null);
  const [personasLoaded, setPersonasLoaded] = useState(false);
  const [personaError,   setPersonaError]   = useState(null);

  const selectedPersona = personaList[personaIndex] || DEFAULT_PERSONA;
  const anam = useAnam();
  const dot  = STATUS_DOT[anam.status] || STATUS_DOT.idle;

  // ── Send message → backend → avatar speaks ──────────────────────────────
  const processMessage = useCallback(async (text) => {
    setIsProcessing(true);
    try {
      const result = await api.chat(text);
      // speak() waits until Anam fires endOfSpeech — avatar caption streams live
      await anam.speak(result.response);
      // Add to history AFTER avatar finishes so it doesn't duplicate the streaming caption
      addMessage({ role: 'assistant', text: result.response, type: result.type });
    } catch (err) {
      addMessage({ role: 'assistant', text: err.message || 'Something went wrong.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [anam]);

  // ── PTT fires when user releases the mic button ──────────────────────────
  const speech = useSpeech({
    onUtterance: useCallback((text) => {
      if (!text.trim()) return;
      addMessage({ role: 'user', text });
      processMessage(text);
    }, [processMessage]),
  });

  // Fetch real personas from the Anam API on mount
  useEffect(() => {
    setPersonaError(null);
    api.getPersonas()
      .then((data) => {
        const raw = Array.isArray(data) ? data : (data.data || data.personas || []);
        if (raw.length > 0) {
          setPersonaList(raw.map(normalizeAnamPersona));
          setPersonaIndex(0);
          setPersonasLoaded(true);
        } else {
          console.warn('[App] No personas returned from API, using fallback list');
          setPersonasLoaded(true);
        }
      })
      .catch((err) => {
        console.error('[App] Failed to fetch personas:', err);
        setPersonaError('Could not load personas from Anam API. Check your API key.');
        // Still allow using hardcoded fallbacks
        setPersonasLoaded(true);
      });
  }, []);

  // ── Session control ───────────────────────────────────────────────────────

  async function handleStart() {
    setMessages([]);
    await anam.startSession(selectedPersona);
  }

  function handleStop() {
    speech.stop();
    anam.stopSession();
    setMessages([]);
  }

  function handlePttStart() {
    if (isProcessing || anam.status === 'speaking') return;
    speech.start();
  }

  function handlePttEnd() {
    speech.stop();
  }

  // ── Persona navigation ────────────────────────────────────────────────────

  function goToPersona(idx) {
    const next = (idx + personaList.length) % personaList.length;
    setPersonaIndex(next);
    if (anam.isConnected) anam.startSession(personaList[next]);
  }

  function handlePersonaChange(persona) {
    const idx = personaList.findIndex((p) => p.id === persona.id);
    if (idx !== -1) goToPersona(idx);
    else if (anam.isConnected) anam.startSession(persona);
    setPanel(null);
  }

  function addMessage(msg) {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now() + Math.random(), timestamp: Date.now() },
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-screen overflow-hidden bg-[#0a0a0f]" style={{ height: '100dvh' }}>

      {/* ── Layer 1: Full-screen avatar video + idle state + swipe ── */}
      <AvatarView
        status={anam.status}
        persona={selectedPersona}
        error={anam.error}
        personaList={personaList}
        personaIndex={personaIndex}
        onNext={() => goToPersona(personaIndex + 1)}
        onPrev={() => goToPersona(personaIndex - 1)}
      />

      {/* ── Layer 2: UI overlay — flex column, top → bottom ──
           z-index + translateZ forces this above the hardware-decoded video
           on Android where <video> normally renders above all HTML. ── */}
      <div
        className="absolute inset-0 flex flex-col pointer-events-none"
        style={{ zIndex: 10, transform: 'translateZ(0)' }}
      >

        {/* ── Header ── */}
        <div
          className="flex-none flex items-center justify-between px-5 pointer-events-auto"
          style={{ paddingTop: 'max(14px, env(safe-area-inset-top))' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-indigo-500/30">
              V
            </div>
            <span className="text-white font-bold text-lg tracking-wide">Voice AI</span>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />
            <span className="text-white/60 text-xs">{dot.label}</span>
          </div>
        </div>

        {/* Error banner */}
        {anam.error && (
          <div className="flex-none mx-5 mt-2 bg-red-500/20 border border-red-500/30 backdrop-blur-sm text-red-300 text-xs px-4 py-2 rounded-xl text-center">
            {anam.error}
          </div>
        )}

        {/* Persona fetch error banner */}
        {personaError && (
          <div className="flex-none mx-5 mt-2 bg-orange-500/20 border border-orange-500/30 backdrop-blur-sm text-orange-300 text-xs px-4 py-2 rounded-xl text-center">
            {personaError}
          </div>
        )}

        {/* STT not supported warning */}
        {!speech.isSupported && (
          <div className="flex-none mx-5 mt-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs px-4 py-2 rounded-xl text-center">
            Speech recognition requires Chrome or Edge
          </div>
        )}

        {/* ── Spacer — touch events pass through to AvatarView swipe ── */}
        <div className="flex-1" />

        {/* ── Live subtitles ── */}
        <div className="flex-none pointer-events-none pb-1 px-1">
          <LiveSubtitles
            messages={messages}
            interimText={speech.interimTranscript}
            isListening={speech.isListening}
            streamingCaption={anam.streamingCaption}
          />
        </div>

        {/* ── Persona dot indicators ── */}
        {personaList.length > 1 && (
          <div className="flex-none flex justify-center items-center gap-1.5 py-2">
            {personaList.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === personaIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Control bar ── */}
        <div
          className="flex-none pointer-events-auto pb-4"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
          <ControlBar
            status={anam.status}
            isListening={speech.isListening}
            isProcessing={isProcessing}
            onStart={handleStart}
            onStop={handleStop}
            onPttStart={handlePttStart}
            onPttEnd={handlePttEnd}
            onOpenVoices={() => setPanel(panel === 'voices' ? null : 'voices')}
            onOpenChat={() => setPanel(panel === 'chat' ? null : 'chat')}
            messageCount={messages.length}
            persona={selectedPersona}
          />
        </div>

      </div>

      {/* ── Panels ── */}
      {panel === 'voices' && (
        <SlidePanel open onClose={() => setPanel(null)} title="Avatar & Voice">
          <VoiceSelector
            selectedPersona={selectedPersona}
            personaList={personaList}
            onPersonaChange={handlePersonaChange}
            disabled={anam.status === 'connecting'}
          />
        </SlidePanel>
      )}

      {panel === 'chat' && (
        <SlidePanel
          open
          onClose={() => setPanel(null)}
          title={`Conversation${messages.length ? ` · ${messages.length}` : ''}`}
        >
          <Conversation messages={messages} />
        </SlidePanel>
      )}

    </div>
  );
}
