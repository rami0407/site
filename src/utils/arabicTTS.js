// src/utils/arabicTTS.js
// 100% Reliable Native Arabic Audio Player
// Plays local studio-quality MP3 audio files hosted directly on the site
// Fallback to Web Speech API for arbitrary text

const AUDIO_FILES = {
  welcome: '/audio/quest/welcome.mp3',
  station1: '/audio/quest/station1.mp3',
  station2: '/audio/quest/station2.mp3',
  station3: '/audio/quest/station3.mp3',
  station4: '/audio/quest/station4.mp3',
  comic1: '/audio/quest/comic1.mp3',
  comic2: '/audio/quest/comic2.mp3',
  comic3: '/audio/quest/comic3.mp3',
  feedback_approved: '/audio/quest/feedback_approved.mp3',
  feedback_hint: '/audio/quest/feedback_hint.mp3'
};

class ArabicAudioPlayer {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.activeKey = null;
    this.onEndCallback = null;
    this.onStartCallback = null;

    // Preload audio elements
    this.audioPool = {};
    if (typeof window !== 'undefined') {
      try {
        Object.entries(AUDIO_FILES).forEach(([key, src]) => {
          const a = new Audio();
          a.preload = 'auto';
          a.src = src;
          this.audioPool[key] = a;
        });
      } catch (e) {}
    }
  }

  stop() {
    this.isPlaying = false;
    this.activeKey = null;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
      } catch (e) {}
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    const cb = this.onEndCallback;
    this.onEndCallback = null;
    this.onStartCallback = null;
    if (cb) {
      try { cb(); } catch (e) {}
    }
  }

  // Play pre-recorded studio Arabic MP3 file (100% reliable, zero external dependencies)
  playAudio(key, { onStart, onEnd } = {}) {
    this.stop();

    const audioSrc = AUDIO_FILES[key];
    if (!audioSrc) {
      console.warn('Unknown audio key:', key);
      if (onEnd) onEnd();
      return;
    }

    this.isPlaying = true;
    this.activeKey = key;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;

    // Use pooled audio or new instance
    let audio = this.audioPool[key];
    if (!audio) {
      audio = new Audio(audioSrc);
      this.audioPool[key] = audio;
    }

    audio.currentTime = 0;
    this.currentAudio = audio;

    audio.onplay = () => {
      this.isPlaying = true;
      if (this.onStartCallback) {
        try { this.onStartCallback(key); } catch (e) {}
      }
    };

    audio.onended = () => {
      this.stop();
    };

    audio.onerror = (err) => {
      console.warn('Audio playback error for:', audioSrc, err);
      this.stop();
    };

    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((err) => {
        console.warn('Audio play() error:', err);
        this.stop();
      });
    }
  }

  // General speak method that matches text/keys and plays the local MP3 file
  speak(textOrKey, options = {}) {
    if (AUDIO_FILES[textOrKey]) {
      this.playAudio(textOrKey, options);
      return;
    }

    // Match text to corresponding local audio file
    if (typeof textOrKey === 'string') {
      if (textOrKey.includes('المشهد الأول') || textOrKey.includes('ذبلت واصفرّت')) {
        this.playAudio('comic1', options);
        return;
      }
      if (textOrKey.includes('المشهد الثاني') || textOrKey.includes('لا تقلق يا كنان')) {
        this.playAudio('comic2', options);
        return;
      }
      if (textOrKey.includes('المشهد الثالث') || textOrKey.includes('نقل النبتة')) {
        this.playAudio('comic3', options);
        return;
      }
      if (textOrKey.includes('أهلاً بك يا بطلنا') || textOrKey.includes('مرشدك العلمي') || textOrKey.includes('رحلة المستكشف')) {
        this.playAudio('welcome', options);
        return;
      }
      if (textOrKey.includes('المحطة الأولى') || textOrKey.includes('شعلة الفضول')) {
        this.playAudio('station1', options);
        return;
      }
      if (textOrKey.includes('المحطة الثانية') || textOrKey.includes('مختبر التساؤل')) {
        this.playAudio('station2', options);
        return;
      }
      if (textOrKey.includes('المحطة الثالثة') || textOrKey.includes('الفرضية الذكية')) {
        this.playAudio('station3', options);
        return;
      }
      if (textOrKey.includes('مبارك من أعماق القلب') || textOrKey.includes('شهادة المستكشف')) {
        this.playAudio('station4', options);
        return;
      }
      if (textOrKey.includes('فزت بوسام') || textOrKey.includes('ممتاز') || textOrKey.includes('رائع')) {
        this.playAudio('feedback_approved', options);
        return;
      }
      if (textOrKey.includes('سؤال') || textOrKey.includes('تغذية') || textOrKey.includes('محاولة')) {
        this.playAudio('feedback_hint', options);
        return;
      }
    }

    // Fallback: Web Speech API for other text
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.stop();
      try {
        const utterance = new SpeechSynthesisUtterance(textOrKey);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const arVoice = voices.find(v => (v.lang && v.lang.startsWith('ar')) || (v.name && v.name.toLowerCase().includes('arabic')));
        if (arVoice) utterance.voice = arVoice;

        utterance.onstart = () => {
          this.isPlaying = true;
          if (options.onStart) options.onStart();
        };
        utterance.onend = () => this.stop();
        utterance.onerror = () => this.stop();
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        this.stop();
      }
    }
  }
}

export const arabicTTS = new ArabicAudioPlayer();
export default arabicTTS;
