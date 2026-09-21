// src/utils/arabicTTS.js
// High-reliability Arabic Text-to-Speech Engine
// Uses Web Speech API (SpeechSynthesis) with Chrome keep-alive, voice detection, and garbage-collection prevention

class ArabicTTSPlayer {
  constructor() {
    this.isPlaying = false;
    this.currentText = null;
    this.onEndCallback = null;
    this.onStartCallback = null;
    this.keepAlive = null;
    this.currentAudio = null;

    // Preload voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          try { window.speechSynthesis.getVoices(); } catch (e) {}
        };
      } catch (e) {}
    }
  }

  cleanup() {
    this.isPlaying = false;
    this.currentText = null;
    if (this.keepAlive) {
      clearInterval(this.keepAlive);
      this.keepAlive = null;
    }
    window._activeSpeechUtterance = null;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.src = '';
      } catch (e) {}
      this.currentAudio = null;
    }
  }

  stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    const cb = this.onEndCallback;
    this.cleanup();
    this.onEndCallback = null;
    this.onStartCallback = null;
    if (cb) {
      try { cb(); } catch (e) {}
    }
  }

  speak(text, { onStart, onEnd, onError } = {}) {
    this.stop();

    if (!text || !text.trim()) return;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onError) onError('Speech synthesis not supported');
      return;
    }

    this.currentText = text;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;

    // Clean text: strip emojis, markdown, and symbols that confuse TTS engines
    const cleanText = text
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
      .replace(/[🔍💡🌍🌱🔄☀️🧊🪂⏱️🏃‍♂️❤️🥚🌊✨🤖🎙️🎉🎓🏅🔬📝📋💭💬⭐✔️❌⚠️🚨📚📖☕]/g, ' ')
      .replace(/[*#_~`]/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      this.stop();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      // Pick best Arabic voice available
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => 
        (v.lang && v.lang.toLowerCase().startsWith('ar')) ||
        (v.name && (
          v.name.toLowerCase().includes('arabic') ||
          v.name.toLowerCase().includes('maged') ||
          v.name.toLowerCase().includes('salma') ||
          v.name.toLowerCase().includes('shakir') ||
          v.name.toLowerCase().includes('naayf') ||
          v.name.toLowerCase().includes('tarik') ||
          v.name.toLowerCase().includes('laila')
        ))
      );

      if (arVoice) {
        utterance.voice = arVoice;
      }

      // Crucial: retain on window to prevent Chrome's garbage-collector from cutting speech prematurely
      window._activeSpeechUtterance = utterance;

      utterance.onstart = () => {
        this.isPlaying = true;
        if (this.onStartCallback) {
          try { this.onStartCallback(text); } catch (e) {}
        }

        // Chrome keep-alive timer for longer utterances
        if (this.keepAlive) clearInterval(this.keepAlive);
        this.keepAlive = setInterval(() => {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
            window.speechSynthesis.resume();
          } else {
            clearInterval(this.keepAlive);
          }
        }, 4000);
      };

      utterance.onend = () => {
        const cb = this.onEndCallback;
        this.cleanup();
        if (cb) {
          try { cb(); } catch (e) {}
        }
      };

      utterance.onerror = (e) => {
        // Interrupted or canceled means normal user action or navigation
        if (e.error === 'interrupted' || e.error === 'canceled') {
          this.cleanup();
          const cb = this.onEndCallback;
          if (cb) {
            try { cb(); } catch (err) {}
          }
          return;
        }

        console.warn('Speech synthesis notice:', e.error);
        const cb = this.onEndCallback;
        this.cleanup();
        if (cb) {
          try { cb(); } catch (err) {}
        }
      };

      // Speak with micro-tick to ensure clean state after cancel()
      setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('SpeechSynthesis speak failed:', err);
          this.cleanup();
          if (this.onEndCallback) {
            try { this.onEndCallback(); } catch (e) {}
          }
        }
      }, 25);

    } catch (e) {
      console.warn('Speech setup error:', e);
      this.cleanup();
      if (this.onEndCallback) {
        try { this.onEndCallback(); } catch (err) {}
      }
    }
  }
}

export const arabicTTS = new ArabicTTSPlayer();
export default arabicTTS;
