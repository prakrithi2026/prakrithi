import { useState, useRef } from 'react';
import { 
  FiUpload, FiImage, FiPlus, FiTrash2, FiMonitor, FiSmartphone, 
  FiInfo, FiChevronLeft, FiChevronRight, FiStar 
} from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { compressImage } from '../../utils/imageOptimizer';
import './HeroEditor.css';

export default function HeroEditor() {
  const { config, updateConfig } = useSiteConfig();
  const { hero } = config;
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' | 'mobile'
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);

  const desktopImages = Array.isArray(hero.images) 
    ? hero.images 
    : (hero.bgImage ? [hero.bgImage] : []);
  const mobileImages = Array.isArray(hero.mobileImages) ? hero.mobileImages : [];

  const currentImages = deviceView === 'desktop' ? desktopImages : mobileImages;

  // Helper to update images and keep legacy bgImage in sync
  const setImagesForDevice = (view, newImagesList) => {
    const nextHero = { ...hero };
    if (view === 'desktop') {
      nextHero.images = newImagesList;
      nextHero.bgImage = newImagesList.length > 0 ? newImagesList[0] : '';
    } else {
      nextHero.mobileImages = newImagesList;
    }

    updateConfig('hero', nextHero);
  };

  const handleFilesUpload = async (files) => {
    const newImages = [];
    const isDesktop = deviceView === 'desktop';
    const maxWidth = isDesktop ? 2560 : 1080;
    const maxHeight = isDesktop ? 1440 : 1920;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file, maxWidth, maxHeight, 0.90);
          newImages.push(compressed);
        } catch (err) {
          console.error(`Error compressing hero ${deviceView} image:`, err);
        }
      }
    }

    if (newImages.length > 0) {
      const updated = [...currentImages, ...newImages];
      setImagesForDevice(deviceView, updated);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const addImageUrl = () => {
    if (!urlInput.trim()) return;
    const trimmed = urlInput.trim();
    const updated = [...currentImages, trimmed];
    setImagesForDevice(deviceView, updated);
    setUrlInput('');
  };

  const removeImage = (indexToRemove) => {
    const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
    setImagesForDevice(deviceView, updated);
  };

  const setAsPrimary = (index) => {
    if (index === 0 || index >= currentImages.length) return;
    const updated = [...currentImages];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected); // Put at index 0
    setImagesForDevice(deviceView, updated);
  };

  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentImages.length) return;
    const updated = [...currentImages];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setImagesForDevice(deviceView, updated);
  };

  const clearAllImages = () => {
    const viewName = deviceView === 'desktop' ? 'Desktop / Laptop' : 'Mobile';
    if (window.confirm(`Are you sure you want to remove all ${viewName} banners?`)) {
      setImagesForDevice(deviceView, []);
    }
  };

  return (
    <div>
      <div className="dash-panel">
        {/* Header Bar */}
        <div className="section-manager-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="dash-panel__title">🖼️ Hero Banner</h2>
            <p className="dash-panel__subtitle">Upload, replace, or reorder responsive banners for Desktop and Mobile views</p>
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
            <p>🚫 The hero banner is currently <strong>hidden</strong> from your storefront.</p>
            <p>Toggle the switch above to make it visible again.</p>
          </div>
        )}

        {hero.enabled !== false && (
          <>
            {/* Device View Tabs Switcher */}
            <div className="hero-device-tabs">
              <button
                type="button"
                className={`hero-device-tab ${deviceView === 'desktop' ? 'hero-device-tab--active' : ''}`}
                onClick={() => { setDeviceView('desktop'); setUrlInput(''); }}
              >
                <FiMonitor size={18} />
                <span className="hero-device-tab__label">Desktop / Laptop View</span>
                <span className="hero-device-tab__count">{desktopImages.length}</span>
              </button>

              <button
                type="button"
                className={`hero-device-tab ${deviceView === 'mobile' ? 'hero-device-tab--active' : ''}`}
                onClick={() => { setDeviceView('mobile'); setUrlInput(''); }}
              >
                <FiSmartphone size={18} />
                <span className="hero-device-tab__label">Mobile View</span>
                <span className="hero-device-tab__count">{mobileImages.length}</span>
              </button>
            </div>

            {/* Device Info Banner */}
            <div className="hero-device-info">
              {deviceView === 'desktop' ? (
                <>
                  <div className="hero-device-info__header">
                    <FiMonitor size={17} className="hero-device-info__icon" />
                    <strong>Desktop &amp; Laptop Banner</strong>
                    <span className="hero-device-info__tag">Screen &gt; 768px</span>
                  </div>
                  <p className="hero-device-info__desc">
                    These landscape banners are displayed on desktop monitors, laptops, and wide screens.
                  </p>
                  <p className="hero-device-info__hint">
                    📐 <strong>Recommended size:</strong> 1920×1080 or 2560×1440 (Aspect ratio: <strong>16:9</strong> or <strong>21:9</strong> landscape)
                  </p>
                </>
              ) : (
                <>
                  <div className="hero-device-info__header">
                    <FiSmartphone size={17} className="hero-device-info__icon" />
                    <strong>Mobile View Banner</strong>
                    <span className="hero-device-info__tag">Screen ≤ 768px</span>
                  </div>
                  <p className="hero-device-info__desc">
                    These portrait/vertical banners are optimized specifically for smartphone screens.
                  </p>
                  <p className="hero-device-info__hint">
                    📐 <strong>Recommended size:</strong> <strong>1080×1350</strong> (Aspect ratio: <strong>4:5</strong> portrait) or <strong>1080×1920</strong> (Aspect ratio: <strong>9:16</strong> full vertical)
                  </p>
                  {mobileImages.length === 0 && (
                    <div className="hero-device-info__fallback-note">
                      <FiInfo size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        <strong>Fallback active:</strong> No mobile-specific images are uploaded yet. The storefront will automatically display your <strong>Desktop banner</strong> on mobile devices.
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Upload Area */}
            <div className="hero-editor-image-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <label className="dash-field__label" style={{ margin: 0, fontWeight: 700 }}>
                  Upload {deviceView === 'desktop' ? 'Desktop / Laptop' : 'Mobile'} Banner
                </label>
              </div>
              
              <div
                className={`hero-editor-upload ${dragActive ? 'hero-editor-upload--active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{ cursor: 'pointer' }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="hero-editor-upload__icon"><FiUpload size={28} /></div>
                <p className="hero-editor-upload__text">
                  <strong>Click to upload</strong> or drag &amp; drop {deviceView === 'desktop' ? 'desktop' : 'mobile'} image(s)
                </p>
                <p className="hero-editor-upload__hint">
                  Upload one or multiple images. When multiple images are added, they automatically cycle as slides.
                </p>
                <p className="hero-editor-upload__hint" style={{ marginTop: '4px' }}>
                  {deviceView === 'desktop'
                    ? 'PNG, JPG, WEBP (Landscape 16:9 / 21:9 — 1920×1080 recommended)'
                    : 'PNG, JPG, WEBP (Portrait 4:5 / 9:16 — 1080×1350 recommended)'}
                </p>
              </div>

              {/* URL Input */}
              <div className="hero-editor-url" style={{ marginTop: '16px' }}>
                <div className="hero-editor-url__divider"><span>or paste image URL</span></div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <div className="hero-editor-url__input-wrap" style={{ flex: 1 }}>
                    <FiImage size={16} className="hero-editor-url__icon" />
                    <input
                      className="dash-field__input hero-editor-url__input"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={deviceView === 'desktop' ? "https://example.com/desktop-banner.jpg" : "https://example.com/mobile-banner.jpg"}
                    />
                  </div>
                  <button className="dash-btn" onClick={addImageUrl} style={{ height: '42px', padding: '0 16px' }}>
                    <FiPlus size={16} style={{ marginRight: '6px' }} /> Add Image
                  </button>
                </div>
              </div>
            </div>

            {/* Uploaded Images List for Active View */}
            <div style={{ marginTop: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {deviceView === 'desktop' ? '💻 Desktop Banners' : '📱 Mobile Banners'} ({currentImages.length})
                </h3>
                {currentImages.length > 0 && (
                  <button className="hero-editor-preview__btn hero-editor-preview__btn--remove" onClick={clearAllImages}>
                    Clear All ({deviceView === 'desktop' ? 'Desktop' : 'Mobile'})
                  </button>
                )}
              </div>

              {currentImages.length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '10px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  backgroundColor: '#fcfcfd'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600, color: '#475569' }}>
                    No {deviceView === 'desktop' ? 'desktop' : 'mobile'} banners configured
                  </p>
                  <p style={{ margin: 0 }}>
                    {deviceView === 'desktop'
                      ? 'Upload an image above to show on desktop and laptop screens.'
                      : 'Upload vertical/portrait images above, or the desktop banner will be used as a fallback.'}
                  </p>
                </div>
              ) : (
                <div className={`hero-slides-grid ${deviceView === 'mobile' ? 'hero-slides-grid--mobile' : ''}`}>
                  {currentImages.map((img, index) => {
                    const isPrimary = index === 0;
                    return (
                      <div key={index} className={`hero-slide-card ${isPrimary ? 'hero-slide-card--primary' : ''} ${deviceView === 'mobile' ? 'hero-slide-card--mobile' : ''}`}>
                        <div
                          className={`hero-slide-card__preview ${deviceView === 'mobile' ? 'hero-slide-card__preview--mobile' : 'hero-slide-card__preview--desktop'}`}
                          style={{ backgroundImage: `url(${img})` }}
                        >
                          <span className={`hero-slide-card__badge ${isPrimary ? 'hero-slide-card__badge--primary' : ''}`}>
                            {isPrimary ? '★ Primary (Main Banner)' : `Slide ${index + 1}`}
                          </span>
                        </div>
                        
                        {/* Slide Card Controls */}
                        <div className="hero-slide-card__controls">
                          {/* Reordering Controls */}
                          <div className="hero-slide-card__reorder">
                            <button
                              type="button"
                              className="hero-reorder-btn"
                              onClick={() => moveImage(index, -1)}
                              disabled={index === 0}
                              title="Move Left (Earlier in sequence)"
                            >
                              <FiChevronLeft size={16} />
                            </button>
                            <span className="hero-reorder-index">#{index + 1}</span>
                            <button
                              type="button"
                              className="hero-reorder-btn"
                              onClick={() => moveImage(index, 1)}
                              disabled={index === currentImages.length - 1}
                              title="Move Right (Later in sequence)"
                            >
                              <FiChevronRight size={16} />
                            </button>
                          </div>

                          {/* Make Primary Action */}
                          {!isPrimary && (
                            <button
                              type="button"
                              className="hero-make-primary-btn"
                              onClick={() => setAsPrimary(index)}
                              title="Set this slide as the primary banner shown on page load"
                            >
                              <FiStar size={13} /> Make Primary
                            </button>
                          )}

                          {/* Remove Button */}
                          <button 
                            type="button"
                            className="hero-slide-card__delete-btn"
                            onClick={() => removeImage(index)}
                            title="Remove this banner"
                          >
                            <FiTrash2 size={14} /> Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
