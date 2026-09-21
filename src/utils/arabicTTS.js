// src/utils/arabicTTS.js
// Resilient, cross-platform Arabic Text-to-Speech Engine
// Tier 1: Natural Arabic Audio Stream (Google TTS tw-ob / gtx without Referer)
// Tier 2: Web Speech API (SpeechSynthesis)

// Pre-warm Web Speech voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      try { window.speechSynthesis.getVoices(); } catch (e) {}
    };
  } catch (e) {}
}

class ArabicTTSPlayer {
  constructor() {
    this.currentAudio = null;
    this.audioQueue = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.currentText = null;
    this.onEndCallback = null;
    this.onStartCallback = null;
    this.onErrorCallback = null;
  }

  // Split text into chunks suitable for audio streaming (max ~150 chars, split on punctuation/spaces)
  splitIntoChunks(text, maxChunkLen = 140) {
    if (!text) return [];

    // Clean emojis and decorative symbols
    const clean = text
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
      .replace(/[🔍💡🌍🌱🔄☀️🧊🪂⏱️🏃‍♂️❤️🥚🌊✨🤖🎙️🎉🎓🏅🔬📝📋💭💬⭐✔️❌⚠️🚨📚📖☕]/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return [];

    // Split on sentence boundaries (. ! ؟ ? ،)
    const rawSegments = clean.split(/([.!?؟،]+)/);
    const sentences = [];
    for (let i = 0; i < rawSegments.length; i += 2) {
      const sentence = (rawSegments[i] || '') + (rawSegments[i + 1] || '');
      if (sentence.trim()) {
        sentences.push(sentence.trim());
      }
    }

    if (sentences.length === 0) {
      sentences.push(clean);
    }

    const chunks = [];
    let current = '';

    for (let s of sentences) {
      if ((current + ' ' + s).trim().length <= maxChunkLen) {
        current = current ? (current + ' ' + s) : s;
      } else {
        if (current) chunks.push(current);

        // If a single sentence is still longer than maxChunkLen, split by words
        if (s.length > maxChunkLen) {
          const words = s.split(' ');
          let wordChunk = '';
          for (const w of words) {
            if ((wordChunk + ' ' + w).trim().length <= maxChunkLen) {
              wordChunk = wordChunk ? (wordChunk + ' ' + w) : w;
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = w;
            }
          }
          if (wordChunk) chunks.push(wordChunk);
          current = '';
        } else {
          current = s;
        }
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  stop() {
    this.isPlaying = false;
    this.currentText = null;
    this.audioQueue = [];
    this.currentIndex = 0;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.src = '';
      } catch (e) {
        // Ignore audio cleanup error
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Ignore synthesis cancel error
      }
    }

    const cb = this.onEndCallback;
    this.onEndCallback = null;
    this.onStartCallback = null;
    this.onErrorCallback = null;

    if (cb) {
      try { cb(); } catch (e) {}
    }
  }

  speak(text, { onStart, onEnd, onError } = {}) {
    this.stop();

    if (!text || !text.trim()) return;

    this.currentText = text;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;
    this.onErrorCallback = onError;
    this.isPlaying = true;

    if (this.onStartCallback) {
      try { this.onStartCallback(text); } catch (e) {}
    }

    const chunks = this.splitIntoChunks(text);
    if (chunks.length === 0) {
      this.stop();
      return;
    }

    this.audioQueue = chunks;
    this.currentIndex = 0;

    this.playNextChunk();
  }

  playNextChunk() {
    if (!this.isPlaying) return;

    if (this.currentIndex >= this.audioQueue.length) {
      this.stop();
      return;
    }

    const chunk = this.audioQueue[this.currentIndex];
    const encoded = encodeURIComponent(chunk);
    const primaryUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=ar&client=tw-ob`;
    const fallbackUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encoded}&tl=ar&client=gtx`;

    const audio = new Audio();
    audio.preload = 'auto';
    this.currentAudio = audio;

    let triedFallback = false;

    const tryPlay = (url) => {
      audio.src = url;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio stream error for URL:', url, err);
          handleError();
        });
      }
    };

    const handleError = () => {
      if (!this.isPlaying) return;
      if (!triedFallback) {
        triedFallback = true;
        tryPlay(fallbackUrl);
      } else {
        console.warn('All audio stream URLs failed, falling back to Web Speech API');
        const remaining = this.audioQueue.slice(this.currentIndex).join(' ');
        this.fallbackToSpeechSynthesis(remaining);
      }
    };

    audio.onended = () => {
      if (!this.isPlaying) return;
      this.currentIndex++;
      this.playNextChunk();
    };

    audio.onerror = () => {
      handleError();
    };

    tryPlay(primaryUrl);
  }

  fallbackToSpeechSynthesis(text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (this.onErrorCallback) {
        try { this.onErrorCallback('Audio not supported'); } catch (e) {}
      }
      this.stop();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => (v.lang && v.lang.startsWith('ar')) || (v.name && v.name.toLowerCase().includes('arabic')));
      if (arVoice) {
        utterance.voice = arVoice;
      }

      // Keep reference to prevent Chrome GC bug
      window._activeTtsUtterance = utterance;

      utterance.onend = () => {
        this.stop();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.stop();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.stop();
    }
  }
}

export const arabicTTS = new ArabicTTSPlayer();
export default arabicTTS;
