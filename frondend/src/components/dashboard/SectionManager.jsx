import { useState } from 'react';
import { FiPlus, FiTrash2, FiCopy, FiCheck, FiX, FiSave, FiRefreshCw, FiUpload, FiImage } from 'react-icons/fi';
import { compressImage } from '../../utils/imageOptimizer';
import { useSiteConfig } from '../../context/SiteConfigContext';
import ImageUploader from './ImageUploader';
import StoryMediaUploader from './StoryMediaUploader';
import defaultConfig from '../../data/defaultConfig';
import './SectionManager.css';

const DEFAULT_CATEGORY_CARDS = [];

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
  const coreSections = ['shopByProduct', 'delivery', 'shopByCategory', 'shopByConcern', 'press', 'reviews', 'ourStory'];

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

  const [uploadingCardIndex, setUploadingCardIndex] = useState(null);

  const getCategoryCards = () => {
    if (Array.isArray(config.shopByCategory?.categories) && config.shopByCategory.categories.length > 0) {
      return config.shopByCategory.categories;
    }
    if (Array.isArray(config.shopByConcern?.categories) && config.shopByConcern.categories.length > 0) {
      return config.shopByConcern.categories;
    }
    return DEFAULT_CATEGORY_CARDS;
  };

  const updateCategoryCard = (index, field, value) => {
    const cards = [...getCategoryCards()];
    cards[index] = { ...cards[index], [field]: value };
    if (field === 'category' && value) {
      cards[index].link = `/shop?category=${value}`;
    }
    updateConfig('shopByCategory.categories', cards);
    updateConfig('shopByConcern.categories', cards);
  };

  const handleCardImageUpload = async (index, file) => {
    if (!file) return;
    setUploadingCardIndex(index);
    try {
      const compressed = await compressImage(file, 800, 1000, 0.85);
      updateCategoryCard(index, 'image', compressed);
    } catch (err) {
      alert('Failed to process image: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingCardIndex(null);
    }
  };

  const addCategoryCard = () => {
    const cards = [...getCategoryCards()];
    const newCard = {
      id: `category-${Date.now()}`,
      label: 'New Category',
      category: 'spices',
      image: '',
      link: '/shop?category=spices',
    };
    const updated = [...cards, newCard];
    updateConfig('shopByCategory.categories', updated);
    updateConfig('shopByConcern.categories', updated);
  };

  const removeCategoryCard = (index) => {
    const cards = [...getCategoryCards()];
    const updated = cards.filter((_, i) => i !== index);
    updateConfig('shopByCategory.categories', updated);
    updateConfig('shopByConcern.categories', updated);
  };

  const moveCategoryCard = (index, direction) => {
    const cards = [...getCategoryCards()];
    const target = index + direction;
    if (target < 0 || target >= cards.length) return;
    const temp = cards[index];
    cards[index] = cards[target];
    cards[target] = temp;
    updateConfig('shopByCategory.categories', cards);
    updateConfig('shopByConcern.categories', cards);
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
                <h4 className="section-item__label">{section.id === 'shopByConcern' || section.id === 'shopByCategory' ? 'Shop by Category' : section.label}</h4>
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
              <div className="delivery-step-card__header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="delivery-step-card__title" style={{ minWidth: '55px', fontWeight: 700 }}>Step {i + 1}</span>
                <input
                  type="text"
                  className="dash-field__input"
                  style={{ margin: 0, padding: '5px 10px', fontSize: '0.82rem', flex: 1 }}
                  value={step.label || ''}
                  onChange={(e) => updateDeliveryStep(i, 'label', e.target.value)}
                  placeholder="Step Label (e.g. ORDER, PACKING...)"
                />
                <button className="crud-list__delete" onClick={() => removeDeliveryStep(i)} title="Delete step">
                  <FiTrash2 size={13} />
                </button>
              </div>

              <ImageUploader
                compact
                label="Step Icon / SVG Code"
                value={step.image || ''}
                onChange={(val) => updateDeliveryStep(i, 'image', val)}
                placeholder="Paste SVG code (<svg>...</svg>) or image URL"
                maxWidth={160}
                maxHeight={160}
                helperText="Paste raw SVG code or enter an icon URL."
              />
            </div>
          ))}
        </div>
        <button className="dash-btn dash-btn--ghost" onClick={addDeliveryStep} style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Step
        </button>
      </div>

      {/* ── Shop by Category Settings ── */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">📁 Shop by Category Settings</h3>
        <p className="dash-panel__subtitle">Configure section title, category cards with custom image uploads, and view all button</p>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Section Title</label>
            <input className="dash-field__input"
              value={config.shopByCategory?.title || config.shopByConcern?.title || 'Shop By Category'}
              onChange={(e) => {
                updateConfig('shopByCategory.title', e.target.value);
                updateConfig('shopByConcern.title', e.target.value);
              }} />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">View All Text</label>
            <input className="dash-field__input"
              value={config.shopByCategory?.viewAllText || config.shopByConcern?.viewAllText || 'View All →'}
              onChange={(e) => {
                updateConfig('shopByCategory.viewAllText', e.target.value);
                updateConfig('shopByConcern.viewAllText', e.target.value);
              }} />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">View All Link</label>
            <input className="dash-field__input"
              value={config.shopByCategory?.viewAllLink || '/shop'}
              onChange={(e) => updateConfig('shopByCategory.viewAllLink', e.target.value)} />
          </div>
        </div>

        {/* ── Category Cards Editor with Image Upload ── */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Category Cards</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Cards displayed in the category scroller. Upload image photos directly for each card.
              </p>
            </div>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={addCategoryCard}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Card
            </button>
          </div>

          {getCategoryCards().length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.88rem' }}>
              No category cards added yet. Click <strong>+ Add Card</strong> above to add a category card with an image and title.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {getCategoryCards().map((card, i) => (
              <div
                key={card.id || i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  position: 'relative'
                }}
              >
                {/* Header row: Card number & reorder/delete actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#00433D' }}>Card #{i + 1}</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="dash-btn dash-btn--ghost"
                      style={{ padding: '2px 8px', fontSize: '11px', height: '24px', lineHeight: 1 }}
                      disabled={i === 0}
                      onClick={() => moveCategoryCard(i, -1)}
                      title="Move Left/Up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="dash-btn dash-btn--ghost"
                      style={{ padding: '2px 8px', fontSize: '11px', height: '24px', lineHeight: 1 }}
                      disabled={i === getCategoryCards().length - 1}
                      onClick={() => moveCategoryCard(i, 1)}
                      title="Move Right/Down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="crud-list__delete"
                      onClick={() => removeCategoryCard(i)}
                      title="Delete Card"
                      style={{ marginLeft: '4px' }}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Image Preview & Upload Controls */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '88px',
                      borderRadius: '8px',
                      backgroundColor: '#00433D',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FiImage size={24} color="#94a3b8" />
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      className="dash-btn dash-btn--outline"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        width: 'fit-content'
                      }}
                    >
                      <FiUpload size={13} />
                      <span>{uploadingCardIndex === i ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCardImageUpload(i, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {card.image && (
                      <button
                        type="button"
                        className="dash-btn dash-btn--ghost"
                        onClick={() => updateCategoryCard(i, 'image', '')}
                        style={{ color: '#ef4444', fontSize: '0.72rem', padding: '2px 4px', width: 'fit-content', height: 'auto' }}
                      >
                        Remove image
                      </button>
                    )}
                    <input
                      className="dash-field__input"
                      value={card.image?.startsWith('data:') ? 'Image uploaded (base64)' : (card.image || '')}
                      onChange={(e) => updateCategoryCard(i, 'image', e.target.value)}
                      placeholder="Or paste image URL"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    />
                  </div>
                </div>

                {/* Card Title */}
                <div className="dash-field" style={{ margin: 0 }}>
                  <label className="dash-field__label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Card Title</label>
                  <input
                    className="dash-field__input"
                    value={card.label || ''}
                    onChange={(e) => updateCategoryCard(i, 'label', e.target.value)}
                    placeholder="e.g. Kerala Spices"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>

                {/* Target Category / Link */}
                <div className="dash-field" style={{ margin: 0 }}>
                  <label className="dash-field__label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Target Category / Link</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      className="dash-field__input"
                      value={card.category || ''}
                      onChange={(e) => updateCategoryCard(i, 'category', e.target.value)}
                      style={{ fontSize: '0.78rem', maxWidth: '140px' }}
                    >
                      <option value="">-- Choose Category --</option>
                      {config.categories?.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <input
                      className="dash-field__input"
                      value={card.link || ''}
                      onChange={(e) => updateCategoryCard(i, 'link', e.target.value)}
                      placeholder="/shop?category=..."
                      style={{ fontSize: '0.78rem', flex: 1 }}
                    />
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Taxonomy Categories ── */}
        <h4 style={{ marginTop: '24px', marginBottom: '8px', fontSize: '0.88rem', fontWeight: 600 }}>Product Categories Taxonomy</h4>
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

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Founder Name</label>
            <input className="dash-field__input" value={config.ourStory?.founderName || ''}
              onChange={(e) => updateConfig('ourStory.founderName', e.target.value)}
              placeholder="e.g. Anjana KA" />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">Founder Title</label>
            <input className="dash-field__input" value={config.ourStory?.founderTitle || ''}
              onChange={(e) => updateConfig('ourStory.founderTitle', e.target.value)}
              placeholder="e.g. Founder Prakrithi India" />
          </div>
        </div>

        {/* Media Uploader: Image or Video */}
        <StoryMediaUploader
          mediaType={config.ourStory?.mediaType || (config.ourStory?.video ? 'video' : 'image')}
          onMediaTypeChange={(type) => updateConfig('ourStory.mediaType', type)}
          image={config.ourStory?.image ?? ''}
          onImageChange={(val) => updateConfig('ourStory.image', val)}
          video={config.ourStory?.video || ''}
          onVideoChange={(val) => updateConfig('ourStory.video', val)}
        />
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
