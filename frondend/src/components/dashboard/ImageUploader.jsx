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
  const [isEditingSvg, setIsEditingSvg] = useState(false);

  // Detect whether current value is SVG
  const isCurrentSvg = isSvg(value);

  // Sync SVG input when entering SVG edit mode
  useEffect(() => {
    if (isCurrentSvg && value) {
      const code = extractSvgCode(value);
      if (code) setSvgInput(code);
    }
  }, [value, isCurrentSvg]);

  // Handle applying direct SVG code
  const handleApplySvg = () => {
    setSvgError('');
    const trimmed = svgInput.trim();
    if (!trimmed) {
      setSvgError('Please paste your SVG code.');
      return;
    }

    if (!trimmed.includes('<svg') || !trimmed.includes('</svg>')) {
      setSvgError('Invalid SVG markup. Ensure it starts with <svg and ends with </svg>.');
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

  // Handle applying URL
  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    // Auto-detect if user pasted raw SVG code in the URL box
    if (trimmed.startsWith('<svg')) {
      const dataUrl = svgToDataUrl(trimmed);
      onChange(dataUrl);
    } else {
      onChange(normalizeImageInput(trimmed));
    }
    setUrlInput('');
  };

  const handleRemove = () => {
    onChange('');
    setSvgInput('');
    setUrlInput('');
    setIsEditingSvg(false);
  };

  const handleStartEditSvg = () => {
    const code = extractSvgCode(value);
    setSvgInput(code || '');
    setTab('svg');
    setIsEditingSvg(true);
  };

  // If image is present and not currently editing its SVG
  if (value && !isEditingSvg) {
    return (
      <div className={`img-uploader ${compact ? 'img-uploader--compact' : ''}`}>
        {label && <label className="dash-field__label">{label}</label>}

        <div className="img-uploader__preview-wrap">
          <div className="img-uploader__checkerboard">
            <img src={value} alt="Preview" className="img-uploader__preview-img" />
          </div>

          <div className="img-uploader__preview-info">
            <div className="img-uploader__badge-row">
              <span className={`img-uploader__badge ${isCurrentSvg ? 'img-uploader__badge--svg' : 'img-uploader__badge--raster'}`}>
                {isCurrentSvg ? 'SVG Vector' : 'Image URL'}
              </span>
            </div>

            <div className="img-uploader__preview-actions">
              {isCurrentSvg && (
                <button
                  type="button"
                  className="img-uploader__btn img-uploader__btn--secondary"
                  onClick={handleStartEditSvg}
                  title="View and edit the SVG code"
                >
                  <FiCode size={14} /> Edit SVG Code
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
            onChange={(e) => {
              setSvgInput(e.target.value);
              setSvgError('');
            }}
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
          {svgInput.trim().startsWith('<svg') && svgInput.trim().endsWith('</svg>') && (
            <div className="img-uploader__svg-live-preview">
              <span className="img-uploader__svg-preview-label">Live Preview:</span>
              <div className="img-uploader__checkerboard img-uploader__checkerboard--mini">
                <img
                  src={svgToDataUrl(svgInput)}
                  alt="SVG Preview"
                  className="img-uploader__svg-live-img"
                />
              </div>
            </div>
          )}

          <div className="img-uploader__svg-actions">
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={handleApplySvg}
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
              onChange={(e) => setUrlInput(e.target.value)}
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
