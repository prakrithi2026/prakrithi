import { useState, useRef } from 'react';
import { FiPlus, FiTrash2, FiUpload, FiX, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { compressImage, isSvg } from '../../utils/imageOptimizer';
import './NavbarEditor.css';

export default function NavbarEditor() {
  const { config, updateConfig } = useSiteConfig();
  const { navbar, announcement } = config;

  const [logoDragActive, setLogoDragActive] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoFileInputRef = useRef(null);

  const handleLogoFile = async (file) => {
    if (!file) return;
    setLogoError('');

    const isImage = file.type?.startsWith('image/') || file.name?.toLowerCase().endsWith('.svg');
    if (!isImage) {
      setLogoError('Please select a valid image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    try {
      setIsProcessingLogo(true);
      // compressImage automatically preserves vector SVG or compresses raster to WebP
      const optimizedLogo = await compressImage(file, 400, 400, 0.85);
      updateConfig('navbar.logo', optimizedLogo);
    } catch (err) {
      console.error('Error processing logo image:', err);
      setLogoError('Failed to process image: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleLogoFile(file);
    if (e.target) e.target.value = '';
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    setLogoDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoFile(file);
  };

  const handleLogoDragOver = (e) => {
    e.preventDefault();
    setLogoDragActive(true);
  };

  const handleLogoDragLeave = () => {
    setLogoDragActive(false);
  };

  const removeLogo = () => {
    updateConfig('navbar.logo', '');
    setLogoError('');
  };

  const updateNavItem = (index, field, value) => {
    const items = [...navbar.items];
    items[index] = { ...items[index], [field]: value };
    updateConfig('navbar.items', items);
  };

  const addNavItem = () => {
    const items = [...navbar.items, { id: `item-${Date.now()}`, label: 'New Link', href: '#', hasDropdown: false, dropdownItems: [] }];
    updateConfig('navbar.items', items);
  };

  const removeNavItem = (index) => {
    const items = navbar.items.filter((_, i) => i !== index);
    updateConfig('navbar.items', items);
  };

  /* Dropdown sub-item helpers */
  const addDropdownItem = (navIndex) => {
    const items = [...navbar.items];
    const ddItems = [...(items[navIndex].dropdownItems || []), { label: 'New Link', href: '#' }];
    items[navIndex] = { ...items[navIndex], dropdownItems: ddItems };
    updateConfig('navbar.items', items);
  };

  const updateDropdownItem = (navIndex, ddIndex, field, value) => {
    const items = [...navbar.items];
    const ddItems = [...(items[navIndex].dropdownItems || [])];
    ddItems[ddIndex] = { ...ddItems[ddIndex], [field]: value };
    items[navIndex] = { ...items[navIndex], dropdownItems: ddItems };
    updateConfig('navbar.items', items);
  };

  const removeDropdownItem = (navIndex, ddIndex) => {
    const items = [...navbar.items];
    const ddItems = (items[navIndex].dropdownItems || []).filter((_, i) => i !== ddIndex);
    items[navIndex] = { ...items[navIndex], dropdownItems: ddItems };
    updateConfig('navbar.items', items);
  };

  const moveItem = (index, direction) => {
    const items = [...navbar.items];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    updateConfig('navbar.items', items);
  };

  return (
    <div>
      {/* Announcement Bar */}
      <div className="dash-panel">
        <h2 className="dash-panel__title">📢 Announcement Bar</h2>
        <p className="dash-panel__subtitle">Configure the promotional banner at the top</p>

        <div className="dash-field">
          <label className="dash-field__label">
            <input
              type="checkbox"
              checked={announcement.enabled}
              onChange={(e) => updateConfig('announcement.enabled', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Show Announcement Bar
          </label>
        </div>

        <div className="dash-field">
          <label className="dash-field__label">Announcement Text</label>
          <input
            className="dash-field__input"
            value={announcement.text}
            onChange={(e) => updateConfig('announcement.text', e.target.value)}
          />
        </div>
      </div>

      {/* Navbar Settings */}
      <div className="dash-panel">
        <h2 className="dash-panel__title">🧭 Navbar Settings</h2>
        <p className="dash-panel__subtitle">Customize logo, colors, and navigation items</p>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Brand Name</label>
            <input
              className="dash-field__input"
              value={navbar.brandName}
              onChange={(e) => updateConfig('navbar.brandName', e.target.value)}
            />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">Brand Subtitle</label>
            <input
              className="dash-field__input"
              value={navbar.brandSubtitle}
              onChange={(e) => updateConfig('navbar.brandSubtitle', e.target.value)}
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="dash-field">
          <label className="dash-field__label">Navbar Logo</label>

          {/* Hidden File Input */}
          <input
            ref={logoFileInputRef}
            type="file"
            accept="image/*,.svg"
            onChange={handleLogoFileChange}
            style={{ display: 'none' }}
          />

          {/* Current Logo Preview Card */}
          {navbar.logo ? (
            <div className="nb-logo-preview">
              <div className="nb-logo-preview__img-box">
                <img src={navbar.logo} alt="Navbar Logo Preview" className="nb-logo-preview__img" />
              </div>

              <div className="nb-logo-preview__details">
                <div className="nb-logo-preview__badge-row">
                  <span className={`nb-logo-badge ${isSvg(navbar.logo) ? 'nb-logo-badge--svg' : 'nb-logo-badge--raster'}`}>
                    {isSvg(navbar.logo) ? 'Vector SVG' : 'Optimized Image'}
                  </span>
                  <span className="nb-logo-badge nb-logo-badge--active">Active</span>
                </div>
                <p className="nb-logo-preview__hint">
                  {isSvg(navbar.logo)
                    ? 'Scales crisply to any resolution without pixelation.'
                    : 'Optimized for fast loading and crisp high-DPI display.'}
                </p>
              </div>

              <div className="nb-logo-preview__actions">
                <button
                  type="button"
                  className="nb-logo-preview__change"
                  onClick={() => logoFileInputRef.current?.click()}
                  disabled={isProcessingLogo}
                  title="Upload a different image file"
                >
                  <FiRefreshCw size={13} className={isProcessingLogo ? 'nb-spin' : ''} />
                  {isProcessingLogo ? 'Processing...' : 'Change Image'}
                </button>
                <button
                  type="button"
                  className="nb-logo-preview__remove"
                  onClick={removeLogo}
                  disabled={isProcessingLogo}
                  title="Remove current logo"
                >
                  <FiX size={14} /> Remove
                </button>
              </div>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              className={`nb-logo-upload ${logoDragActive ? 'nb-logo-upload--active' : ''} ${isProcessingLogo ? 'nb-logo-upload--uploading' : ''}`}
              onClick={() => !isProcessingLogo && logoFileInputRef.current?.click()}
              onDrop={handleLogoDrop}
              onDragOver={handleLogoDragOver}
              onDragLeave={handleLogoDragLeave}
            >
              <div className="nb-logo-upload__icon">
                {isProcessingLogo ? (
                  <FiRefreshCw size={24} className="nb-spin" />
                ) : (
                  <FiUpload size={24} />
                )}
              </div>
              <p className="nb-logo-upload__text">
                {isProcessingLogo ? (
                  <strong>Optimizing & processing logo...</strong>
                ) : (
                  <><strong>Click to upload</strong> or drag & drop</>
                )}
              </p>
              <p className="nb-logo-upload__hint">PNG, JPG, SVG, WEBP (Recommended up to 400×400px)</p>
            </div>
          )}

          {logoError && (
            <div className="nb-logo-error">
              <FiAlertCircle size={14} />
              <span>{logoError}</span>
            </div>
          )}

          <p className="dash-field__hint" style={{ marginTop: '6px' }}>
            Upload your logo image directly. Vector SVGs and high-resolution images are automatically formatted for crisp display in the navbar.
          </p>
        </div>



        {/* Nav Items */}
        <h4 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '0.92rem', fontWeight: 600 }}>
          Menu Items
        </h4>
        <div className="nav-items-list">
          {navbar.items.map((item, i) => (
            <div key={item.id} className="nav-item-row-wrap">
              <div className="nav-item-row">
                <div className="nav-item-row__drag">
                  <button className="nav-item-row__move" onClick={() => moveItem(i, -1)} title="Move up">↑</button>
                  <button className="nav-item-row__move" onClick={() => moveItem(i, 1)} title="Move down">↓</button>
                </div>
                <input
                  className="nav-item-row__input"
                  value={item.label}
                  onChange={(e) => updateNavItem(i, 'label', e.target.value)}
                  placeholder="Label"
                />
                <input
                  className="nav-item-row__input nav-item-row__input--sm"
                  value={item.href}
                  onChange={(e) => updateNavItem(i, 'href', e.target.value)}
                  placeholder="URL"
                />
                <input
                  className="nav-item-row__input nav-item-row__input--xs"
                  value={item.badge || ''}
                  onChange={(e) => updateNavItem(i, 'badge', e.target.value || null)}
                  placeholder="Badge"
                />
                <label className="nav-item-row__check">
                  <input
                    type="checkbox"
                    checked={item.hasDropdown || false}
                    onChange={(e) => {
                      updateNavItem(i, 'hasDropdown', e.target.checked);
                      if (e.target.checked && !item.dropdownItems) {
                        updateNavItem(i, 'dropdownItems', []);
                      }
                    }}
                  />
                  ▼
                </label>
                <button className="nav-item-row__delete" onClick={() => removeNavItem(i)}>
                  <FiTrash2 size={14} />
                </button>
              </div>

              {/* Dropdown sub-items editor */}
              {item.hasDropdown && (
                <div className="nav-dropdown-editor">
                  <h5 className="nav-dropdown-editor__title">▾ Dropdown Items</h5>
                  <div className="nav-dropdown-editor__list">
                    {(item.dropdownItems || []).map((dd, j) => (
                      <div key={j} className="nav-dropdown-editor__row">
                        <input
                          className="nav-item-row__input"
                          value={dd.label}
                          onChange={(e) => updateDropdownItem(i, j, 'label', e.target.value)}
                          placeholder="Label"
                        />
                        <input
                          className="nav-item-row__input nav-item-row__input--sm"
                          value={dd.href}
                          onChange={(e) => updateDropdownItem(i, j, 'href', e.target.value)}
                          placeholder="URL (#)"
                        />
                        <button className="nav-item-row__delete nav-dropdown-editor__delete" onClick={() => removeDropdownItem(i, j)} title="Delete item">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="dash-btn dash-btn--ghost nav-dropdown-editor__add" onClick={() => addDropdownItem(i)}>
                    <FiPlus size={13} style={{ marginRight: '4px' }} /> Add Dropdown Item
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="dash-btn dash-btn--ghost" onClick={addNavItem} style={{ marginTop: '12px' }}>
          <FiPlus size={16} style={{ marginRight: '6px' }} />
          Add Menu Item
        </button>
      </div>
    </div>
  );
}
