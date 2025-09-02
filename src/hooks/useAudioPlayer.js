import { useState, useEffect, useCallback, useRef } from 'react';

export const useAudioPlayer = (url) => {
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (url && !audioBufferRef.current) {
      fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          if (audioContextRef.current) {
            audioContextRef.current.decodeAudioData(arrayBuffer,
              (buffer) => {
                audioBufferRef.current = buffer;
                setIsReady(true);
              },
              (e) => {
                setError("Erro ao decodificar o áudio: " + e.message);
                setIsReady(false);
              }
            );
          }
        })
        .catch(e => {
          setError("Erro ao carregar o áudio: " + e.message);
          setIsReady(false);
        });
    }
  }, [url]);

  const unlockAudio = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioContextRef.current.createBuffer(1, 1, 22050);
        source.connect(audioContextRef.current.destination);
        source.start(0);

        return true;
      } catch (e) {
        setError("Contexto de áudio não suportado: " + e.message);
        return false;
      }
    }
    return true;
  }, []);

  const play = useCallback(() => {
    if (!isReady || !audioContextRef.current || !audioBufferRef.current) {
      console.warn("Player de áudio não está pronto ou o áudio não foi desbloqueado.");
      return;
    }
    
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }

    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    } catch(e) {
        console.error("Erro ao tocar o som: ", e);
    }
  }, [isReady]);

  return { play, unlockAudio, isReady, error };
};