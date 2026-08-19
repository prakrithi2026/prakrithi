import { useState, useRef, useEffect } from 'react';
import { FiUpload, FiImage, FiPlus, FiTrash2, FiMonitor, FiSmartphone, FiInfo, FiCheckCircle } from 'react-icons/fi';
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

  const desktopImages = hero.images || [];
  const mobileImages = hero.mobileImages || [];

  // Automatically migrate legacy single background image to the slideshow images list
  useEffect(() => {
    if (!hero.images && hero.bgImage) {
      updateConfig('hero.images', [hero.bgImage]);
    }
  }, [hero.images, hero.bgImage, updateConfig]);

  const currentImages = deviceView === 'desktop' ? desktopImages : mobileImages;

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
          console.error(`Error compressing hero ${deviceView} slideshow image:`, err);
        }
      }
    }

    if (newImages.length > 0) {
      if (isDesktop) {
        updateConfig('hero.images', [...desktopImages, ...newImages]);
      } else {
        updateConfig('hero.mobileImages', [...mobileImages, ...newImages]);
      }
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
    if (deviceView === 'desktop') {
      updateConfig('hero.images', [...desktopImages, urlInput.trim()]);
    } else {
      updateConfig('hero.mobileImages', [...mobileImages, urlInput.trim()]);
    }
    setUrlInput('');
  };

  const removeImage = (indexToRemove) => {
    if (deviceView === 'desktop') {
      const updated = desktopImages.filter((_, idx) => idx !== indexToRemove);
      updateConfig('hero.images', updated);
      if (updated.length === 0) {
        updateConfig('hero.bgImage', '');
      }
    } else {
      const updated = mobileImages.filter((_, idx) => idx !== indexToRemove);
      updateConfig('hero.mobileImages', updated);
    }
  };

  const clearAllImages = () => {
    const viewName = deviceView === 'desktop' ? 'Desktop / Laptop' : 'Mobile';
    if (window.confirm(`Are you sure you want to remove all ${viewName} slideshow images?`)) {
      if (deviceView === 'desktop') {
        updateConfig('hero.images', []);
        updateConfig('hero.bgImage', '');
      } else {
        updateConfig('hero.mobileImages', []);
      }
    }
  };

  return (
    <div>
      <div className="dash-panel">
        <div className="section-manager-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="dash-panel__title">🖼️ Hero Banner Slideshow</h2>
            <p className="dash-panel__subtitle">Upload and manage responsive background slides for Desktop/Laptop and Mobile views</p>
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
            <p>🚫 The hero slideshow is currently <strong>hidden</strong> from your storefront.</p>
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
                    <strong>Desktop &amp; Laptop Banner Slides</strong>
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
                    <strong>Mobile View Banner Slides</strong>
                    <span className="hero-device-info__tag">Screen ≤ 768px</span>
                  </div>
                  <p className="hero-device-info__desc">
                    These portrait/vertical banners are optimized specifically for smartphone screens.
                  </p>
                  <p className="hero-device-info__hint">
                    📐 <strong>Recommended size:</strong> 1080×1920 or 1080×1350 (Aspect ratio: <strong>9:16</strong> or <strong>4:5</strong> portrait)
                  </p>
                  {mobileImages.length === 0 && (
                    <div className="hero-device-info__fallback-note">
                      <FiInfo size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        <strong>Fallback active:</strong> No mobile-specific images are uploaded yet. The storefront will automatically display your <strong>Desktop slides</strong> on mobile devices.
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Upload Area */}
            <div className="hero-editor-image-section">
              <label className="dash-field__label" style={{ marginBottom: '12px', display: 'block' }}>
                Upload {deviceView === 'desktop' ? 'Desktop / Laptop' : 'Mobile'} Slides
              </label>
              
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
                  <strong>Click to upload</strong> or drag and drop multiple {deviceView === 'desktop' ? 'desktop' : 'mobile'} images
                </p>
                <p className="hero-editor-upload__hint">
                  {deviceView === 'desktop'
                    ? 'PNG, JPG, WEBP up to 5MB (Landscape 16:9 / 21:9 recommended)'
                    : 'PNG, JPG, WEBP up to 5MB (Portrait 9:16 / 4:5 recommended)'}
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
                      placeholder={deviceView === 'desktop' ? "https://example.com/desktop-slide.jpg" : "https://example.com/mobile-slide.jpg"}
                    />
                  </div>
                  <button className="dash-btn" onClick={addImageUrl} style={{ height: '42px', padding: '0 16px' }}>
                    <FiPlus size={16} style={{ marginRight: '6px' }} /> Add URL
                  </button>
                </div>
              </div>
            </div>

            {/* Uploaded Images List for Active View */}
            <div style={{ marginTop: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {deviceView === 'desktop' ? '💻 Desktop Slides' : '📱 Mobile Slides'} ({currentImages.length})
                </h3>
                {currentImages.length > 0 && (
                  <button className="hero-editor-preview__btn hero-editor-preview__btn--remove" onClick={clearAllImages}>
                    Clear All ({deviceView === 'desktop' ? 'Desktop' : 'Mobile'})
                  </button>
                )}
              </div>

              {currentImages.length === 0 ? (
                <div style={{
                  padding: '32px',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '10px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  backgroundColor: '#fcfcfd'
                }}>
                  {deviceView === 'desktop'
                    ? 'No desktop slides uploaded yet. Upload images above to show on desktop and laptop screens.'
                    : 'No mobile slides uploaded yet. Upload vertical/portrait images above, or the desktop slideshow will be used as a fallback.'}
                </div>
              ) : (
                <div className={`hero-slides-grid ${deviceView === 'mobile' ? 'hero-slides-grid--mobile' : ''}`}>
                  {currentImages.map((img, index) => (
                    <div key={index} className={`hero-slide-card ${deviceView === 'mobile' ? 'hero-slide-card--mobile' : ''}`}>
                      <div
                        className={`hero-slide-card__preview ${deviceView === 'mobile' ? 'hero-slide-card__preview--mobile' : 'hero-slide-card__preview--desktop'}`}
                        style={{ backgroundImage: `url(${img})` }}
                      >
                        <span className="hero-slide-card__badge">
                          {deviceView === 'desktop' ? 'Desktop' : 'Mobile'} Slide {index + 1}
                        </span>
                      </div>
                      <div className="hero-slide-card__actions">
                        <button 
                          className="hero-slide-card__delete-btn"
                          onClick={() => removeImage(index)}
                          title="Remove this slide"
                        >
                          <FiTrash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {currentImages.length >= 2 && (
              <div style={{
                marginTop: '20px',
                padding: '12px 16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                fontSize: '0.85rem',
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FiCheckCircle size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                <span>
                  Multiple {deviceView === 'desktop' ? 'desktop' : 'mobile'} slides uploaded. The storefront will automatically scroll through these slides with a smooth cross-fade transition every 5 seconds.
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
