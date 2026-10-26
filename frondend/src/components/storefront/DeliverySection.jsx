import { Fragment } from 'react';
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
              <Fragment key={i}>
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
                  <div className="step-arrow" aria-hidden="true">
                    <img
                      src="/images/delivery_Arrow.png"
                      alt="→"
                      className="step-arrow-img"
                      loading="lazy"
                    />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
