import { useState } from 'react';
import { FiPlus, FiTrash2, FiCopy, FiCheck, FiX, FiSave, FiRefreshCw } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import ImageUploader from './ImageUploader';
import './SectionManager.css';

export default function SectionManager() {
  const { config, updateConfig, saveConfig, hasUnsavedChanges } = useSiteConfig();
  const { sections } = config;
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSections = async () => {
    setSaving(true);
    const res = await saveConfig();
    setSaving(false);
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

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
          <button
            type="button"
            className={`dash-btn dash-btn--primary ${saveSuccess ? 'dash-btn--success' : ''}`}
            onClick={handleSaveSections}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {saving ? <FiRefreshCw className="spin" size={15} /> : (saveSuccess ? <FiCheck size={15} /> : <FiSave size={15} />)}
            <span>{saving ? 'Saving...' : (saveSuccess ? 'Saved!' : 'Save Changes')}</span>
          </button>
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

              {!coreSections.includes(section.id) && (
                <div style={{ marginTop: '12px', width: '100%' }}>
                  <ImageUploader
                    compact
                    label="Background Image / SVG"
                    value={section.bgImage || ''}
                    onChange={(val) => handleBgImageUrl(section.id, val)}
                    placeholder="https://example.com/bg.jpg or paste SVG code..."
                    maxWidth={800}
                    maxHeight={800}
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

              <ImageUploader
                compact
                value={step.image || ''}
                onChange={(val) => updateDeliveryStep(i, 'image', val)}
                placeholder="https://example.com/icon.svg"
                maxWidth={160}
                maxHeight={160}
              />
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



              <ImageUploader
                compact
                value={logo.image || ''}
                onChange={(val) => updatePressLogo(i, 'image', val)}
                placeholder="https://example.com/logo.svg"
                maxWidth={350}
                maxHeight={150}
              />
            </div>
          ))}
        </div>
        <button className="dash-btn dash-btn--ghost" onClick={addPressLogo} style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Publication
        </button>
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
        <div style={{ marginTop: '16px' }}>
          <ImageUploader
            label="Story Image"
            value={config.ourStory?.image || ''}
            onChange={(val) => updateConfig('ourStory.image', val)}
            placeholder="https://example.com/story.jpg or /images/..."
            maxWidth={700}
            maxHeight={700}
            helperText="Upload an SVG, PNG, JPG or paste raw SVG code."
          />
        </div>
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
        <div style={{ marginTop: '16px' }}>
          <ImageUploader
            label="Section Image (optional)"
            value={config.reviewsSection.image || ''}
            onChange={(val) => updateConfig('reviewsSection.image', val)}
            placeholder="https://example.com/reviews.jpg or /images/..."
            maxWidth={500}
            maxHeight={500}
            helperText="Paste SVG code or enter an image URL. If left empty, no image will be displayed."
          />
        </div>
      </div>

      {/* ── Save Section Changes Bottom Bar ── */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 0' }}>
        <button
          type="button"
          className={`dash-btn dash-btn--primary ${saveSuccess ? 'dash-btn--success' : ''}`}
          onClick={handleSaveSections}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {saving ? <FiRefreshCw className="spin" size={16} /> : (saveSuccess ? <FiCheck size={16} /> : <FiSave size={16} />)}
          <span>{saving ? 'Saving...' : (saveSuccess ? 'Saved to Server!' : 'Save Section Changes')}</span>
        </button>
      </div>

    </div>
  );
}
