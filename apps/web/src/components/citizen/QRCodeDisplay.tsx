import React from 'react';
import { useTranslation } from 'react-i18next';
// @ts-ignore — qrcode.react types included with package
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  trackingNumber: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ trackingNumber }) => {
  const { t } = useTranslation();
  const trackUrl = `${window.location.origin}?track=${trackingNumber}`;

  return (
    <div className="qr-container">
      <QRCodeSVG
        value={trackUrl}
        size={160}
        bgColor="#FFFFFF"
        fgColor="#0F172A"
        level="H"
        includeMargin={true}
      />
      <div className="qr-info">
        <p className="qr-title">{t('qr.title')}</p>
        <p className="qr-subtitle">{t('qr.subtitle')}</p>
        <p className="qr-number">{trackingNumber}</p>
      </div>
    </div>
  );
};
