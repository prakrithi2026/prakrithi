import { Fragment } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import defaultConfig from '../../data/defaultConfig';
import { svgToDataUrl } from '../../utils/imageOptimizer';
import './DeliverySection.css';

export default function DeliverySection() {
  const { config } = useSiteConfig();
  const { delivery } = config;

  if (!delivery || !delivery.steps) return null;

  // Ensure all steps exist (fallback to defaultConfig steps if fewer than 6 are stored)
  const steps = (delivery.steps.length >= (defaultConfig.delivery?.steps?.length || 6))
    ? delivery.steps
    : (defaultConfig.delivery?.steps || delivery.steps).map((defStep, i) => ({
        ...defStep,
        ...(delivery.steps[i] || {}),
        image: delivery.steps[i]?.image || defStep.image || '',
        label: delivery.steps[i]?.label || defStep.label || '',
      }));

  return (
    <section className="delivery-section">
      <div className="delivery-banner">
        <div className="delivery-left">
          <h3>{delivery.title}<br/>{delivery.subtitle}</h3>
          {delivery.tcNote && <p className="tc-note">{delivery.tcNote}</p>}
        </div>
        <div className="delivery-steps">
          {steps.map((step, i) => {
            const defStep = defaultConfig.delivery?.steps?.[i];
            const rawImage = step.image || defStep?.image || '';
            const stepImage = rawImage ? svgToDataUrl(rawImage) : '';
            const stepLabel = step.label || defStep?.label || `Step ${i + 1}`;
            return (
              <Fragment key={i}>
                <div className="delivery-step">
                  <div className="step-icon">
                    {stepImage ? (
                      <img
                        src={stepImage}
                        alt={stepLabel}
                        className="step-icon-img"
                        loading="lazy"
                      />
                    ) : (
                      <span className="step-icon-dot">●</span>
                    )}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="step-arrow" aria-hidden="true">
                    <img
                      src="/images/delivery_Arrow.svg"
                      alt="→"
                      className="step-arrow-img"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = '/images/delivery_Arrow.png'; }}
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
