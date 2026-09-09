import { useSiteConfig } from '../../context/SiteConfigContext';
import defaultConfig from '../../data/defaultConfig';
import { svgToDataUrl } from '../../utils/imageOptimizer';
import './DeliverySection.css';

export default function DeliverySection() {
  const { config } = useSiteConfig();
  const { delivery } = config;

  if (!delivery || !delivery.steps) return null;

  return (
    <section className="delivery-section">
      <div className="delivery-banner">
        <div className="delivery-left">
          <h3>{delivery.title}<br/>{delivery.subtitle}</h3>
          {delivery.tcNote && <p className="tc-note">{delivery.tcNote}</p>}
        </div>
        <div className="delivery-steps">
          {delivery.steps.map((step, i) => {
            const rawImage = step.image || defaultConfig.delivery?.steps?.[i]?.image || '';
            const stepImage = rawImage ? svgToDataUrl(rawImage) : '';
            return (
              <div key={i} className="delivery-step-group">
                <div className="delivery-step">
                  <div className="step-icon">
                    {stepImage ? (
                      <img
                        src={stepImage}
                        alt={step.label || `Step ${i + 1}`}
                        className="step-icon-img"
                        loading="lazy"
                      />
                    ) : (
                      <span className="step-icon-dot">●</span>
                    )}
                  </div>
                </div>
                {i < delivery.steps.length - 1 && (
                  <div className="step-arrow">
                    <img
                      src="/images/arrow.svg"
                      alt="→"
                      className="step-arrow-img"
                      onError={(e) => { e.currentTarget.src = '/images/Arrow.png'; }}
                    />
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
