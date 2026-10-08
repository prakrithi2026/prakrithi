import { useState, useEffect } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './AnnouncementBar.css';

export default function AnnouncementBar() {
  const { config } = useSiteConfig();
  const announcement = config?.announcement || {};
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!announcement?.enabled || dismissed) {
      document.documentElement.style.setProperty('--announcement-height', '0px');
    } else {
      document.documentElement.style.setProperty('--announcement-height', '38px');
    }
    return () => {
      document.documentElement.style.setProperty('--announcement-height', '0px');
    };
  }, [announcement?.enabled, dismissed]);

  if (!announcement.enabled || dismissed) return null;

  const bg = (!announcement.bgColor || announcement.bgColor.toUpperCase() === '#00472A' || announcement.bgColor.toUpperCase() === '#083B2E')
    ? '#00433D'
    : announcement.bgColor;
  const textColor = announcement.textColor || '#FFFFFF';

  return (
    <div
      className="announcement-bar"
      style={{ backgroundColor: bg, color: textColor }}
    >
      <span className="announcement-spacer" />
      <p className="announcement-text">{announcement.text}</p>
      <button
        className="announcement-close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        style={{ color: announcement.textColor }}
      >
  
      </button>
    </div>
  );
}
