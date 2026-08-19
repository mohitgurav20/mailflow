import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface VoiceSearchProps {
  onResult: (text: string) => void;
}

export const VoiceSearch: React.FC<VoiceSearchProps> = ({ onResult }) => {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('errors.voice_not_supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      // Try all alternatives to extract alphanumeric tracking number
      for (let i = 0; i < event.results[0].length; i++) {
        const spoken: string = event.results[0][i].transcript;
        // Remove spaces, convert to uppercase → SP892019482IN style
        const cleaned = spoken
          .replace(/\s+/g, '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');
        if (cleaned.length >= 6) {
          onResult(cleaned);
          return;
        }
      }
      // Fallback: use first result as-is
      onResult(event.results[0][0].transcript.toUpperCase().replace(/\s+/g, ''));
    };

    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }, [lang, onResult, t]);

  return (
    <div className="voice-search-container">
      <button
        id="voice-search-btn"
        className={`voice-btn ${isListening ? 'voice-btn--listening' : ''}`}
        onClick={startListening}
        title={t('tracking.voice_hint')}
        aria-label="Voice search"
      >
        {isListening ? (
          <>
            <span className="voice-ripple" />
            <span className="voice-ripple voice-ripple--delay" />
            🎙️
          </>
        ) : (
          '🎤'
        )}
      </button>

      <select
        className="lang-select-mini"
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        aria-label="Voice language"
      >
        <option value="hi-IN">हिं</option>
        <option value="en-IN">EN</option>
        <option value="kn-IN">ಕನ್</option>
        <option value="ta-IN">தமி</option>
        <option value="te-IN">తెలు</option>
      </select>

      {isListening && (
        <span className="voice-status">🔴 Listening… speak your tracking number</span>
      )}
    </div>
  );
};
