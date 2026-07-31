import { useState, useRef } from 'react';
import { FiPlus, FiTrash2, FiUpload, FiCopy, FiCheck, FiX, FiImage } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './SectionManager.css';

export default function SectionManager() {
  const { config, updateConfig } = useSiteConfig();
  const { sections } = config;
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRefs = useRef({});

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const coreSections = ['shopByProduct', 'delivery', 'shopByConcern', 'press', 'reviews', 'ourStory'];

  const toggleSection = (id) => {
    const updated = sections.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s);
    updateConfig('sections', updated);
  };

  const moveSection = (id, direction) => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    const updated = sorted.map((s, i) => {
      if (i === idx) return { ...s, order: newIdx };
      if (i === newIdx) return { ...s, order: idx };
      return { ...s, order: i };
    });
    updateConfig('sections', updated);
  };

  const deleteSection = (id) => {
    if (coreSections.includes(id)) {
      alert('Core sections cannot be deleted. You can disable them instead.');
      return;
    }
    const updated = sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }));
    updateConfig('sections', updated);
    setDeleteConfirm(null);
  };

  const handleBgImageUpload = (sectionId, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = sections.map((s) => s.id === sectionId ? { ...s, bgImage: reader.result } : s);
      updateConfig('sections', updated);
    };
    reader.readAsDataURL(file);
  };

  const handleBgImageUrl = (sectionId, url) => {
    const updated = sections.map((s) => s.id === sectionId ? { ...s, bgImage: url } : s);
    updateConfig('sections', updated);
  };

  const removeBgImage = (sectionId) => {
    const updated = sections.map((s) => s.id === sectionId ? { ...s, bgImage: '' } : s);
    updateConfig('sections', updated);
  };

  const copyImageUrl = (sectionId, url) => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedId(sectionId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  /* ── Delivery step helpers ── */
  const addDeliveryStep = () => {
    const steps = [...config.delivery.steps, { image: '', label: '' }];
    updateConfig('delivery.steps', steps);
  };
  const updateDeliveryStep = (idx, field, value) => {
    const steps = [...config.delivery.steps];
    steps[idx] = { ...steps[idx], [field]: value };
    updateConfig('delivery.steps', steps);
  };
  const removeDeliveryStep = (idx) => {
    updateConfig('delivery.steps', config.delivery.steps.filter((_, i) => i !== idx));
  };
  const handleDeliveryStepImageUpload = (idx, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateDeliveryStep(idx, 'image', reader.result);
    };
    reader.readAsDataURL(file);
  };

  /* ── Press logos helpers ── */
  const addPressLogo = () => {
    const logos = [...config.press.logos, { name: 'New Publication', url: '#', image: '' }];
    updateConfig('press.logos', logos);
  };
  const updatePressLogo = (idx, field, value) => {
    const logos = [...config.press.logos];
    logos[idx] = { ...logos[idx], [field]: value };
    updateConfig('press.logos', logos);
  };
  const removePressLogo = (idx) => {
    updateConfig('press.logos', config.press.logos.filter((_, i) => i !== idx));
  };
  const handlePressLogoImageUpload = (idx, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updatePressLogo(idx, 'image', reader.result);
    };
    reader.readAsDataURL(file);
  };

  /* ── Category helpers ── */
  const addCategory = () => {
    const cats = [...config.categories, { id: `cat-${Date.now()}`, label: 'New Category' }];
    updateConfig('categories', cats);
  };
  const updateCategory = (idx, field, value) => {
    const cats = [...config.categories];
    if (field === 'id') {
      cats[idx] = { ...cats[idx], id: value.toLowerCase().replace(/\s+/g, '-') };
    } else {
      cats[idx] = { ...cats[idx], [field]: value };
    }
    updateConfig('categories', cats);
  };
  const removeCategory = (idx) => {
    if (config.categories[idx].id === 'all') return;
    updateConfig('categories', config.categories.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* ── Section Toggle & Reorder ── */}
      <div className="dash-panel">
        <div className="section-manager-header">
          <div>
            <h2 className="dash-panel__title">🧩 Section Manager</h2>
            <p className="dash-panel__subtitle">Toggle, reorder, or remove homepage sections.</p>
          </div>
        </div>

        <div className="section-list">
          {sortedSections.map((section, i) => (
            <div key={section.id} className={`section-item ${!section.enabled ? 'section-item--disabled' : ''}`}>
              <div className="section-item__order">
                <button className="section-item__move" onClick={() => moveSection(section.id, -1)} disabled={i === 0}>↑</button>
                <span className="section-item__index">{i + 1}</span>
                <button className="section-item__move" onClick={() => moveSection(section.id, 1)} disabled={i === sortedSections.length - 1}>↓</button>
              </div>

              <div className="section-item__info">
                <h4 className="section-item__label">{section.label}</h4>
                <div className="section-item__meta">
                  <span className="section-item__id">{section.id}</span>
                  {coreSections.includes(section.id) && <span className="section-item__core-badge">Core</span>}
                  {section.template && !coreSections.includes(section.id) && (
                    <span className="section-item__template">{section.template}</span>
                  )}
                </div>
              </div>

              <div className="section-item__actions">
                {!coreSections.includes(section.id) && (
                  <button className="section-item__img-btn" onClick={() => {
                    if (!fileInputRefs.current[section.id]) {
                      fileInputRefs.current[section.id] = document.createElement('input');
                      fileInputRefs.current[section.id].type = 'file';
                      fileInputRefs.current[section.id].accept = 'image/*';
                      fileInputRefs.current[section.id].addEventListener('change', (e) => {
                        handleBgImageUpload(section.id, e.target.files?.[0]);
                      });
                    }
                    fileInputRefs.current[section.id].click();
                  }} title="Add background image">
                    <FiImage size={14} />
                  </button>
                )}

                {!coreSections.includes(section.id) && (
                  deleteConfirm === section.id ? (
                    <div className="section-item__confirm">
                      <button className="section-item__confirm-yes" onClick={() => deleteSection(section.id)}>
                        <FiCheck size={12} /> Yes
                      </button>
                      <button className="section-item__confirm-no" onClick={() => setDeleteConfirm(null)}>
                        <FiX size={12} /> No
                      </button>
                    </div>
                  ) : (
                    <button className="section-item__delete" onClick={() => setDeleteConfirm(section.id)} title="Delete">
                      <FiTrash2 size={14} />
                    </button>
                  )
                )}

                <label className="section-item__toggle">
                  <input type="checkbox" checked={section.enabled} onChange={() => toggleSection(section.id)} />
                  <span className="section-item__toggle-slider"></span>
                </label>
              </div>

              {/* BG preview for custom sections */}
              {!coreSections.includes(section.id) && section.bgImage && (
                <div className="section-item__bg-preview">
                  <div className="section-item__bg-thumb" style={{ backgroundImage: `url(${section.bgImage})` }} />
                  <div className="section-item__bg-actions">
                    <button className="section-item__bg-action-btn" onClick={() => copyImageUrl(section.id, section.bgImage)}>
                      {copiedId === section.id ? <FiCheck size={12} /> : <FiCopy size={12} />}
                      {copiedId === section.id ? 'Copied!' : 'Copy URL'}
                    </button>
                    <button className="section-item__bg-action-btn section-item__bg-action-btn--remove" onClick={() => removeBgImage(section.id)}>
                      <FiX size={12} /> Remove
                    </button>
                  </div>
                </div>
              )}

              {!coreSections.includes(section.id) && !section.bgImage && (
                <div className="section-item__url-input">
                  <FiImage size={13} className="section-item__url-icon" />
                  <input
                    className="section-item__url-field"
                    placeholder="Paste background image URL..."
                    value={section.bgImage || ''}
                    onChange={(e) => handleBgImageUrl(section.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Shop by Product Settings ── */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">🛒 Shop by Product Settings</h3>
        <p className="dash-panel__subtitle">Configure the product showcase section</p>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Section Title</label>
            <input className="dash-field__input" value={config.shopByProduct?.title || 'Shop by Product'}
              onChange={(e) => updateConfig('shopByProduct.title', e.target.value)} />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">Display Mode</label>
            <select className="dash-field__input" value={config.shopByProduct?.displayMode || 'slider'}
              onChange={(e) => updateConfig('shopByProduct.displayMode', e.target.value)}>
              <option value="slider">Slider (horizontal scroll)</option>
              <option value="grid">Grid (static)</option>
            </select>
          </div>
        </div>
        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Coupon Hint Text</label>
            <input className="dash-field__input" value={config.shopByProduct?.hint || ''}
              onChange={(e) => updateConfig('shopByProduct.hint', e.target.value)} />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">View All Text</label>
            <input className="dash-field__input" value={config.shopByProduct?.viewAllText || 'View All'}
              onChange={(e) => updateConfig('shopByProduct.viewAllText', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Delivery Section Settings ── */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">🚚 Delivery Section Settings</h3>
        <p className="dash-panel__subtitle">Edit the delivery process section content and steps</p>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Title</label>
            <input className="dash-field__input" value={config.delivery.title}
              onChange={(e) => updateConfig('delivery.title', e.target.value)} />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">Subtitle</label>
            <input className="dash-field__input" value={config.delivery.subtitle}
              onChange={(e) => updateConfig('delivery.subtitle', e.target.value)} />
          </div>
        </div>

        <h4 style={{ marginTop: '16px', marginBottom: '10px', fontSize: '0.88rem', fontWeight: 600 }}>Delivery Steps</h4>
        <div className="crud-list">
          {config.delivery.steps.map((step, i) => (
            <div key={i} className="delivery-step-card">
              {/* Step label + delete */}
              <div className="delivery-step-card__header">
                <span className="delivery-step-card__title">Step {i + 1}</span>
                <button className="crud-list__delete" onClick={() => removeDeliveryStep(i)} title="Delete step">
                  <FiTrash2 size={13} />
                </button>
              </div>

              {/* Image preview */}
              {step.image && (
                <div className="delivery-step-card__preview">
                  <img src={step.image} alt="" className="delivery-step-card__preview-img" />
                  <button className="delivery-step-card__preview-remove" onClick={() => updateDeliveryStep(i, 'image', '')}
                    title="Remove image">
                    <FiX size={14} /> Remove
                  </button>
                </div>
              )}

              {/* Upload zone */}
              {!step.image && (
                <>
                  <div className="delivery-step-card__upload" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleDeliveryStepImageUpload(i, e.target.files?.[0]);
                    input.click();
                  }}>
                    <FiUpload size={18} className="delivery-step-card__upload-icon" />
                    <p className="delivery-step-card__upload-text"><strong>Click to upload</strong> image</p>
                    <p className="delivery-step-card__upload-hint">PNG, JPG, SVG, WEBP</p>
                  </div>

                  {/* OR paste URL */}
                  <div className="delivery-step-card__url">
                    <div className="delivery-step-card__url-divider"><span>or paste image URL</span></div>
                    <div className="delivery-step-card__url-row">
                      <FiImage size={14} className="delivery-step-card__url-icon" />
                      <input
                        className="dash-field__input delivery-step-card__url-input"
                        value={step.image || ''}
                        onChange={(e) => updateDeliveryStep(i, 'image', e.target.value)}
                        placeholder="https://example.com/icon.svg"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <button className="dash-btn dash-btn--ghost" onClick={addDeliveryStep} style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Step
        </button>
      </div>

      {/* ── Shop by Concern Settings ── */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">🔍 Shop by Concern Settings</h3>
        <p className="dash-panel__subtitle">Configure section title and product categories</p>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Section Title</label>
            <input className="dash-field__input" value={config.shopByConcern?.title || 'Shop By Concern'}
              onChange={(e) => updateConfig('shopByConcern.title', e.target.value)} />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">View All Text</label>
            <input className="dash-field__input" value={config.shopByConcern?.viewAllText || 'View All'}
              onChange={(e) => updateConfig('shopByConcern.viewAllText', e.target.value)} />
          </div>
        </div>

        <h4 style={{ marginTop: '16px', marginBottom: '10px', fontSize: '0.88rem', fontWeight: 600 }}>Categories</h4>
        <div className="crud-list">
          {config.categories.map((cat, i) => (
            <div key={i} className="crud-list__row">
              <input className="dash-field__input" value={cat.id}
                onChange={(e) => updateCategory(i, 'id', e.target.value)}
                placeholder="ID" style={{ maxWidth: '140px' }}
                disabled={cat.id === 'all'} />
              <input className="dash-field__input" value={cat.label}
                onChange={(e) => updateCategory(i, 'label', e.target.value)} placeholder="Label" />
              <button className="crud-list__delete" onClick={() => removeCategory(i)} disabled={cat.id === 'all'}
                style={cat.id === 'all' ? { opacity: 0.3 } : {}}>
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <button className="dash-btn dash-btn--ghost" onClick={addCategory} style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Category
        </button>
      </div>

      {/* ── Press Section Settings ── */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">📰 Press / Media Settings</h3>
        <p className="dash-panel__subtitle">Manage press logos and links</p>

        <div className="crud-list">
          {config.press.logos.map((logo, i) => (
            <div key={i} className="delivery-step-card">
              {/* Name + URL + delete */}
              <div className="delivery-step-card__header">
                <input className="dash-field__input" value={logo.name}
                  onChange={(e) => updatePressLogo(i, 'name', e.target.value)} placeholder="Publication name" />
                <button className="crud-list__delete" onClick={() => removePressLogo(i)} title="Delete">
                  <FiTrash2 size={13} />
                </button>
              </div>



              {/* Image preview */}
              {logo.image && (
                <div className="delivery-step-card__preview">
                  <img src={logo.image} alt="" className="delivery-step-card__preview-img" />
                  <button className="delivery-step-card__preview-remove" onClick={() => updatePressLogo(i, 'image', '')}
                    title="Remove image">
                    <FiX size={14} /> Remove
                  </button>
                </div>
              )}

              {/* Upload zone */}
              {!logo.image && (
                <>
                  <div className="delivery-step-card__upload" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handlePressLogoImageUpload(i, e.target.files?.[0]);
                    input.click();
                  }}>
                    <FiUpload size={18} className="delivery-step-card__upload-icon" />
                    <p className="delivery-step-card__upload-text"><strong>Click to upload</strong> logo image</p>
                    <p className="delivery-step-card__upload-hint">PNG, JPG, SVG, WEBP</p>
                  </div>

                  {/* OR paste URL */}
                  <div className="delivery-step-card__url">
                    <div className="delivery-step-card__url-divider"><span>or paste image URL</span></div>
                    <div className="delivery-step-card__url-row">
                      <FiImage size={14} className="delivery-step-card__url-icon" />
                      <input
                        className="dash-field__input delivery-step-card__url-input"
                        value={logo.image || ''}
                        onChange={(e) => updatePressLogo(i, 'image', e.target.value)}
                        placeholder="https://example.com/logo.svg"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <button className="dash-btn dash-btn--ghost" onClick={addPressLogo} style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Publication
        </button>
      </div>

      {/* ── Review Section Settings ── */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">⭐ Reviews Section Settings</h3>
        <p className="dash-panel__subtitle">Edit the reviews and ratings display</p>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Google Rating</label>
            <input className="dash-field__input" type="number" min="0" max="5" step="0.1"
              value={config.reviewsSection.googleRating}
              onChange={(e) => updateConfig('reviewsSection.googleRating', Number(e.target.value))} />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">Total Reviews</label>
            <input className="dash-field__input" type="number" value={config.reviewsSection.totalReviews}
              onChange={(e) => updateConfig('reviewsSection.totalReviews', Number(e.target.value))} />
          </div>
        </div>

        {/* Image upload */}
        <h4 style={{ marginTop: '16px', marginBottom: '10px', fontSize: '0.88rem', fontWeight: 600 }}>Section Image (optional)</h4>
        <div className="delivery-step-card">
          {config.reviewsSection.image ? (
            <div className="delivery-step-card__preview">
              <img src={config.reviewsSection.image} alt="Review section" className="delivery-step-card__preview-img" />
              <button
                className="delivery-step-card__preview-remove"
                onClick={() => updateConfig('reviewsSection.image', '')}
                title="Remove image"
              >
                <FiX size={14} /> Remove
              </button>
            </div>
          ) : (
            <>
              <div className="delivery-step-card__upload" onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !file.type.startsWith('image/')) return;
                  const reader = new FileReader();
                  reader.onloadend = () => updateConfig('reviewsSection.image', reader.result);
                  reader.readAsDataURL(file);
                };
                input.click();
              }}>
                <FiUpload size={18} className="delivery-step-card__upload-icon" />
                <p className="delivery-step-card__upload-text"><strong>Click to upload</strong> image</p>
                <p className="delivery-step-card__upload-hint">PNG, JPG, SVG, WEBP</p>
              </div>
              <div className="delivery-step-card__url">
                <div className="delivery-step-card__url-divider"><span>or paste image URL</span></div>
                <div className="delivery-step-card__url-row">
                  <FiImage size={14} className="delivery-step-card__url-icon" />
                  <input
                    className="dash-field__input delivery-step-card__url-input"
                    value={config.reviewsSection.image || ''}
                    onChange={(e) => updateConfig('reviewsSection.image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Our Story Settings ── */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">📖 Our Story Settings</h3>
        <p className="dash-panel__subtitle">Configure your brand story section</p>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Section Title</label>
            <input className="dash-field__input" value={config.ourStory?.title || ''}
              onChange={(e) => updateConfig('ourStory.title', e.target.value)} />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">Subtitle</label>
            <input className="dash-field__input" value={config.ourStory?.subtitle || ''}
              onChange={(e) => updateConfig('ourStory.subtitle', e.target.value)} />
          </div>
        </div>

        <div className="dash-field">
          <label className="dash-field__label">Story Content</label>
          <textarea className="dash-field__input" rows="5" value={config.ourStory?.content || ''}
            onChange={(e) => updateConfig('ourStory.content', e.target.value)} />
        </div>

        {/* Image upload */}
        <h4 style={{ marginTop: '16px', marginBottom: '10px', fontSize: '0.88rem', fontWeight: 600 }}>Story Image</h4>
        <div className="delivery-step-card">
          {config.ourStory?.image ? (
            <div className="delivery-step-card__preview">
              <img src={config.ourStory.image} alt="Our Story" className="delivery-step-card__preview-img" />
              <button
                className="delivery-step-card__preview-remove"
                onClick={() => updateConfig('ourStory.image', '')}
                title="Remove image"
              >
                <FiX size={14} /> Remove
              </button>
            </div>
          ) : (
            <>
              <div className="delivery-step-card__upload" onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !file.type.startsWith('image/')) return;
                  const reader = new FileReader();
                  reader.onloadend = () => updateConfig('ourStory.image', reader.result);
                  reader.readAsDataURL(file);
                };
                input.click();
              }}>
                <FiUpload size={18} className="delivery-step-card__upload-icon" />
                <p className="delivery-step-card__upload-text"><strong>Click to upload</strong> image</p>
                <p className="delivery-step-card__upload-hint">PNG, JPG, SVG, WEBP</p>
              </div>
              <div className="delivery-step-card__url">
                <div className="delivery-step-card__url-divider"><span>or paste image URL</span></div>
                <div className="delivery-step-card__url-row">
                  <FiImage size={14} className="delivery-step-card__url-icon" />
                  <input
                    className="dash-field__input delivery-step-card__url-input"
                    value={config.ourStory?.image || ''}
                    onChange={(e) => updateConfig('ourStory.image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
