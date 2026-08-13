import { useSiteConfig } from '../../context/SiteConfigContext';
import defaultConfig from '../../data/defaultConfig';
import './DeliverySection.css';

// iconMap commented out — icons are now uploaded images or pasted URLs
// const iconMap = {
//   bag: '🛍️',
//   seedling: '🌱',
//   check: '✅',
//   box: '📦',
//   truck: '🚚',
//   location: '📍',
// };

export default function DeliverySection() {
  const { config } = useSiteConfig();
  const { delivery, theme } = config;

  return (
    <section className="delivery-section">
      <div className="delivery-banner">
        <div className="delivery-left">
          <h3>{delivery.title}<br/>{delivery.subtitle}</h3>
          {delivery.tcNote && <p className="tc-note">{delivery.tcNote}</p>}
        </div>
        <div className="delivery-steps">
          {delivery.steps.map((step, i) => {
            const stepImage = step.image || defaultConfig.delivery.steps[i]?.image;
            return (
              <div key={i} className="delivery-step-group">
                <div className="delivery-step">
                  <div className="step-icon">
                    {stepImage ? (
                      <img src={stepImage} alt="" className="step-icon-img" loading="lazy" />
                    ) : (
                      <span className="step-icon-placeholder">●</span>
                    )}
                  </div>
                </div>
                {i < delivery.steps.length - 1 && (
                  <div className="step-arrow">
                    <img src="/images/Arrow.png" alt="→" className="step-arrow-img" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
