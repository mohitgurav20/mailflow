import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMockStore } from '../../mock/mockStore';
import { VoiceSearch } from './VoiceSearch';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ParcelStatusCard } from './ParcelStatusCard';
import { QRCodeDisplay } from './QRCodeDisplay';
import { Consignment } from '@mailflow/shared-types';

interface CitizenHomeProps {
  onSwitchToOfficer: () => void;
}

const DEMO_NUMBERS = [
  'SP892019482IN',
  'BP401928374IN',
  'SP102938475IN',
  'RP554433221IN',
  'SP776655443IN',
];

export const CitizenHome: React.FC<CitizenHomeProps> = ({ onSwitchToOfficer }) => {
  const { t, i18n } = useTranslation();
  const { consignments } = useMockStore();

  const [trackInput, setTrackInput]   = useState('');
  const [result, setResult]           = useState<Consignment | null>(null);
  const [notFound, setNotFound]       = useState(false);
  const [lang, setLang]               = useState<'en' | 'hi'>('en');
  const [showQR, setShowQR]           = useState(false);

  const handleTrack = (num?: string) => {
    const q = (num ?? trackInput).trim().toUpperCase();
    setNotFound(false);
    if (!q) return;

    const found = consignments.find(
      (c) => c.trackingNumber.toUpperCase() === q
    );
    if (found) {
      setResult(found);
      setShowQR(false);
    } else {
      setNotFound(true);
      setResult(null);
    }
  };

  const handleVoiceResult = (text: string) => {
    setTrackInput(text);
    handleTrack(text);
  };

  const handleLangChange = (l: 'en' | 'hi') => {
    setLang(l);
    i18n.changeLanguage(l);
  };

  return (
    <div className="citizen-home">

      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="citizen-header">
        <div className="citizen-header__brand">
          <span className="citizen-header__logo">📮</span>
          <div>
            <h1 className="citizen-header__title">{t('app_name')}</h1>
            <p className="citizen-header__sub">India Post · Track Your Parcel</p>
          </div>
        </div>
        <div className="citizen-header__controls">
          <LanguageSwitcher current={lang} onChange={handleLangChange} />
          <button
            id="switch-to-officer"
            className="citizen-officer-btn"
            onClick={onSwitchToOfficer}
            title="Officer Dashboard"
          >
            🖥️ Officer Mode
          </button>
        </div>
      </header>

      {/* ── Hero Search ──────────────────────────────────────── */}
      <section className="citizen-hero">
        <div className="citizen-hero__content">
          <h2 className="citizen-hero__heading">{t('tracking.title')}</h2>
          <p className="citizen-hero__sub">
            Type or <strong>speak</strong> your tracking number — it's that simple!
          </p>

          <div className="citizen-search-box">
            <input
              id="tracking-input"
              type="text"
              className="citizen-search-input"
              placeholder={t('tracking.placeholder')}
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              id="track-btn"
              className="citizen-search-btn"
              onClick={() => handleTrack()}
            >
              {t('tracking.track_btn')}
            </button>
            <VoiceSearch onResult={handleVoiceResult} />
          </div>

          {notFound && (
            <p className="citizen-not-found">❌ {t('tracking.not_found')}</p>
          )}
        </div>

        {/* ── Animated stats strip ─────────────────────────── */}
        <div className="citizen-stats-strip">
          {[
            { icon: '📮', value: '1,64,999', label: 'Post Offices' },
            { icon: '📦', value: '3.2 Cr+',  label: 'Parcels Tracked Daily' },
            { icon: '✅', value: '94.2%',    label: 'On-Time Delivery' },
            { icon: '🌏', value: '220+',     label: 'Countries Served' },
          ].map((s) => (
            <div key={s.label} className="citizen-stat">
              <span className="citizen-stat__icon">{s.icon}</span>
              <span className="citizen-stat__value">{s.value}</span>
              <span className="citizen-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo Quick-Access ────────────────────────────────── */}
      {!result && (
        <section className="citizen-demo-section">
          <p className="citizen-demo-label">🎯 Try a demo tracking number:</p>
          <div className="citizen-demo-chips">
            {DEMO_NUMBERS.map((num) => (
              <button
                key={num}
                className="citizen-demo-chip"
                onClick={() => { setTrackInput(num); handleTrack(num); }}
              >
                {num}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Parcel Result Overlay ────────────────────────────── */}
      {result && (
        <ParcelStatusCard
          consignment={result}
          onClose={() => setResult(null)}
        />
      )}

      {/* ── QR Section ───────────────────────────────────────── */}
      {result && showQR && (
        <QRCodeDisplay trackingNumber={result.trackingNumber} />
      )}

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="citizen-how-section">
        <h2 className="citizen-section-title">📖 How to Track Your Parcel</h2>
        <div className="citizen-steps">
          {[
            { step: '1', icon: '🧾', title: 'Find the Receipt', desc: 'Get the tracking number from your post office receipt (starts with SP, RP, or BP)' },
            { step: '2', icon: '⌨️', title: 'Type or Speak It', desc: 'Enter the number above, or tap the mic button and say it out loud in Hindi or English' },
            { step: '3', icon: '📍', title: 'See Where It Is', desc: 'See exactly where your parcel is, how far it has traveled, and when it will arrive' },
            { step: '4', icon: '📲', title: 'Share with Anyone', desc: 'Tap "Share" to send the tracking link to anyone, or show the QR code for them to scan' },
          ].map((s) => (
            <div key={s.step} className="citizen-step-card">
              <div className="citizen-step-num">{s.step}</div>
              <div className="citizen-step-icon">{s.icon}</div>
              <h3 className="citizen-step-title">{s.title}</h3>
              <p className="citizen-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="citizen-footer">
        <p>🇮🇳 Department of Posts, Ministry of Communications, Government of India</p>
        <p>Helpline: <a href="tel:18002666868">1800-266-6868</a> (Toll Free · 8 AM – 8 PM)</p>
      </footer>
    </div>
  );
};
