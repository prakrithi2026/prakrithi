import { useState, useEffect } from 'react';
import { FiImage, FiCode, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { svgToDataUrl, extractSvgCode, isSvg, normalizeImageInput } from '../../utils/imageOptimizer';
import './ImageUploader.css';

/**
 * Reusable Admin Image & SVG Input Component
 * Supports:
 *  1. Direct SVG Code Input (pasting <svg>...</svg> with live preview & editing)
 *  2. Direct Image URL Input
 * File upload / pickers removed per design requirement.
 */
export default function ImageUploader({
  value = '',
  onChange,
  label = '',
  placeholder = 'https://example.com/image.png or /images/...',
  compact = false,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.85,
  helperText = ''
}) {
  const [tab, setTab] = useState('svg'); // 'svg' | 'url'
  const [svgInput, setSvgInput] = useState('');
  const [svgError, setSvgError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isEditingSvg, setIsEditingSvg] = useState(!value);
  const [previewTheme, setPreviewTheme] = useState('dark'); // 'dark' | 'light'

  // Detect whether current value is SVG
  const isCurrentSvg = isSvg(value);

  // Sync SVG input when entering SVG edit mode or when value changes
  useEffect(() => {
    if (isCurrentSvg && value) {
      const code = extractSvgCode(value);
      if (code && !isEditingSvg) {
        setSvgInput(code);
      }
    }
    if (!value) {
      setIsEditingSvg(true);
    }
  }, [value, isCurrentSvg, isEditingSvg]);

  // Handle typing / pasting SVG code
  const handleSvgChange = (text) => {
    setSvgInput(text);
    setSvgError('');
    setIsEditingSvg(true);
    const trimmed = text.trim();
    if (!trimmed) {
      onChange('');
      return;
    }

    if (isSvg(trimmed)) {
      try {
        const dataUrl = svgToDataUrl(trimmed);
        onChange(dataUrl);
      } catch (err) {
        // Keep typing
      }
    }
  };

  // Handle blur on SVG textarea to ensure validity
  const handleSvgBlur = () => {
    const trimmed = svgInput.trim();
    if (!trimmed) {
      onChange('');
      return;
    }

    if (isSvg(trimmed)) {
      try {
        const dataUrl = svgToDataUrl(trimmed);
        onChange(dataUrl);
      } catch (err) {
        setSvgError('Error converting SVG: ' + err.message);
      }
    } else {
      setSvgError('Invalid SVG markup. Ensure it contains <svg> and </svg>.');
    }
  };

  // Handle explicit "Apply SVG Code" button
  const handleApplySvg = () => {
    setSvgError('');
    const trimmed = svgInput.trim();
    if (!trimmed) {
      setSvgError('Please paste your SVG code.');
      return;
    }

    if (!isSvg(trimmed)) {
      setSvgError('Invalid SVG markup. Ensure it contains <svg> and </svg>.');
      return;
    }

    try {
      const dataUrl = svgToDataUrl(trimmed);
      onChange(dataUrl);
      setIsEditingSvg(false);
    } catch (err) {
      setSvgError('Error converting SVG: ' + err.message);
    }
  };

  // Handle applying URL with auto-sync
  const handleUrlChange = (text) => {
    setUrlInput(text);
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isSvg(trimmed)) {
      const dataUrl = svgToDataUrl(trimmed);
      onChange(dataUrl);
    } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      onChange(normalizeImageInput(trimmed));
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (isSvg(trimmed)) {
      const dataUrl = svgToDataUrl(trimmed);
      onChange(dataUrl);
    } else {
      onChange(normalizeImageInput(trimmed));
    }
    setUrlInput('');
    setIsEditingSvg(false);
  };

  const handleRemove = () => {
    onChange('');
    setSvgInput('');
    setUrlInput('');
    setIsEditingSvg(true);
  };

  const handleStartEditSvg = () => {
    const code = extractSvgCode(value);
    setSvgInput(code || '');
    setTab('svg');
    setIsEditingSvg(true);
  };

  const handleStartReplace = () => {
    setTab('svg');
    setSvgInput('');
    setUrlInput('');
    setIsEditingSvg(true);
  };

  // If image is present and not currently editing/replacing it
  if (value && !isEditingSvg) {
    return (
      <div className={`img-uploader ${compact ? 'img-uploader--compact' : ''}`}>
        {label && <label className="dash-field__label">{label}</label>}

        <div className="img-uploader__preview-wrap">
          <div className={`img-uploader__checkerboard ${previewTheme === 'dark' ? 'img-uploader__checkerboard--dark' : 'img-uploader__checkerboard--light'}`}>
            <img src={value} alt="Preview" className="img-uploader__preview-img" />
          </div>

          <div className="img-uploader__preview-info">
            <div className="img-uploader__badge-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`img-uploader__badge ${isCurrentSvg ? 'img-uploader__badge--svg' : 'img-uploader__badge--raster'}`}>
                {isCurrentSvg ? 'SVG Vector' : 'Image URL'}
              </span>
              <button
                type="button"
                className="img-uploader__theme-toggle"
                onClick={() => setPreviewTheme(t => t === 'dark' ? 'light' : 'dark')}
                title="Toggle preview background contrast (helpful for white SVGs)"
              >
                {previewTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>

            <div className="img-uploader__preview-actions">
              {isCurrentSvg ? (
                <button
                  type="button"
                  className="img-uploader__btn img-uploader__btn--secondary"
                  onClick={handleStartEditSvg}
                  title="View and edit the SVG code"
                >
                  <FiCode size={14} /> Edit SVG Code
                </button>
              ) : (
                <button
                  type="button"
                  className="img-uploader__btn img-uploader__btn--secondary"
                  onClick={handleStartReplace}
                  title="Replace with SVG code or new image URL"
                >
                  <FiCode size={14} /> Replace with SVG / URL
                </button>
              )}
              <button
                type="button"
                className="img-uploader__btn img-uploader__btn--danger"
                onClick={handleRemove}
                title="Remove image"
              >
                <FiX size={14} /> Remove
              </button>
            </div>
          </div>
        </div>

        {helperText && <p className="img-uploader__helper">{helperText}</p>}
      </div>
    );
  }

  // Upload / Input UI
  return (
    <div className={`img-uploader ${compact ? 'img-uploader--compact' : ''}`}>
      {label && <label className="dash-field__label">{label}</label>}

      {/* Tabs */}
      <div className="img-uploader__tabs">
        <button
          type="button"
          className={`img-uploader__tab ${tab === 'svg' ? 'img-uploader__tab--active' : ''}`}
          onClick={() => {
            setTab('svg');
            if (!svgInput && isCurrentSvg && value) {
              setSvgInput(extractSvgCode(value));
            }
          }}
        >
          <FiCode size={13} /> SVG Code
        </button>
        <button
          type="button"
          className={`img-uploader__tab ${tab === 'url' ? 'img-uploader__tab--active' : ''}`}
          onClick={() => setTab('url')}
        >
          <FiImage size={13} /> Image URL
        </button>
      </div>

      {/* Tab 1: Paste SVG Code */}
      {tab === 'svg' && (
        <div className="img-uploader__svg-pane">
          <textarea
            className="img-uploader__svg-textarea"
            value={svgInput}
            onChange={(e) => handleSvgChange(e.target.value)}
            onBlur={handleSvgBlur}
            placeholder={'<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="15" cy="15" r="10" stroke="#00472A" stroke-width="2"/>\n</svg>'}
            rows={compact ? 4 : 6}
            spellCheck={false}
          />

          {svgError && (
            <div className="img-uploader__svg-error">
              <FiAlertCircle size={14} /> {svgError}
            </div>
          )}

          {/* Live mini preview of the SVG being edited */}
          {isSvg(svgInput) && (
            <div className="img-uploader__svg-live-preview">
              <span className="img-uploader__svg-preview-label">Live Preview:</span>
              <div className={`img-uploader__checkerboard img-uploader__checkerboard--mini ${previewTheme === 'dark' ? 'img-uploader__checkerboard--dark' : 'img-uploader__checkerboard--light'}`}>
                <img
                  src={svgToDataUrl(svgInput)}
                  alt="SVG Preview"
                  className="img-uploader__svg-live-img"
                />
              </div>
              <button
                type="button"
                className="img-uploader__theme-toggle"
                onClick={() => setPreviewTheme(t => t === 'dark' ? 'light' : 'dark')}
                title="Toggle preview background contrast"
              >
                {previewTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          )}

          <div className="img-uploader__svg-actions">
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={handleApplySvg}
              title="Apply SVG code and update preview"
            >
              <FiCheck size={14} style={{ marginRight: '5px' }} /> Apply SVG Code
            </button>
            {isEditingSvg && (
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                onClick={() => setIsEditingSvg(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Image URL */}
      {tab === 'url' && (
        <div className="img-uploader__url-pane">
          <div className="img-uploader__url-row">
            <FiImage size={15} className="img-uploader__url-icon" />
            <input
              type="text"
              className="dash-field__input img-uploader__url-input"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              onBlur={handleApplyUrl}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyUrl();
                }
              }}
            />
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={handleApplyUrl}
              style={{ whiteSpace: 'nowrap', padding: '0 12px', fontSize: '0.82rem' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {helperText && <p className="img-uploader__helper">{helperText}</p>}
    </div>
  );
}
