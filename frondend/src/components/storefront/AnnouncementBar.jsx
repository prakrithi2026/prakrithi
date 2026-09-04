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

  return (
    <div
      className="announcement-bar"
      style={{ backgroundColor: announcement.bgColor, color: announcement.textColor }}
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
