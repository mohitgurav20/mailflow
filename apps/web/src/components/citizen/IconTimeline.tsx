import React from 'react';
import { useTranslation } from 'react-i18next';
import { Consignment } from '@mailflow/shared-types';

interface IconTimelineProps {
  consignment: Consignment;
}

const STEP_ICONS: Record<string, string> = {
  booked:   '📬',
  sorted:   '🏷️',
  air:      '✈️',
  rail:     '🚂',
  road:     '🚛',
  ship:     '⛴️',
  hub:      '🏭',
  delivery: '🛵',
  done:     '✅',
};

function getModeIcon(statusText: string): string {
  const t = statusText.toLowerCase();
  if (t.includes('air') || t.includes('flight') || t.includes('airport')) return STEP_ICONS.air;
  if (t.includes('train') || t.includes('rail') || t.includes('rajdhani') || t.includes('express')) return STEP_ICONS.rail;
  if (t.includes('ship') || t.includes('vessel') || t.includes('dock')) return STEP_ICONS.ship;
  if (t.includes('truck') || t.includes('mms') || t.includes('road') || t.includes('nh-')) return STEP_ICONS.road;
  if (t.includes('deliver')) return STEP_ICONS.delivery;
  if (t.includes('sort') || t.includes('pack') || t.includes('bag')) return STEP_ICONS.sorted;
  if (t.includes('book') || t.includes('induct') || t.includes('counter')) return STEP_ICONS.booked;
  return STEP_ICONS.hub;
};

function humanTime(timestamp: string): string {
  try {
    const d = new Date(timestamp.replace(' ', 'T'));
    const now = new Date('2026-08-15T12:00:00');
    const diffDays = Math.round((now.getTime() - d.getTime()) / 86400000);
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    if (diffDays === 0) return `Today at ${timeStr}`;
    if (diffDays === 1) return `Yesterday at ${timeStr}`;
    return `${dateStr} · ${timeStr}`;
  } catch {
    return timestamp;
  }
}

const FUTURE_STEPS: Record<string, { label: string; icon: string }[]> = {
  INDUCTED:     [
    { label: 'Sorting & Packing', icon: '🏷️' },
    { label: 'On the Way', icon: '🚛' },
    { label: 'Out for Delivery', icon: '🛵' },
    { label: 'Delivered ✅', icon: '✅' },
  ],
  IN_TRANSIT:   [
    { label: 'Arriving at Hub', icon: '🏭' },
    { label: 'Out for Delivery', icon: '🛵' },
    { label: 'Delivered ✅', icon: '✅' },
  ],
  REROUTED:     [
    { label: 'New Route Active', icon: '🔄' },
    { label: 'Out for Delivery', icon: '🛵' },
    { label: 'Delivered ✅', icon: '✅' },
  ],
  DELAYED_RISK: [
    { label: 'Awaiting Next Transport', icon: '⏳' },
    { label: 'Out for Delivery', icon: '🛵' },
    { label: 'Delivered ✅', icon: '✅' },
  ],
  DELIVERED:    [],
};

export const IconTimeline: React.FC<IconTimelineProps> = ({ consignment }) => {
  const { t } = useTranslation();
  const { timeline, status } = consignment;
  const futureSteps = FUTURE_STEPS[status] || [];

  return (
    <div className="icon-timeline">
      <h3 className="timeline-heading">{t('tracking.timeline_title')}</h3>

      <div className="timeline-list">
        {/* ── Past & current completed events ─────────────────────── */}
        {timeline.map((event, idx) => {
          const isLatest = idx === timeline.length - 1 && status !== 'DELIVERED';
          return (
            <div
              key={event.id}
              className={`tl-item tl-item--done ${isLatest ? 'tl-item--current' : ''}`}
            >
              <div className="tl-icon-wrap">
                <span className="tl-icon">{getModeIcon(event.statusText)}</span>
                {(idx < timeline.length - 1 || futureSteps.length > 0) && (
                  <div className="tl-line tl-line--done" />
                )}
              </div>
              <div className="tl-content">
                <p className="tl-status">{event.statusText}</p>
                <p className="tl-location">📍 {event.location}</p>
                <p className="tl-time">{humanTime(event.timestamp)}</p>
                {isLatest && (
                  <span className="tl-you-are-here">⟵ {t('timeline.current')}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* ── Future pending steps ──────────────────────────────────── */}
        {futureSteps.map((step, idx) => (
          <div key={`future-${idx}`} className="tl-item tl-item--pending">
            <div className="tl-icon-wrap">
              <span className="tl-icon tl-icon--pending">{step.icon}</span>
              {idx < futureSteps.length - 1 && (
                <div className="tl-line tl-line--pending" />
              )}
            </div>
            <div className="tl-content">
              <p className="tl-status tl-status--pending">{step.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
