import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

export function isVoiceSearchSupported(): boolean {
  return getSpeechRecognition() !== null;
}

export function useVoiceSearch(onResult: (transcript: string) => void) {
  const [supported] = useState(() => isVoiceSearchSupported());
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setError('Voice search is not supported in this browser. Try Chrome or Safari.');
      return;
    }

    setError(null);
    const recognition = new Ctor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onResultRef.current(transcript);
      setListening(false);
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone permission is needed for voice search.');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError('We could not hear that. Please try again.');
      }
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError('Voice search could not start. Please try again.');
      setListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, error, start, stop, toggle };
}
