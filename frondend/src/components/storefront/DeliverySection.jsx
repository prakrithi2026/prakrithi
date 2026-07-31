import { useSiteConfig } from '../../context/SiteConfigContext';
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
      <div className="delivery-banner" style={{ backgroundColor: theme.primaryColor }}>
        <div className="delivery-left">
          <h3>{delivery.title}<br/>{delivery.subtitle}</h3>
          {delivery.tcNote && <p className="tc-note">{delivery.tcNote}</p>}
        </div>
        <div className="delivery-steps">
          {delivery.steps.map((step, i) => (
            <div key={i} className="delivery-step-group">
              <div className="delivery-step">
                <div className="step-icon">
                  {step.image
                    ? <img src={step.image} alt={`Delivery Step ${i + 1}`} className="step-icon-img" />
                    : <span className="step-icon-placeholder">●</span>}
                </div>
              </div>
              {i < delivery.steps.length - 1 && (
                <div className="step-arrow">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
