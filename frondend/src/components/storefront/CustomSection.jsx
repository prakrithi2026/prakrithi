import { useSiteConfig } from '../../context/SiteConfigContext';
import './CustomSection.css';

export default function CustomSection({ sectionData }) {
  if (!sectionData) return null;

  const style = {};
  if (sectionData.bgImage) {
    style.background = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${sectionData.bgImage}) center/cover no-repeat`;
    style.color = 'white';
  } else if (sectionData.bgColor) {
    style.background = sectionData.bgColor;
  }

  return (
    <section className="custom-section" style={style}>
      <div className="custom-section__container">
        {sectionData.content?.title && (
          <h2 className="custom-section__title">{sectionData.content.title}</h2>
        )}
        {sectionData.content?.subtitle && (
          <p className="custom-section__subtitle">{sectionData.content.subtitle}</p>
        )}
        {sectionData.content?.body && (
          <p className="custom-section__body">{sectionData.content.body}</p>
        )}
        {!sectionData.content?.title && !sectionData.bgImage && (
          <div className="custom-section__placeholder">
            <span className="custom-section__placeholder-icon">⚡</span>
            <p className="custom-section__placeholder-text">
              <strong>{sectionData.label}</strong>
            </p>
            <p className="custom-section__placeholder-hint">
              Configure this section in the dashboard
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
