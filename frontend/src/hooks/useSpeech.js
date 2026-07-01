import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Push-to-talk speech hook.
 * start() → begin recording
 * stop()  → finalize & call onUtterance(text)
 */
export function useSpeech({ onUtterance } = {}) {
  const recRef         = useRef(null);
  const collectedRef   = useRef('');   // accumulated final results
  const lastInterimRef = useRef('');   // last interim (captured at stop time)
  const onUtteranceRef = useRef(onUtterance);
  onUtteranceRef.current = onUtterance;

  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening,  setIsListening]  = useState(false);
  const [isSupported]                   = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || recRef.current) return;

    collectedRef.current   = '';
    lastInterimRef.current = '';

    const rec = new SR();
    rec.lang            = 'en-US';
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          collectedRef.current += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      lastInterimRef.current = interim;
      setInterimTranscript(interim);
    };

    rec.onend = () => {
      recRef.current = null;
      setIsListening(false);
      setInterimTranscript('');
      const text = (collectedRef.current + lastInterimRef.current).trim();
      if (text) onUtteranceRef.current?.(text);
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      console.warn('STT error:', e.error);
      recRef.current = null;
      setIsListening(false);
      setInterimTranscript('');
    };

    recRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch (_) {
      recRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (recRef.current) {
      recRef.current.stop(); // triggers onend which fires onUtterance
    }
  }, []);

  useEffect(() => () => { recRef.current?.stop(); }, []);

  return { interimTranscript, isListening, isSupported, start, stop };
}
