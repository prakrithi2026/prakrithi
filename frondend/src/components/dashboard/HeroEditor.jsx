import { useState, useRef } from 'react';
import { 
  FiUpload, FiImage, FiPlus, FiTrash2, FiMonitor, FiSmartphone, 
  FiInfo, FiChevronLeft, FiChevronRight, FiStar, FiSave, FiCheck, FiRefreshCw, FiCopy
} from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { compressImage, normalizeImageInput } from '../../utils/imageOptimizer';
import './HeroEditor.css';

export default function HeroEditor() {
  const { config, updateConfig, saveConfig } = useSiteConfig();
  const { hero } = config;
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' | 'mobile'
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const desktopImages = Array.isArray(hero.images) 
    ? hero.images 
    : (hero.bgImage ? [hero.bgImage] : []);
  const mobileImages = Array.isArray(hero.mobileImages) ? hero.mobileImages : [];

  const currentImages = deviceView === 'desktop' ? desktopImages : mobileImages;

  // Dedicated helper to save hero banner in isolation without transmitting products
  const saveHeroToBackend = async (heroToSave) => {
    setSaving(true);
    const curDesktop = Array.isArray(heroToSave.images) 
      ? heroToSave.images 
      : (heroToSave.bgImage ? [heroToSave.bgImage] : []);
    const curMobile = curDesktop.length === 0 ? [] : (Array.isArray(heroToSave.mobileImages) ? heroToSave.mobileImages : []);

    const currentHero = {
      ...heroToSave,
      images: curDesktop,
      mobileImages: curMobile,
      bgImage: curDesktop.length > 0 ? curDesktop[0] : ''
    };
    // Send ONLY hero to prevent any crosstalk or accidental product catalog deletion
    const res = await saveConfig({ hero: currentHero });
    setSaving(false);
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
    return res;
  };

  const handleSaveHero = async () => {
    await saveHeroToBackend(hero);
  };

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
    return nextHero;
  };

  const copyDesktopToMobile = async () => {
    if (window.confirm('Sync current Desktop banners to Mobile view? This will replace mobile banners with desktop banners.')) {
      const nextHero = { ...hero, mobileImages: [...desktopImages] };
      updateConfig('hero', nextHero);
      await saveHeroToBackend(nextHero);
    }
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
          const compressed = await compressImage(file, maxWidth, maxHeight, 0.85);
          newImages.push(compressed);
        } catch (err) {
          console.error(`Error compressing hero ${deviceView} image:`, err);
        }
      }
    }

    if (newImages.length > 0) {
      const updated = [...currentImages, ...newImages];
      const nextHero = setImagesForDevice(deviceView, updated);
      // Auto-save immediately to database so newly uploaded banners are never lost
      await saveHeroToBackend(nextHero);
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

  const addImageUrl = async () => {
    if (!urlInput.trim()) return;
    const trimmed = urlInput.trim();
    const formatted = normalizeImageInput(trimmed);
    const updated = [...currentImages, formatted];
    const nextHero = setImagesForDevice(deviceView, updated);
    setUrlInput('');
    // Auto-save immediately to database
    await saveHeroToBackend(nextHero);
  };

  const removeImage = async (indexToRemove) => {
    const nextHero = { ...hero };
    if (deviceView === 'desktop') {
      const newDesktop = desktopImages.filter((_, idx) => idx !== indexToRemove);
      nextHero.images = newDesktop;
      nextHero.bgImage = newDesktop.length > 0 ? newDesktop[0] : '';
      // If all desktop banners are removed, also clear mobileImages so no phantom banners remain
      if (newDesktop.length === 0) {
        nextHero.mobileImages = [];
      } else if (mobileImages.length > 0 && indexToRemove < mobileImages.length) {
        nextHero.mobileImages = mobileImages.filter((_, idx) => idx !== indexToRemove);
      }
    } else {
      nextHero.mobileImages = mobileImages.filter((_, idx) => idx !== indexToRemove);
    }
    updateConfig('hero', nextHero);

    // Auto-save immediately to database so reload won't bring back the deleted banner
    await saveHeroToBackend(nextHero);
  };

  const setAsPrimary = async (index) => {
    if (index === 0 || index >= currentImages.length) return;
    const nextHero = { ...hero };
    if (deviceView === 'desktop') {
      const updatedD = [...desktopImages];
      const [selectedD] = updatedD.splice(index, 1);
      updatedD.unshift(selectedD);
      nextHero.images = updatedD;
      nextHero.bgImage = updatedD[0] || '';
      if (mobileImages.length > index) {
        const updatedM = [...mobileImages];
        const [selectedM] = updatedM.splice(index, 1);
        updatedM.unshift(selectedM);
        nextHero.mobileImages = updatedM;
      }
    } else {
      const updated = [...currentImages];
      const [selected] = updated.splice(index, 1);
      updated.unshift(selected);
      nextHero.mobileImages = updated;
    }
    updateConfig('hero', nextHero);
    await saveHeroToBackend(nextHero);
  };

  const moveImage = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentImages.length) return;
    const nextHero = { ...hero };
    if (deviceView === 'desktop') {
      const updatedD = [...desktopImages];
      const tempD = updatedD[index];
      updatedD[index] = updatedD[newIndex];
      updatedD[newIndex] = tempD;
      nextHero.images = updatedD;
      nextHero.bgImage = updatedD[0] || '';
      if (mobileImages.length > Math.max(index, newIndex)) {
        const updatedM = [...mobileImages];
        const tempM = updatedM[index];
        updatedM[index] = updatedM[newIndex];
        updatedM[newIndex] = tempM;
        nextHero.mobileImages = updatedM;
      }
    } else {
      const updatedM = [...mobileImages];
      const tempM = updatedM[index];
      updatedM[index] = updatedM[newIndex];
      updatedM[newIndex] = tempM;
      nextHero.mobileImages = updatedM;
    }
    updateConfig('hero', nextHero);
    await saveHeroToBackend(nextHero);
  };

  const clearAllImages = async () => {
    if (window.confirm('Are you sure you want to remove ALL hero banners from your storefront?')) {
      const nextHero = {
        ...hero,
        images: [],
        mobileImages: [],
        bgImage: ''
      };
      updateConfig('hero', nextHero);
      await saveHeroToBackend(nextHero);
    }
  };

  const handleToggleVisibility = async () => {
    const nextEnabled = hero.enabled === false ? true : false;
    const nextHero = { ...hero, enabled: nextEnabled };
    updateConfig('hero.enabled', nextEnabled);

    setSaving(true);
    const nextConfig = {
      ...config,
      hero: nextHero
    };
    const res = await saveConfig(nextConfig);
    setSaving(false);
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div>
      <div className="dash-panel">
        {/* Header Bar */}
        <div className="section-manager-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="dash-panel__title">🖼️ Hero Banner</h2>
            <p className="dash-panel__subtitle">Upload, replace, or reorder responsive banners for Desktop and Mobile views</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: hero.enabled !== false ? '#16a34a' : '#9ca3af', fontWeight: 600 }}>
                {hero.enabled !== false ? 'Visible' : 'Hidden'}
              </span>
              <label className="section-item__toggle">
                <input
                  type="checkbox"
                  checked={hero.enabled !== false}
                  onChange={handleToggleVisibility}
                  disabled={saving}
                />
                <span className="section-item__toggle-slider"></span>
              </label>
            </div>
            <button
              type="button"
              className={`dash-btn dash-btn--primary ${saveSuccess ? 'dash-btn--success' : ''}`}
              onClick={handleSaveHero}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {saving ? <FiRefreshCw className="spin" size={14} /> : (saveSuccess ? <FiCheck size={14} /> : <FiSave size={14} />)}
              <span>{saving ? 'Saving...' : (saveSuccess ? 'Saved!' : 'Save Changes')}</span>
            </button>
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

            {/* Upload Banner Area */}
            <div className="hero-editor-image-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <label className="dash-field__label" style={{ margin: 0, fontWeight: 700 }}>
                  Upload {deviceView === 'desktop' ? 'Desktop / Laptop' : 'Mobile'} Banner
                </label>
              </div>

              {/* Tabs */}
              <div className="img-uploader__tabs" style={{ marginBottom: '14px' }}>
                <button
                  type="button"
                  className={`img-uploader__tab ${uploadMode === 'file' ? 'img-uploader__tab--active' : ''}`}
                  onClick={() => setUploadMode('file')}
                >
                  <FiUpload size={13} /> Upload Image File(s)
                </button>
                <button
                  type="button"
                  className={`img-uploader__tab ${uploadMode === 'url' ? 'img-uploader__tab--active' : ''}`}
                  onClick={() => setUploadMode('url')}
                >
                  <FiImage size={13} /> Image URL
                </button>
              </div>

              {uploadMode === 'file' && (
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
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div className="hero-editor-upload__icon"><FiUpload size={28} /></div>
                  <p className="hero-editor-upload__text">
                    <strong>Click to upload</strong> or drag &amp; drop {deviceView === 'desktop' ? 'desktop' : 'mobile'} image(s)
                  </p>
                  <p className="hero-editor-upload__hint">
                    {deviceView === 'desktop'
                      ? 'PNG, JPG, WEBP (Landscape 16:9 / 21:9 — 1920×1080 recommended)'
                      : 'PNG, JPG, WEBP (Portrait 4:5 / 9:16 — 1080×1350 recommended)'}
                  </p>
                </div>
              )}

              {uploadMode === 'url' && (
                <div className="hero-editor-url" style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="hero-editor-url__input-wrap" style={{ flex: 1 }}>
                      <FiImage size={16} className="hero-editor-url__icon" />
                      <input
                        className="dash-field__input hero-editor-url__input"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder={deviceView === 'desktop' ? "https://example.com/desktop-banner.jpg or /images/..." : "https://example.com/mobile-banner.jpg or /images/..."}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addImageUrl();
                          }
                        }}
                      />
                    </div>
                    <button className="dash-btn dash-btn--primary" onClick={addImageUrl} style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                      <FiPlus size={16} style={{ marginRight: '6px' }} /> Add Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Images List for Active View */}
            <div style={{ marginTop: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {deviceView === 'desktop' ? '💻 Desktop Banners' : '📱 Mobile Banners'} ({currentImages.length})
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {desktopImages.length > 0 && (
                    <button
                      type="button"
                      className="dash-btn dash-btn--secondary"
                      onClick={copyDesktopToMobile}
                      disabled={saving}
                      title="Sync current Desktop banners to Mobile view"
                      style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <FiCopy size={13} />
                      <span>{saving ? 'Syncing...' : 'Sync Desktop to Mobile'}</span>
                    </button>
                  )}
                  {(desktopImages.length > 0 || mobileImages.length > 0) && (
                    <button 
                      className="hero-editor-preview__btn hero-editor-preview__btn--remove" 
                      onClick={clearAllImages} 
                      disabled={saving}
                      title="Remove all hero banners from storefront"
                    >
                      {saving ? 'Clearing...' : 'Clear All Banners'}
                    </button>
                  )}
                </div>
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
                            disabled={saving}
                            title="Remove this banner"
                          >
                            <FiTrash2 size={14} /> {saving ? 'Saving...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Save Hero Banner Changes Bottom Bar ── */}
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px 20px 10px', borderTop: '1px solid #eee' }}>
              <button
                type="button"
                className={`dash-btn dash-btn--primary ${saveSuccess ? 'dash-btn--success' : ''}`}
                onClick={handleSaveHero}
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
                <span>{saving ? 'Saving...' : (saveSuccess ? 'Saved to Server!' : 'Save Hero Banner Changes')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
