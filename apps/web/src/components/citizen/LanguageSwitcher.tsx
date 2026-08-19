import React from 'react';
import { useTranslation } from 'react-i18next';

type Lang = 'en' | 'hi';

interface LanguageSwitcherProps {
  current: Lang;
  onChange: (lang: Lang) => void;
}

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'EN',  flag: '🇮🇳' },
  { code: 'hi', label: 'हिं', flag: '🇮🇳' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ current, onChange }) => {
  const { i18n } = useTranslation();

  const handleChange = (code: Lang) => {
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <div className="lang-switcher" role="group" aria-label="Language selector">
      {LANGS.map((l) => (
        <button
          key={l.code}
          id={`lang-btn-${l.code}`}
          className={`lang-btn ${current === l.code ? 'lang-btn--active' : ''}`}
          onClick={() => handleChange(l.code)}
          aria-pressed={current === l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
