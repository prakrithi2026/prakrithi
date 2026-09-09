import { useSiteConfig } from '../../context/SiteConfigContext';
import { svgToDataUrl } from '../../utils/imageOptimizer';
import './DeliverySection.css';

export default function DeliverySection() {
  const { config } = useSiteConfig();
  const { delivery } = config;

  if (!delivery) return null;

  // Only render steps that have an SVG code or image URL added by the admin
  const visibleSteps = (delivery.steps || []).filter(
    (step) => Boolean(step.image && typeof step.image === 'string' && step.image.trim())
  );

  return (
    <section className="delivery-section">
      <div className="delivery-banner">
        <div className="delivery-left">
          <h3>{delivery.title}<br/>{delivery.subtitle}</h3>
          {delivery.tcNote && <p className="tc-note">{delivery.tcNote}</p>}
        </div>
        {visibleSteps.length > 0 && (
          <div className="delivery-steps">
            {visibleSteps.map((step, i) => {
              const stepImage = svgToDataUrl(step.image);
              return (
                <div key={i} className="delivery-step-group">
                  <div className="delivery-step">
                    <div className="step-icon">
                      <img
                        src={stepImage}
                        alt={step.label || `Step ${i + 1}`}
                        className="step-icon-img"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  {i < visibleSteps.length - 1 && (
                    <div className="step-arrow">
                      <img src="/images/Arrow.png" alt="→" className="step-arrow-img" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
