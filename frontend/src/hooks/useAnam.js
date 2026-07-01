import { useRef, useState, useCallback, useEffect } from 'react';
import { createClient, unsafe_createClientWithApiKey } from '@anam-ai/js-sdk';
import { api } from '../services/api';

const DEV_API_KEY = import.meta.env.VITE_ANAM_API_KEY;

export function useAnam() {
  const clientRef        = useRef(null);
  const streamBufRef     = useRef('');   // accumulates chunks for current speak turn
  const onSpeakDoneRef   = useRef(null); // resolve() for the current speak() promise

  const [status,          setStatus]          = useState('idle');
  const [error,           setError]           = useState(null);
  const [currentPersonaId,setCurrentPersonaId]= useState(null);
  const [streamingCaption,setStreamingCaption]= useState(''); // live word-by-word avatar text

  const stopSession = useCallback(async () => {
    if (clientRef.current) {
      try {
        if (clientRef.current.isStreaming?.()) await clientRef.current.stopStreaming();
      } catch (_) {}
      clientRef.current = null;
    }
    streamBufRef.current = '';
    setStreamingCaption('');
    setStatus('idle');
    setCurrentPersonaId(null);
    setError(null);
  }, []);

  const startSession = useCallback(
    async (persona, videoElementId = 'anam-video', audioElementId = 'anam-audio') => {
      if (clientRef.current) await stopSession();

      setStatus('connecting');
      setError(null);

      try {
        let client;
        if (DEV_API_KEY) {
          client = unsafe_createClientWithApiKey(DEV_API_KEY, { personaId: persona.id });
        } else {
          const { sessionToken } = await api.getAnamSession(persona.id);
          try {
            client = createClient(sessionToken);
          } catch {
            client = createClient(sessionToken, { personaId: persona.id });
          }
        }

        client.addListener('CONNECTION_ESTABLISHED', () => setStatus('ready'));
        client.addListener('CONNECTION_CLOSED', () => {
          clientRef.current = null;
          setCurrentPersonaId(null);
          setStatus('idle');
        });

        // ── Real-time word-by-word caption from Anam ──────────────────────
        client.addListener('MESSAGE_STREAM_EVENT_RECEIVED', (event) => {
          if (event.role !== 'persona') return;

          streamBufRef.current += event.content;
          setStreamingCaption(streamBufRef.current);

          if (event.endOfSpeech) {
            // Avatar finished the current sentence — resolve speak() promise
            const resolve = onSpeakDoneRef.current;
            onSpeakDoneRef.current = null;
            streamBufRef.current = '';
            setStreamingCaption('');
            setStatus('ready');
            resolve?.();
          }
        });

        await client.streamToVideoAndAudioElements(videoElementId, audioElementId);

        clientRef.current = client;
        setCurrentPersonaId(persona.id);
      } catch (err) {
        // Extract meaningful error from Anam SDK ClientError objects
        let errorMsg = 'Failed to start avatar session';
        if (err?.message) {
          errorMsg = err.message;
          // Anam SDK ClientError includes a `cause` in the options
          if (err.cause) {
            errorMsg += `: ${err.cause}`;
          }
        }
        console.error('[useAnam] startSession error:', err);
        setStatus('error');
        setError(errorMsg);
        clientRef.current = null;
      }
    },
    [stopSession],
  );

  const speak = useCallback(async (text) => {
    if (!clientRef.current || !text?.trim()) return;
    setStatus('speaking');
    streamBufRef.current = '';
    setStreamingCaption('');

    await new Promise((resolve) => {
      onSpeakDoneRef.current = resolve;

      clientRef.current.talk(text).catch((err) => {
        setError(err?.message || 'Failed to speak');
        onSpeakDoneRef.current = null;
        resolve(); // don't hang
      });
    });
  }, []);

  useEffect(() => () => { stopSession(); }, [stopSession]);

  return {
    status,
    error,
    currentPersonaId,
    streamingCaption,   // live word-by-word text from Anam SDK
    startSession,
    stopSession,
    speak,
    mute:   () => {},
    unmute: () => {},
    isConnected: status === 'ready' || status === 'speaking',
  };
}
