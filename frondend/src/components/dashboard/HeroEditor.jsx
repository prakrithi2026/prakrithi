import { useState, useRef } from 'react';
import { FiUpload, FiCopy, FiCheck, FiX, FiImage, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { compressImage } from '../../utils/imageOptimizer';
import './HeroEditor.css';

export default function HeroEditor() {
  const { config, updateConfig } = useSiteConfig();
  const { hero } = config;
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const productImages = hero.productImages || [];

  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.7);
      updateConfig('hero.bgImage', compressed);
    } catch (err) {
      console.error('Error compressing hero background image:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const copyImageUrl = () => {
    if (hero.bgImage) {
      navigator.clipboard.writeText(hero.bgImage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const removeImage = () => {
    updateConfig('hero.bgImage', '');
  };

  /* ── Product Images (left-side) helpers ── */
  const toggleShowProductImages = () => {
    updateConfig('hero.showProductImages', !hero.showProductImages);
  };

  const addProductImage = () => {
    const maxId = productImages.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const updated = [...productImages, { id: maxId + 1, emoji: '🌿', label: 'New\\nItem', image: '' }];
    updateConfig('hero.productImages', updated);
  };

  const removeProductImage = (id) => {
    updateConfig('hero.productImages', productImages.filter(p => p.id !== id));
  };

  const updateProductImage = (id, field, value) => {
    const updated = productImages.map(p => p.id === id ? { ...p, [field]: value } : p);
    updateConfig('hero.productImages', updated);
  };

  const handleProductImageUpload = async (id, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImage(file, 600, 600, 0.75);
      updateProductImage(id, 'image', compressed);
    } catch (err) {
      console.error('Error compressing hero product image:', err);
    }
  };

  return (
    <div>
      <div className="dash-panel">
        <div className="section-manager-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="dash-panel__title">🖼️ Hero Banner</h2>
            <p className="dash-panel__subtitle">Customize the main hero section of your homepage</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.82rem', color: hero.enabled !== false ? '#16a34a' : '#9ca3af', fontWeight: 600 }}>
              {hero.enabled !== false ? 'Visible' : 'Hidden'}
            </span>
            <label className="section-item__toggle">
              <input
                type="checkbox"
                checked={hero.enabled !== false}
                onChange={() => updateConfig('hero.enabled', hero.enabled === false ? true : false)}
              />
              <span className="section-item__toggle-slider"></span>
            </label>
          </div>
        </div>

        {hero.enabled === false && (
          <div className="hero-editor-disabled-notice">
            <p>🚫 The hero section is currently <strong>hidden</strong> from your storefront.</p>
            <p>Toggle the switch above to make it visible again.</p>
          </div>
        )}

        {hero.enabled !== false && (
          <>

        {/* ── Background Image Section ── */}
        <div className="hero-editor-image-section">
          <label className="dash-field__label" style={{ marginBottom: '12px', display: 'block' }}>
            Background Image
          </label>

          {hero.bgImage ? (
            /* When image is set: only show preview + remove */
            <div className="hero-editor-preview">
              <div
                className="hero-editor-preview__image"
                style={{ backgroundImage: `url(${hero.bgImage})` }}
              />
              <div className="hero-editor-preview__actions">
                <button className="hero-editor-preview__btn hero-editor-preview__btn--remove" onClick={removeImage}>
                  <FiX size={14} /> Remove
                </button>
              </div>
            </div>
          ) : (
            /* When no image: show upload zone + URL paste */
            <>
              {/* Upload Area */}
              <div
                className={`hero-editor-upload ${dragActive ? 'hero-editor-upload--active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="hero-editor-upload__icon"><FiUpload size={24} /></div>
                <p className="hero-editor-upload__text"><strong>Click to upload</strong> or drag and drop</p>
                <p className="hero-editor-upload__hint">PNG, JPG, WEBP up to 5MB</p>
              </div>

              {/* URL Input */}
              <div className="hero-editor-url">
                <div className="hero-editor-url__row">
                  <div className="hero-editor-url__divider"><span>or paste image URL</span></div>
                </div>
                <div className="hero-editor-url__input-wrap">
                  <FiImage size={16} className="hero-editor-url__icon" />
                  <input
                    className="dash-field__input hero-editor-url__input"
                    value={hero.bgImage}
                    onChange={(e) => updateConfig('hero.bgImage', e.target.value)}
                    placeholder="https://example.com/hero-image.jpg"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Overlay Opacity</label>
            <input
              type="range" min="0" max="1" step="0.05"
              value={hero.overlayOpacity}
              onChange={(e) => updateConfig('hero.overlayOpacity', parseFloat(e.target.value))}
              className="theme-slider" style={{ width: '100%' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{hero.overlayOpacity}</span>
          </div>
        </div>

        <div className="dash-field">
          <label className="dash-field__label">Tagline</label>
          <input className="dash-field__input" value={hero.tagline} onChange={(e) => updateConfig('hero.tagline', e.target.value)} />
        </div>

        <div className="dash-field">
          <label className="dash-field__label">Title</label>
          <input className="dash-field__input" value={hero.title} onChange={(e) => updateConfig('hero.title', e.target.value)} style={{ fontSize: '1.2rem', fontWeight: 700 }} />
        </div>

        <div className="dash-field">
          <label className="dash-field__label">Subtitle</label>
          <input className="dash-field__input" value={hero.subtitle} onChange={(e) => updateConfig('hero.subtitle', e.target.value)} />
        </div>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">CTA Button Text</label>
            <input className="dash-field__input" value={hero.ctaText} onChange={(e) => updateConfig('hero.ctaText', e.target.value)} />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">CTA Link</label>
            <input className="dash-field__input" value={hero.ctaLink} onChange={(e) => updateConfig('hero.ctaLink', e.target.value)} />
          </div>
        </div>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Text Alignment</label>
            <select className="dash-field__input" value={hero.textAlign} onChange={(e) => updateConfig('hero.textAlign', e.target.value)}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{
            background: hero.bgImage
              ? `linear-gradient(rgba(0,0,0,${hero.overlayOpacity}), rgba(0,0,0,${hero.overlayOpacity})), url(${hero.bgImage}) center/cover`
              : `linear-gradient(135deg, ${hero.bgColor}, ${hero.bgColor}dd)`,
            padding: '40px 30px', color: 'white', textAlign: hero.textAlign,
            minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <p style={{ fontSize: '0.75rem', opacity: 0.85, marginBottom: '4px' }}>{hero.tagline}</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px', color: 'white' }}>{hero.title}</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '12px' }}>{hero.subtitle}</p>
            <div>
              <span style={{
                background: hero.ctaBgColor, color: hero.ctaTextColor,
                padding: '8px 20px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
              }}>{hero.ctaText}</span>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* ── Product Images (Left Side) ── */}
      {hero.enabled !== false && (
      <div className="dash-panel">
        <div className="section-manager-header" style={{ marginBottom: '20px' }}>
          <div>
            <h3 className="dash-panel__title">🎒 Hero Product Images</h3>
            <p className="dash-panel__subtitle">Decorative product images shown on the left side of the hero banner</p>
          </div>
          <label className="section-item__toggle" style={{ marginLeft: 'auto' }}>
            <input type="checkbox" checked={hero.showProductImages !== false} onChange={toggleShowProductImages} />
            <span className="section-item__toggle-slider"></span>
          </label>
        </div>

        {hero.showProductImages !== false && (
          <>
            <div className="hero-product-images-list">
              {productImages.map((item) => (
                <div key={item.id} className="hero-pi-card">
                  {/* Image preview / upload */}
                  <div className="hero-pi-card__preview">
                    {item.image ? (
                      <img src={item.image} alt="Preview" className="hero-pi-card__img" />
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No image</div>
                    )}
                  </div>

                  <div className="hero-pi-card__fields">

                    <div className="dash-field" style={{ marginBottom: '16px' }}>
                      <label className="dash-field__label">Image (Upload from system)</label>
                      <div
                        onClick={() => {
                          const fileInput = document.getElementById(`hero-pi-upload-${item.id}`);
                          if (fileInput) fileInput.click();
                        }}
                        style={{
                          border: '2px dashed #cbd5e1',
                          padding: '24px 16px',
                          textAlign: 'center',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: '#f8fafc',
                          marginBottom: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      >
                        <input
                          id={`hero-pi-upload-${item.id}`}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProductImageUpload(item.id, file);
                          }}
                        />
                        <FiUpload size={24} style={{ color: '#64748b', marginBottom: '8px' }} />
                        <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>
                          Click to upload from system
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                          PNG, JPG, WEBP
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Or paste URL:</span>
                        <input
                          className="dash-field__input"
                          value={item.image || ''}
                          onChange={(e) => updateProductImage(item.id, 'image', e.target.value)}
                          placeholder="https://..."
                          style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                        {item.image && (
                          <button
                            className="hero-pi-remove-img-btn"
                            onClick={() => updateProductImage(item.id, 'image', '')}
                            title="Remove image"
                            style={{ padding: '6px' }}
                          >
                            <FiX size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="dash-field" style={{ marginBottom: '8px' }}>
                      <label className="dash-field__label">Image Width (px) - Default: 180</label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="range"
                          min="80"
                          max="500"
                          value={item.width || 180}
                          onChange={(e) => updateProductImage(item.id, 'width', parseInt(e.target.value))}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '0.85rem', width: '40px', fontWeight: 600 }}>
                          {item.width || 180}px
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="hero-pi-card__delete" onClick={() => removeProductImage(item.id)} title="Remove this item">
                    <FiTrash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button className="dash-btn dash-btn--ghost" onClick={addProductImage} style={{ marginTop: '12px' }}>
              <FiPlus size={16} style={{ marginRight: '6px' }} /> Add Product Image
            </button>
          </>
        )}
      </div>
      )}
    </div>
  );
}
