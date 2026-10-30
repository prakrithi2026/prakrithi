import { useState, useRef } from 'react';
import {
  FiUploadCloud,
  FiLink,
  FiTrash2,
  FiStar,
  FiArrowLeft,
  FiArrowRight,
  FiPlus,
  FiAlertCircle,
  FiCheck,
  FiRefreshCw
} from 'react-icons/fi';
import { compressImage, normalizeImageInput } from '../../utils/imageOptimizer';
import './MultiProductImageUploader.css';

/**
 * MultiProductImageUploader:
 * Allows admin to upload multiple images for a product, reorder them,
 * set the primary/cover photo, and delete images.
 */
export default function MultiProductImageUploader({
  images = [],
  onChange,
  label = 'Product Images',
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.85,
  helperText = 'Upload multiple photos. The first image is the cover photo shown in product cards.'
}) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const imageList = Array.isArray(images) ? images.filter(Boolean) : [];

  const processFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setErrorMessage('Please select valid image files (PNG, JPG, or WEBP).');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);

    try {
      const compressedResults = await Promise.all(
        validFiles.map(async (file) => {
          try {
            return await compressImage(file, maxWidth, maxHeight, quality);
          } catch (e) {
            console.warn('Failed to compress file:', file.name, e);
            return null;
          }
        })
      );

      const validCompressed = compressedResults.filter(Boolean);
      if (validCompressed.length > 0) {
        onChange([...imageList, ...validCompressed]);
      } else {
        setErrorMessage('Failed to process any of the selected images.');
      }
    } catch (err) {
      setErrorMessage('Failed to process images: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
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
    if (!trimmed) return;

    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('/') &&
      !trimmed.startsWith('data:image/')
    ) {
      setErrorMessage('URL must begin with http://, https://, /, or data:image/');
      return;
    }

    setErrorMessage('');
    const formatted = normalizeImageInput(trimmed);
    onChange([...imageList, formatted]);
    setUrlInput('');
  };

  const handleApplyUrl = () => {
    applyUrlString(urlInput);
  };

  const handleSetCover = (index) => {
    if (index === 0) return;
    const selected = imageList[index];
    const rest = imageList.filter((_, i) => i !== index);
    onChange([selected, ...rest]);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= imageList.length) return;
    const nextList = [...imageList];
    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;
    onChange(nextList);
  };

  const handleRemove = (index) => {
    const nextList = imageList.filter((_, i) => i !== index);
    onChange(nextList);
  };

  return (
    <div className="multi-product-img-uploader">
      <div className="multi-product-img-uploader__header">
        {label && <label className="dash-field__label">{label}</label>}
        {imageList.length > 0 && (
          <span className="multi-product-img-counter">
            <FiCheck size={13} /> {imageList.length} {imageList.length === 1 ? 'image' : 'images'}
          </span>
        )}
      </div>

      {/* ── Image Gallery Grid if images exist ── */}
      {imageList.length > 0 && (
        <div className="multi-img-grid">
          {imageList.map((imgSrc, index) => {
            const isCover = index === 0;
            return (
              <div
                key={`${index}-${imgSrc.substring(0, 30)}`}
                className={`multi-img-card ${isCover ? 'multi-img-card--cover' : ''}`}
              >
                <div className="multi-img-card__thumb">
                  <img src={imgSrc} alt={`Product photo ${index + 1}`} />
                  {isCover && (
                    <span className="multi-img-cover-badge">
                      <FiStar size={11} fill="#fff" /> Cover Photo
                    </span>
                  )}
                  <span className="multi-img-number-badge">#{index + 1}</span>
                </div>

                {/* Card controls */}
                <div className="multi-img-card__actions">
                  {!isCover && (
                    <button
                      type="button"
                      className="multi-img-btn multi-img-btn--cover"
                      onClick={() => handleSetCover(index)}
                      title="Set as Cover Photo"
                    >
                      <FiStar size={12} /> Set as Cover
                    </button>
                  )}

                  <div className="multi-img-card__nav-row">
                    <button
                      type="button"
                      className="multi-img-btn multi-img-btn--icon"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                      title="Move Left"
                    >
                      <FiArrowLeft size={13} />
                    </button>

                    <button
                      type="button"
                      className="multi-img-btn multi-img-btn--icon"
                      disabled={index === imageList.length - 1}
                      onClick={() => handleMove(index, 1)}
                      title="Move Right"
                    >
                      <FiArrowRight size={13} />
                    </button>

                    <button
                      type="button"
                      className="multi-img-btn multi-img-btn--icon multi-img-btn--danger"
                      onClick={() => handleRemove(index)}
                      title="Remove Image"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Add More Tile */}
          <div
            className="multi-img-add-card"
            onClick={() => fileInputRef.current?.click()}
            title="Add more photos"
          >
            {isUploading ? (
              <FiRefreshCw size={24} className="spin" />
            ) : (
              <FiPlus size={26} />
            )}
            <span>Add Photo</span>
          </div>
        </div>
      )}

      {/* ── Upload & URL Tabs Section ── */}
      <div className="multi-img-upload-box">
        <div className="multi-img-tabs">
          <button
            type="button"
            className={`multi-img-tab ${activeTab === 'file' ? 'multi-img-tab--active' : ''}`}
            onClick={() => setActiveTab('file')}
          >
            <FiUploadCloud size={14} /> Upload Image Files
          </button>
          <button
            type="button"
            className={`multi-img-tab ${activeTab === 'url' ? 'multi-img-tab--active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            <FiLink size={14} /> Add Image URL
          </button>
        </div>

        {activeTab === 'file' ? (
          <div
            className={`multi-img-dropzone ${isDragOver ? 'multi-img-dropzone--dragover' : ''} ${isUploading ? 'multi-img-dropzone--loading' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <div className="multi-img-dropzone-icon">
              {isUploading ? (
                <FiRefreshCw size={28} className="spin" />
              ) : (
                <FiUploadCloud size={32} />
              )}
            </div>

            <div className="multi-img-dropzone-text">
              <span className="multi-img-dropzone-primary">
                {isUploading
                  ? 'Optimizing and uploading images...'
                  : imageList.length === 0
                  ? 'Click to select multiple photos or drag & drop here'
                  : 'Click to select more photos or drop here'}
              </span>
              <span className="multi-img-dropzone-secondary">
                Select one or multiple images (PNG, JPG, WEBP)
              </span>
            </div>
          </div>
        ) : (
          <div className="multi-img-url-box">
            <div className="multi-img-url-input-wrap">
              <input
                type="url"
                className="dash-field__input multi-img-url-input"
                placeholder="https://example.com/product-image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyUrl();
                  }
                }}
              />
              <button
                type="button"
                className="dash-btn dash-btn--primary multi-img-url-btn"
                onClick={handleApplyUrl}
              >
                <FiPlus size={14} /> Add Image
              </button>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="multi-img-error">
          <FiAlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      {helperText && !errorMessage && (
        <p className="multi-img-helper">{helperText}</p>
      )}
    </div>
  );
}
