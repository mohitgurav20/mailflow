import React from 'react';
import { useTranslation } from 'react-i18next';
import { Consignment } from '@mailflow/shared-types';
import { IconTimeline } from './IconTimeline';

interface ParcelStatusCardProps {
  consignment: Consignment;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  INDUCTED:     { emoji: '📬', label: 'Booked',          color: '#1A6B3C', bg: '#D1FAE5' },
  IN_TRANSIT:   { emoji: '🚀', label: 'On the Way',      color: '#0066CC', bg: '#DBEAFE' },
  REROUTED:     { emoji: '🔄', label: 'New Route Found', color: '#D97706', bg: '#FEF3C7' },
  DELAYED_RISK: { emoji: '⚠️', label: 'Running Late',    color: '#D4380D', bg: '#FEE2E2' },
  DELIVERED:    { emoji: '✅', label: 'Delivered',        color: '#1A6B3C', bg: '#D1FAE5' },
};

const MODE_EMOJI: Record<string, string> = {
  COMMERCIAL_AIR: '✈️',
  RMS_RAIL:       '🚂',
  MMS_ROAD:       '🚛',
  HIRED_ROAD:     '🚛',
  SURFACE_WATER:  '⛴️',
};

function getProgress(c: Consignment): number {
  if (c.status === 'DELIVERED') return 100;
  if (c.status === 'INDUCTED')  return 10;
  const ratio = Math.min(c.elapsedHours / c.targetSlaHours, 0.95);
  return Math.round(ratio * 90) + 5;
}

function humanEta(eta: string): string {
  try {
    const d = new Date(eta.replace(' ', 'T'));
    const now = new Date('2026-08-15T12:00:00');
    const diffMs = d.getTime() - now.getTime();
    const diffH = diffMs / 3600000;

    if (diffH < 0) return 'Arrived';
    if (diffH < 6) return `In about ${Math.round(diffH)} hours`;
    const diffDays = Math.floor(diffH / 24);
    const remH = Math.round(diffH % 24);
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (diffDays === 0) return `Today by ${timeStr}`;
    if (diffDays === 1) return `Tomorrow by ${timeStr}`;
    return `In ${diffDays} days · ${timeStr}`;
  } catch {
    return eta;
  }
}

export const ParcelStatusCard: React.FC<ParcelStatusCardProps> = ({ consignment, onClose }) => {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[consignment.status] || STATUS_CONFIG.IN_TRANSIT;
  const progress = getProgress(consignment);

  // Detect transport mode from current leg
  const currentLeg = consignment.timeline[consignment.timeline.length - 1]?.statusText || '';
  let modeEmoji = '📦';
  if (currentLeg.toLowerCase().includes('air') || currentLeg.toLowerCase().includes('flight')) modeEmoji = '✈️';
  else if (currentLeg.toLowerCase().includes('train') || currentLeg.toLowerCase().includes('rail')) modeEmoji = '🚂';
  else if (currentLeg.toLowerCase().includes('ship') || currentLeg.toLowerCase().includes('vessel')) modeEmoji = '⛴️';
  else if (currentLeg.toLowerCase().includes('truck') || currentLeg.toLowerCase().includes('mms')) modeEmoji = '🚛';

  return (
    <div className="parcel-card-overlay" onClick={onClose}>
      <div className="parcel-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="parcel-card__header" style={{ background: cfg.bg }}>
          <div className="parcel-card__tracking">
            <span className="parcel-card__icon">{cfg.emoji}</span>
            <div>
              <p className="parcel-card__label">Your Parcel</p>
              <p className="parcel-card__number">{consignment.trackingNumber}</p>
            </div>
          </div>
          <button className="parcel-card__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Status Badge */}
        <div className="parcel-card__status-band" style={{ background: cfg.bg, color: cfg.color }}>
          <span className="parcel-card__status-mode">{modeEmoji}</span>
          <div>
            <p className="parcel-card__status-text" style={{ color: cfg.color }}>{cfg.label}</p>
            <p className="parcel-card__route">
              {consignment.senderCity} → {consignment.receiverCity}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="parcel-card__body">
          <div className="parcel-progress">
            <div className="parcel-progress__labels">
              <span>📦 {consignment.senderCity}</span>
              <span>{consignment.receiverCity} 🏠</span>
            </div>
            <div className="parcel-progress__bar">
              <div
                className="parcel-progress__fill"
                style={{
                  width: `${progress}%`,
                  background: consignment.isDelayedRisk
                    ? 'linear-gradient(90deg, #D97706, #D4380D)'
                    : 'linear-gradient(90deg, #FF6B00, #1A6B3C)',
                }}
              />
              <div className="parcel-progress__truck" style={{ left: `calc(${progress}% - 16px)` }}>
                {modeEmoji}
              </div>
            </div>
            <p className="parcel-progress__pct">{progress}% of journey done</p>
          </div>

          {/* ETA */}
          <div className="parcel-card__eta">
            <span className="parcel-card__eta-icon">🕐</span>
            <div>
              <p className="parcel-card__eta-label">{t('tracking.eta_label')}</p>
              <p className="parcel-card__eta-value">{humanEta(consignment.currentEta)}</p>
            </div>
          </div>

          {/* Delay warning */}
          {consignment.isDelayedRisk && (
            <div className="parcel-card__delay-banner">
              <span>⚠️</span>
              <p>{consignment.delayReason}</p>
            </div>
          )}

          {/* Weight & class info */}
          <div className="parcel-card__meta">
            <div className="parcel-card__meta-item">
              <span>⚖️</span>
              <span>{consignment.weightKg} kg</span>
            </div>
            <div className="parcel-card__meta-item">
              <span>📋</span>
              <span>{consignment.mailClass.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="parcel-card__actions">
            <a href="tel:18002666868" className="parcel-card__btn parcel-card__btn--secondary">
              📞 {t('tracking.call_office')}
            </a>
            <button
              className="parcel-card__btn parcel-card__btn--primary"
              onClick={() => navigator.share?.({ title: 'Track my parcel', url: window.location.href })}
            >
              🔗 {t('tracking.share')}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="parcel-card__timeline">
          <IconTimeline consignment={consignment} />
        </div>
      </div>
    </div>
  );
};
