import { useState, useRef, useEffect } from 'react';
import { 
  FiUploadCloud, 
  FiImage, 
  FiLink, 
  FiTrash2, 
  FiRefreshCw, 
  FiAlertCircle, 
  FiCheck 
} from 'react-icons/fi';
import { compressImage, normalizeImageInput } from '../../utils/imageOptimizer';
import './ProductImageUploader.css';

/**
 * Dedicated Product Image Uploader for Admin Product Manager.
 * Allows uploading real product images (PNG, JPG, WEBP) via file picker,
 * drag-and-drop, or image URL, with automatic client-side compression.
 * Completely eliminates SVG code input for products.
 */
export default function ProductImageUploader({
  value = '',
  onChange,
  label = 'Product Image',
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.85,
  helperText = 'Upload a high-quality product photo (JPG, PNG, or WEBP).'
}) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setImgError(false);
  }, [value]);

  const processFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);

    try {
      const compressed = await compressImage(file, maxWidth, maxHeight, quality);
      onChange(compressed);
    } catch (err) {
      setErrorMessage('Failed to process image: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const applyUrlString = (rawUrl) => {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) return false;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/') && !trimmed.startsWith('data:image/')) {
      setErrorMessage('URL must begin with http://, https://, /, or data:image/');
      return false;
    }

    setErrorMessage('');
    const formatted = normalizeImageInput(trimmed);
    onChange(formatted);
    setUrlInput('');
    return true;
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid image URL.');
      return;
    }
    applyUrlString(trimmed);
  };

  const handleUrlInputChange = (e) => {
    const val = e.target.value;
    setUrlInput(val);
    const trimmed = val.trim();
    // Auto-apply immediately if user pasted or finished typing a standard image URL
    if (
      (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) &&
      trimmed.length > 10 &&
      /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)
    ) {
      applyUrlString(trimmed);
    }
  };

  const handleUrlPaste = (e) => {
    const pasted = e.clipboardData?.getData('text');
    if (pasted) {
      const trimmed = pasted.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('data:image/')) {
        e.preventDefault();
        applyUrlString(trimmed);
      }
    }
  };

  const handleUrlBlur = () => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      applyUrlString(trimmed);
    }
  };

  const handleRemove = () => {
    onChange('');
    setErrorMessage('');
    setUrlInput('');
    setImgError(false);
  };

  return (
    <div className="product-img-uploader">
      {label && <label className="dash-field__label">{label}</label>}

      {/* ── If image is present: show preview card ── */}
      {value ? (
        <div className="product-img-preview-card">
          <div className="product-img-preview-thumb">
            {!imgError ? (
              <img 
                src={value} 
                alt="Product Preview" 
                onError={() => setImgError(true)} 
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#d97706', padding: '4px', textAlign: 'center' }} title="Preview could not be rendered from this URL, but URL is saved">
                <FiAlertCircle size={22} />
                <span style={{ fontSize: '9px', marginTop: '2px', fontWeight: 600 }}>URL Saved</span>
              </div>
            )}
          </div>

          <div className="product-img-preview-info">
            <div className="product-img-preview-header">
              <span className="product-img-badge">
                <FiCheck size={12} /> Image Ready
              </span>
              {imgError && (
                <span style={{ fontSize: '0.72rem', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                  Preview not loaded, but link is saved
                </span>
              )}
            </div>
            <p className="product-img-url-text" title={value}>
              {value.startsWith('data:') 
                ? 'Uploaded Image File (Optimized WebP)' 
                : value.length > 50 ? value.substring(0, 47) + '...' : value}
            </p>

            <div className="product-img-preview-actions">
              <button
                type="button"
                className="dash-btn dash-btn--secondary product-img-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <FiRefreshCw size={13} className={isUploading ? 'spin' : ''} />
                {isUploading ? 'Uploading...' : 'Replace File'}
              </button>

              <button
                type="button"
                className="dash-btn dash-btn--secondary product-img-btn"
                onClick={() => {
                  setActiveTab('url');
                  setUrlInput(value.startsWith('http') || value.startsWith('/') ? value : '');
                  onChange('');
                }}
                disabled={isUploading}
              >
                <FiLink size={13} />
                Enter URL
              </button>

              <button
                type="button"
                className="dash-btn dash-btn--danger product-img-btn"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <FiTrash2 size={13} />
                Remove
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        /* ── If no image: show upload & URL tabs ── */
        <div className="product-img-upload-box">
          <div className="product-img-tabs">
            <button
              type="button"
              className={`product-img-tab ${activeTab === 'file' ? 'product-img-tab--active' : ''}`}
              onClick={() => setActiveTab('file')}
            >
              <FiUploadCloud size={14} /> Upload Image File
            </button>
            <button
              type="button"
              className={`product-img-tab ${activeTab === 'url' ? 'product-img-tab--active' : ''}`}
              onClick={() => setActiveTab('url')}
            >
              <FiLink size={14} /> Image URL
            </button>
          </div>

          {activeTab === 'file' ? (
            <div 
              className={`product-img-dropzone ${isDragOver ? 'product-img-dropzone--dragover' : ''} ${isUploading ? 'product-img-dropzone--loading' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              <div className="product-img-dropzone-icon">
                {isUploading ? (
                  <FiRefreshCw size={28} className="spin" />
                ) : (
                  <FiUploadCloud size={32} />
                )}
              </div>

              <div className="product-img-dropzone-text">
                <span className="product-img-dropzone-primary">
                  {isUploading ? 'Compressing & uploading image...' : 'Click to browse or drag & drop product image'}
                </span>
                <span className="product-img-dropzone-secondary">
                  Supports PNG, JPG, JPEG, and WEBP
                </span>
              </div>
            </div>
          ) : (
            <div className="product-img-url-box">
              <div className="product-img-url-input-wrap">
                <input
                  type="url"
                  className="dash-field__input product-img-url-input"
                  placeholder="https://example.com/product-photo.jpg"
                  value={urlInput}
                  onChange={handleUrlInputChange}
                  onPaste={handleUrlPaste}
                  onBlur={handleUrlBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  className="dash-btn dash-btn--primary product-img-url-btn"
                  onClick={handleApplyUrl}
                >
                  Apply URL
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="product-img-error">
          <FiAlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      {helperText && !errorMessage && (
        <p className="product-img-helper">{helperText}</p>
      )}
    </div>
  );
}
