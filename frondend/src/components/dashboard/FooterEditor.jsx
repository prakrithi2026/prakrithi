import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import './FooterEditor.css';

export default function FooterEditor() {
  const { config, updateConfig } = useSiteConfig();
  const { footer } = config;

  const updateColumn = (colIdx, field, value) => {
    const columns = [...footer.columns];
    columns[colIdx] = { ...columns[colIdx], [field]: value };
    updateConfig('footer.columns', columns);
  };

  const addLinkToColumn = (colIdx) => {
    const columns = [...footer.columns];
    columns[colIdx] = {
      ...columns[colIdx],
      links: [...columns[colIdx].links, { label: 'New Link', href: '#' }],
    };
    updateConfig('footer.columns', columns);
  };

  const updateLink = (colIdx, linkIdx, field, value) => {
    const columns = [...footer.columns];
    const links = [...columns[colIdx].links];
    links[linkIdx] = { ...links[linkIdx], [field]: value };
    columns[colIdx] = { ...columns[colIdx], links };
    updateConfig('footer.columns', columns);
  };

  const removeLink = (colIdx, linkIdx) => {
    const columns = [...footer.columns];
    columns[colIdx] = {
      ...columns[colIdx],
      links: columns[colIdx].links.filter((_, i) => i !== linkIdx),
    };
    updateConfig('footer.columns', columns);
  };

  const addColumn = () => {
    updateConfig('footer.columns', [
      ...footer.columns,
      { title: 'New Column', links: [{ label: 'Link', href: '#' }] },
    ]);
  };

  const removeColumn = (idx) => {
    updateConfig('footer.columns', footer.columns.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* Brand & About */}
      <div className="dash-panel">
        <h2 className="dash-panel__title">📝 Footer Content</h2>
        <p className="dash-panel__subtitle">Customize the footer text content</p>

        <div className="dash-field">
          <label className="dash-field__label">Brand Name</label>
          <input
            className="dash-field__input"
            value={footer.brandName}
            onChange={(e) => updateConfig('footer.brandName', e.target.value)}
          />
        </div>

        <div className="dash-field">
          <label className="dash-field__label">About Text</label>
          <textarea
            className="dash-field__textarea"
            value={footer.aboutText}
            onChange={(e) => updateConfig('footer.aboutText', e.target.value)}
            rows={4}
          />
        </div>

        <div className="dash-field">
          <label className="dash-field__label">Copyright Text</label>
          <input
            className="dash-field__input"
            value={footer.copyright}
            onChange={(e) => updateConfig('footer.copyright', e.target.value)}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">📞 Contact Information</h3>
        <p className="dash-panel__subtitle">Phone, email, and address details</p>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Phone / WhatsApp</label>
            <input
              className="dash-field__input"
              value={footer.contact.phone}
              onChange={(e) => updateConfig('footer.contact.phone', e.target.value)}
            />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">Email</label>
            <input
              className="dash-field__input"
              value={footer.contact.email}
              onChange={(e) => updateConfig('footer.contact.email', e.target.value)}
            />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">Order Queries Email</label>
            <input
              className="dash-field__input"
              value={footer.contact.orderEmail}
              onChange={(e) => updateConfig('footer.contact.orderEmail', e.target.value)}
            />
          </div>
        </div>

        <div className="dash-field">
          <label className="dash-field__label">Office Address</label>
          <textarea
            className="dash-field__textarea"
            value={footer.address}
            onChange={(e) => updateConfig('footer.address', e.target.value)}
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="dash-panel">
        <h3 className="dash-panel__title">🌐 Social Media Links</h3>
        <p className="dash-panel__subtitle">Add your social media URLs</p>

        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Facebook</label>
            <input
              className="dash-field__input"
              value={footer.socialLinks.facebook}
              onChange={(e) => updateConfig('footer.socialLinks.facebook', e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">Twitter / X</label>
            <input
              className="dash-field__input"
              value={footer.socialLinks.twitter}
              onChange={(e) => updateConfig('footer.socialLinks.twitter', e.target.value)}
              placeholder="https://x.com/..."
            />
          </div>
        </div>
        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-field__label">Instagram</label>
            <input
              className="dash-field__input"
              value={footer.socialLinks.instagram}
              onChange={(e) => updateConfig('footer.socialLinks.instagram', e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div className="dash-field">
            <label className="dash-field__label">YouTube</label>
            <input
              className="dash-field__input"
              value={footer.socialLinks.youtube}
              onChange={(e) => updateConfig('footer.socialLinks.youtube', e.target.value)}
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>
      </div>

      {/* Link Columns */}
      <div className="dash-panel">
        <div className="pm-header">
          <div>
            <h3 className="dash-panel__title">🔗 Footer Link Columns</h3>
            <p className="dash-panel__subtitle">Manage footer navigation columns and links</p>
          </div>
          <button className="dash-btn dash-btn--primary" onClick={addColumn}>
            <FiPlus size={16} style={{ marginRight: '6px' }} />
            Add Column
          </button>
        </div>

        {footer.columns.map((col, colIdx) => (
          <div key={colIdx} className="footer-col-editor">
            <div className="footer-col-editor__header">
              <input
                className="dash-field__input"
                value={col.title}
                onChange={(e) => updateColumn(colIdx, 'title', e.target.value)}
                style={{ fontWeight: 600, maxWidth: '250px' }}
              />
              <button className="pm-action-btn pm-action-btn--delete" onClick={() => removeColumn(colIdx)}>
                <FiTrash2 size={14} />
              </button>
            </div>

            <div className="footer-links-list">
              {col.links.map((link, linkIdx) => (
                <div key={linkIdx} className="footer-link-row">
                  <input
                    className="dash-field__input"
                    value={link.label}
                    onChange={(e) => updateLink(colIdx, linkIdx, 'label', e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    className="dash-field__input"
                    value={link.href}
                    onChange={(e) => updateLink(colIdx, linkIdx, 'href', e.target.value)}
                    placeholder="URL"
                  />
                  <button className="pm-action-btn pm-action-btn--delete" onClick={() => removeLink(colIdx, linkIdx)}>
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button className="dash-btn dash-btn--ghost" onClick={() => addLinkToColumn(colIdx)} style={{ fontSize: '0.78rem', marginTop: '8px' }}>
              <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Link
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
