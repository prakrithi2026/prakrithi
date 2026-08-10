import { useState, useRef, useEffect } from 'react';
import { FiUpload, FiX, FiImage, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { compressImage } from '../../utils/imageOptimizer';
import './HeroEditor.css';

export default function HeroEditor() {
  const { config, updateConfig } = useSiteConfig();
  const { hero } = config;
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);

  const images = hero.images || [];

  // Automatically migrate legacy single background image to the slideshow images list
  useEffect(() => {
    if (!hero.images && hero.bgImage) {
      updateConfig('hero.images', [hero.bgImage]);
    }
  }, [hero.images, hero.bgImage, updateConfig]);

  const handleFilesUpload = async (files) => {
    const currentImages = [...images];
    let updated = false;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file, 1200, 1200, 0.7);
          currentImages.push(compressed);
          updated = true;
        } catch (err) {
          console.error('Error compressing hero slideshow image:', err);
        }
      }
    }
    
    if (updated) {
      updateConfig('hero.images', currentImages);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
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
    updateConfig('hero.images', [...images, urlInput.trim()]);
    setUrlInput('');
  };

  const removeImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    updateConfig('hero.images', updated);
    if (updated.length === 0) {
      updateConfig('hero.bgImage', '');
    }
  };

  const clearAllImages = () => {
    if (window.confirm('Are you sure you want to remove all slideshow images?')) {
      updateConfig('hero.images', []);
      updateConfig('hero.bgImage', '');
    }
  };

  return (
    <div>
      <div className="dash-panel">
        <div className="section-manager-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="dash-panel__title">🖼️ Hero Banner Slideshow</h2>
            <p className="dash-panel__subtitle">Upload and manage background slides for the homepage hero section</p>
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
            {/* Upload Area */}
            <div className="hero-editor-image-section" style={{ marginTop: '20px' }}>
              <label className="dash-field__label" style={{ marginBottom: '12px', display: 'block' }}>
                Upload Slideshow Images
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
                <p className="hero-editor-upload__text"><strong>Click to upload</strong> or drag and drop multiple images</p>
                <p className="hero-editor-upload__hint">PNG, JPG, WEBP up to 5MB (Recommeded aspect ratio: 16:9 or 21:9)</p>
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
                      placeholder="https://example.com/slide-image.jpg"
                    />
                  </div>
                  <button className="dash-btn" onClick={addImageUrl} style={{ height: '42px', padding: '0 16px' }}>
                    <FiPlus size={16} style={{ marginRight: '6px' }} /> Add URL
                  </button>
                </div>
              </div>
            </div>

            {/* Uploaded Images List */}
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  Slideshow Previews ({images.length})
                </h3>
                {images.length > 0 && (
                  <button className="hero-editor-preview__btn hero-editor-preview__btn--remove" onClick={clearAllImages}>
                    Clear All
                  </button>
                )}
              </div>

              {images.length === 0 ? (
                <div style={{
                  padding: '30px',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.9rem'
                }}>
                  No slideshow images uploaded yet. Upload images above to display on your storefront.
                </div>
              ) : (
                <div className="hero-slides-grid">
                  {images.map((img, index) => (
                    <div key={index} className="hero-slide-card">
                      <div
                        className="hero-slide-card__preview"
                        style={{ backgroundImage: `url(${img})` }}
                      >
                        <span className="hero-slide-card__badge">Slide {index + 1}</span>
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

            {images.length >= 2 && (
              <div style={{
                marginTop: '20px',
                padding: '12px 16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                fontSize: '0.85rem',
                color: '#1e3a8a'
              }}>
                ℹ️ Multiple images uploaded. The storefront will automatically scroll through these slides with a cross-fade transition every 5 seconds.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
