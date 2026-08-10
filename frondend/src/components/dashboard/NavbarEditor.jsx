import { useState, useRef } from 'react';
import { FiPlus, FiTrash2, FiMove, FiUpload, FiImage, FiX } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { compressImage } from '../../utils/imageOptimizer';
import './NavbarEditor.css';

export default function NavbarEditor() {
  const { config, updateConfig } = useSiteConfig();
  const { navbar, announcement } = config;
  const [logoDragActive, setLogoDragActive] = useState(false);
  const logoFileInputRef = useRef(null);

  const handleLogoFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImage(file, 300, 300, 0.8);
      updateConfig('navbar.logo', compressed);
    } catch (err) {
      console.error('Error compressing logo image:', err);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleLogoFile(file);
    e.target.value = '';
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
          <label className="dash-field__label">Logo Image</label>

          {/* Preview */}
          {navbar.logo && (
            <div className="nb-logo-preview">
              <img src={navbar.logo} alt="Logo preview" className="nb-logo-preview__img" />
              <button className="nb-logo-preview__remove" onClick={removeLogo} title="Remove logo">
                <FiX size={14} /> Remove
              </button>
            </div>
          )}

          {/* Upload and URL options (hidden if logo exists) */}
          {!navbar.logo && (
            <>
              {/* Upload zone */}
              <div
                className={`nb-logo-upload ${logoDragActive ? 'nb-logo-upload--active' : ''}`}
                onClick={() => logoFileInputRef.current?.click()}
                onDrop={handleLogoDrop}
                onDragOver={handleLogoDragOver}
                onDragLeave={handleLogoDragLeave}
              >
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  style={{ display: 'none' }}
                />
                <div className="nb-logo-upload__icon"><FiUpload size={20} /></div>
                <p className="nb-logo-upload__text"><strong>Click to upload</strong> or drag & drop</p>
                <p className="nb-logo-upload__hint">PNG, JPG, SVG, WEBP</p>
              </div>

              {/* URL paste */}
              <div className="nb-logo-url">
                <div className="nb-logo-url__divider"><span>or paste image URL</span></div>
                <div className="nb-logo-url__row">
                  <FiImage size={15} className="nb-logo-url__icon" />
                  <input
                    className="dash-field__input nb-logo-url__input"
                    value={navbar.logo}
                    onChange={(e) => updateConfig('navbar.logo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </>
          )}
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
