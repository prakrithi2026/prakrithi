import { useState, useEffect, useCallback } from 'react';
import {
  FiTag, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiCopy,
  FiSearch, FiRefreshCw, FiPercent, FiUsers, FiShoppingBag,
  FiAlertCircle, FiCheckCircle, FiInfo
} from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import API_BASE_URL from '../../utils/api';
import './OfferManager.css';

const emptyOffer = {
  code: '',
  title: '',
  description: '',
  discount_percentage: 10,
  scope: 'all', // 'all' | 'specific'
  products: [], // array of product IDs
  is_active: true,
};

export default function OfferManager() {
  const { config } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modal states
  const [editingOffer, setEditingOffer] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [modalProductSearch, setModalProductSearch] = useState('');

  // Redemptions detail modal
  const [viewingUsagesOffer, setViewingUsagesOffer] = useState(null);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/offers/`);
      if (!res.ok) throw new Error('Failed to fetch offer codes');
      const data = await res.json();
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Unable to load offer codes. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleOpenNew = () => {
    setEditingOffer({ ...emptyOffer });
    setIsNew(true);
    setFormError('');
    setModalProductSearch('');
  };

  const handleOpenEdit = (offer) => {
    const targetProductIds = (offer.product_ids && offer.product_ids.length > 0)
      ? offer.product_ids
      : (offer.product ? [offer.product] : []);

    setEditingOffer({
      id: offer.id,
      code: offer.code,
      title: offer.title || '',
      discount_percentage: offer.discount_percentage,
      scope: targetProductIds.length > 0 ? 'specific' : 'all',
      products: targetProductIds,
      is_active: offer.is_active,
    });
    setIsNew(false);
    setFormError('');
    setModalProductSearch('');
  };

  const handleCloseModal = () => {
    setEditingOffer(null);
    setFormError('');
    setModalProductSearch('');
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!editingOffer.code.trim()) {
      setFormError('Please enter an offer code.');
      return;
    }
    const pct = parseInt(editingOffer.discount_percentage, 10);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      setFormError('Discount percentage must be between 1% and 100%.');
      return;
    }

    const targetProducts = editingOffer.scope === 'specific'
      ? editingOffer.products.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      : [];

    if (editingOffer.scope === 'specific' && targetProducts.length === 0) {
      setFormError('Please select at least one product, or switch to "All Products (Store-wide)".');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      code: editingOffer.code.trim().toUpperCase(),
      title: editingOffer.title.trim(),
      description: '',
      discount_percentage: pct,
      products: targetProducts,
      product: targetProducts.length === 1 ? targetProducts[0] : null,
      min_order_amount: '0.00',
      is_active: editingOffer.is_active !== undefined ? editingOffer.is_active : true,
    };

    try {
      const url = isNew
        ? `${API_BASE_URL}/offers/`
        : `${API_BASE_URL}/offers/${editingOffer.id}/`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        const msg = resData.code || resData.detail || resData.discount_percentage || 'Failed to save offer code.';
        throw new Error(Array.isArray(msg) ? msg[0] : msg);
      }

      handleCloseModal();
      fetchOffers();
    } catch (err) {
      setFormError(err.message || 'Error saving offer.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      const res = await fetch(`${API_BASE_URL}/offers/${offer.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !offer.is_active }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: !o.is_active } : o));
    } catch (err) {
      alert('Could not update offer status: ' + err.message);
    }
  };

  const handleDeleteOffer = async (offer) => {
    if (!window.confirm(`Are you sure you want to delete offer code "${offer.code}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/offers/${offer.id}/`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete offer');
      setOffers(prev => prev.filter(o => o.id !== offer.id));
    } catch (err) {
      alert('Could not delete offer: ' + err.message);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered list
  const filteredOffers = offers.filter(offer => {
    const matchesSearch =
      offer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.title && offer.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (offer.product_name && offer.product_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return offer.is_active;
    if (statusFilter === 'inactive') return !offer.is_active;
    return true;
  });

  // Calculate high-level stats
  const totalCodes = offers.length;
  const activeCodes = offers.filter(o => o.is_active).length;
  const totalUsages = offers.reduce((sum, o) => sum + (o.usages_count || 0), 0);

  return (
    <div className="offer-manager">
      {/* Top Header */}
      <div className="om-header">
        <div>
          <h2 className="om-title">Offer Cards &amp; Promo Codes</h2>
          <p className="om-subtitle">
            Create discount codes that reduce product prices at checkout. Each code is strictly one-time use per customer.
          </p>
        </div>
        <button className="om-btn om-btn--primary" onClick={handleOpenNew}>
          <FiPlus size={16} /> Create Offer Code
        </button>
      </div>

      {/* Stats row */}
      <div className="om-stats-grid">
        <div className="om-stat-card">
          <div className="om-stat-icon om-stat-icon--tag"><FiTag size={20} /></div>
          <div>
            <div className="om-stat-val">{totalCodes}</div>
            <div className="om-stat-lbl">Total Offer Codes</div>
          </div>
        </div>
        <div className="om-stat-card">
          <div className="om-stat-icon om-stat-icon--active"><FiCheckCircle size={20} /></div>
          <div>
            <div className="om-stat-val">{activeCodes}</div>
            <div className="om-stat-lbl">Active Codes</div>
          </div>
        </div>
        <div className="om-stat-card">
          <div className="om-stat-icon om-stat-icon--users"><FiUsers size={20} /></div>
          <div>
            <div className="om-stat-val">{totalUsages}</div>
            <div className="om-stat-lbl">Customer Redemptions</div>
          </div>
        </div>
        <div className="om-stat-card om-stat-card--highlight">
          <div className="om-stat-icon om-stat-icon--info"><FiInfo size={20} /></div>
          <div className="om-stat-rule">
            <strong>Single-Use Policy</strong>
            <span>Users can use each code once. If you add multiple codes, users can redeem each code once.</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="om-controls-row">
        <div className="om-search-wrap">
          <FiSearch className="om-search-icon" size={16} />
          <input
            type="text"
            className="om-search-input"
            placeholder="Search by code, title or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="om-clear-search" onClick={() => setSearchQuery('')}>&times;</button>
          )}
        </div>

        <div className="om-filter-group">
          <select
            className="om-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses ({offers.length})</option>
            <option value="active">Active Only ({activeCodes})</option>
            <option value="inactive">Inactive Only ({offers.length - activeCodes})</option>
          </select>

          <button className="om-btn om-btn--outline" onClick={fetchOffers} title="Refresh list">
            <FiRefreshCw size={14} className={loading ? 'om-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Offer Cards Container */}
      {loading && offers.length === 0 ? (
        <div className="om-empty-state">
          <div className="om-empty-icon"><FiRefreshCw size={36} className="om-spin" /></div>
          <p>Loading offer codes...</p>
        </div>
      ) : error ? (
        <div className="om-empty-state om-empty-state--error">
          <div className="om-empty-icon"><FiAlertCircle size={36} /></div>
          <p>{error}</p>
          <button className="om-btn om-btn--outline" onClick={fetchOffers}>Try Again</button>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="om-empty-state">
          <div className="om-empty-icon">🎟️</div>
          <h3>No Offer Codes Found</h3>
          <p>{searchQuery ? 'No offers match your search criteria.' : 'Create your first offer code to give discounts to your customers.'}</p>
          {!searchQuery && (
            <button className="om-btn om-btn--primary" onClick={handleOpenNew}>
              <FiPlus size={16} /> Create Offer Code
            </button>
          )}
        </div>
      ) : (
        <div className="om-cards-grid">
          {filteredOffers.map((offer) => {
            const targetProductIds = (offer.product_ids && offer.product_ids.length > 0)
              ? offer.product_ids
              : (offer.product ? [offer.product] : []);

            const targetNames = targetProductIds.map(id => {
              const found = products.find(p => String(p.id) === String(id));
              return found?.name || `Product #${id}`;
            });

            return (
              <div key={offer.id} className={`om-card ${!offer.is_active ? 'om-card--inactive' : ''}`}>
                {/* Visual Coupon Header */}
                <div className="om-card-header">
                  <div className="om-card-discount">
                    <span className="om-discount-num">{offer.discount_percentage}%</span>
                    <span className="om-discount-label">OFF</span>
                  </div>
                  <div className="om-card-status">
                    <label className="om-switch" title={offer.is_active ? 'Click to deactivate' : 'Click to activate'}>
                      <input
                        type="checkbox"
                        checked={offer.is_active}
                        onChange={() => handleToggleActive(offer)}
                      />
                      <span className="om-slider" />
                    </label>
                    <span className={`om-status-tag ${offer.is_active ? 'om-status-tag--active' : 'om-status-tag--inactive'}`}>
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Pill */}
                <div className="om-card-code-row">
                  <div className="om-code-badge" onClick={() => handleCopyCode(offer.code)}>
                    <FiTag size={14} className="om-code-icon" />
                    <span className="om-code-text">{offer.code}</span>
                    <button
                      type="button"
                      className="om-copy-btn"
                      title="Copy code to clipboard"
                    >
                      {copiedCode === offer.code ? <FiCheck size={14} color="#16a34a" /> : <FiCopy size={14} />}
                    </button>
                  </div>
                  {copiedCode === offer.code && (
                    <span className="om-copied-hint">Copied!</span>
                  )}
                </div>

                {/* Offer Details */}
                <div className="om-card-body">
                  {offer.title && <h4 className="om-card-title">{offer.title}</h4>}

                  <div className="om-card-meta">
                    <div className="om-meta-item">
                      <FiShoppingBag size={14} />
                      <span>
                        {targetNames.length === 1 ? (
                          <>Applies to: <strong>{targetNames[0]}</strong></>
                        ) : targetNames.length > 1 ? (
                          <>
                            Applies to ({targetNames.length} products):{' '}
                            <strong>{targetNames.slice(0, 2).join(', ')}{targetNames.length > 2 ? ` +${targetNames.length - 2} more` : ''}</strong>
                          </>
                        ) : (
                          <strong>Store-wide (All Products)</strong>
                        )}
                      </span>
                    </div>

                    <div className="om-meta-item om-meta-item--usages" onClick={() => setViewingUsagesOffer(offer)}>
                      <FiUsers size={14} />
                      <span className="om-usage-link">
                        Used by <strong>{offer.usages_count || 0}</strong> customer{(offer.usages_count !== 1) ? 's' : ''} (1x per user)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="om-card-footer">
                  <button
                    className="om-action-btn om-action-btn--edit"
                    onClick={() => handleOpenEdit(offer)}
                    title="Edit offer"
                  >
                    <FiEdit2 size={15} /> Edit
                  </button>
                  <button
                    className="om-action-btn om-action-btn--delete"
                    onClick={() => handleDeleteOffer(offer)}
                    title="Delete offer"
                  >
                    <FiTrash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Offer */}
      {editingOffer && (
        <div className="om-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="om-modal">
            <div className="om-modal-header">
              <h3>{isNew ? 'Create New Offer Code' : `Edit Offer: ${editingOffer.code}`}</h3>
              <button className="om-modal-close" onClick={handleCloseModal}>&times;</button>
            </div>

            <form onSubmit={handleSaveOffer}>
              <div className="om-modal-body">
                {formError && (
                  <div className="om-form-error">
                    <FiAlertCircle size={16} /> {formError}
                  </div>
                )}

                {/* Offer Code & Discount % */}
                <div className="om-form-row">
                  <div className="om-form-group">
                    <label className="om-label">Offer Code <span className="om-req">*</span></label>
                    <input
                      type="text"
                      className="om-input om-input--code"
                      placeholder="e.g. SAVE20, WELCOME50"
                      value={editingOffer.code}
                      onChange={(e) => setEditingOffer({ ...editingOffer, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                      required
                    />
                    <span className="om-hint">Code customers type at order time (auto-uppercased).</span>
                  </div>

                  <div className="om-form-group">
                    <label className="om-label">Discount % <span className="om-req">*</span></label>
                    <div className="om-pct-wrap">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="om-input"
                        placeholder="20"
                        value={editingOffer.discount_percentage}
                        onChange={(e) => setEditingOffer({ ...editingOffer, discount_percentage: e.target.value })}
                        required
                      />
                      <span className="om-pct-symbol">%</span>
                    </div>
                    {/* Quick percentage presets */}
                    <div className="om-preset-chips">
                      {[10, 15, 20, 25, 50].map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`om-preset-chip ${parseInt(editingOffer.discount_percentage, 10) === p ? 'active' : ''}`}
                          onClick={() => setEditingOffer({ ...editingOffer, discount_percentage: p })}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Applicable Products (Scope) */}
                <div className="om-form-group">
                  <label className="om-label">Applicable Products (Scope)</label>
                  <div className="om-scope-selector">
                    <button
                      type="button"
                      className={`om-scope-btn ${editingOffer.scope === 'all' ? 'active' : ''}`}
                      onClick={() => setEditingOffer({ ...editingOffer, scope: 'all' })}
                    >
                      <span className="om-scope-title">🌟 All Products</span>
                      <span className="om-scope-sub">Store-wide discount at order time</span>
                    </button>
                    <button
                      type="button"
                      className={`om-scope-btn ${editingOffer.scope === 'specific' ? 'active' : ''}`}
                      onClick={() => setEditingOffer({ ...editingOffer, scope: 'specific' })}
                    >
                      <span className="om-scope-title">📦 Specific Products</span>
                      <span className="om-scope-sub">
                        {editingOffer.products.length > 0
                          ? `${editingOffer.products.length} product${editingOffer.products.length > 1 ? 's' : ''} selected`
                          : 'Select one or more products'}
                      </span>
                    </button>
                  </div>

                  {editingOffer.scope === 'specific' && (
                    <div className="om-multi-product-box">
                      <div className="om-mp-header">
                        <div className="om-mp-search-wrap">
                          <FiSearch size={14} className="om-mp-search-icon" />
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={modalProductSearch}
                            onChange={(e) => setModalProductSearch(e.target.value)}
                            className="om-mp-search-input"
                          />
                          {modalProductSearch && (
                            <button
                              type="button"
                              className="om-mp-clear-btn"
                              onClick={() => setModalProductSearch('')}
                            >
                              &times;
                            </button>
                          )}
                        </div>
                        <div className="om-mp-quick-actions">
                          <button
                            type="button"
                            className="om-mp-link-btn"
                            onClick={() => {
                              const allIds = products.map(p => p.id);
                              setEditingOffer({ ...editingOffer, products: allIds });
                            }}
                          >
                            Select All ({products.length})
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            className="om-mp-link-btn"
                            onClick={() => setEditingOffer({ ...editingOffer, products: [] })}
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="om-mp-list">
                        {products
                          .filter(p => !modalProductSearch || p.name.toLowerCase().includes(modalProductSearch.toLowerCase()))
                          .map((p) => {
                            const isSelected = editingOffer.products.some(id => String(id) === String(p.id));
                            return (
                              <div
                                key={p.id}
                                className={`om-mp-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  const current = editingOffer.products.map(String);
                                  const pIdStr = String(p.id);
                                  const newProducts = isSelected
                                    ? current.filter(id => id !== pIdStr)
                                    : [...current, p.id];
                                  setEditingOffer({ ...editingOffer, products: newProducts });
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="om-mp-checkbox"
                                />
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="om-mp-thumb" />
                                ) : (
                                  <div className="om-mp-thumb-placeholder">🌿</div>
                                )}
                                <div className="om-mp-info">
                                  <span className="om-mp-name">{p.name}</span>
                                  <span className="om-mp-price">₹{parseFloat(p.salePrice || p.price).toFixed(2)}</span>
                                </div>
                                {isSelected && <span className="om-mp-badge">✓ Selected</span>}
                              </div>
                            );
                          })}
                      </div>

                      <div className="om-mp-footer">
                        <span>
                          <strong>{editingOffer.products.length}</strong> product{editingOffer.products.length !== 1 ? 's' : ''} selected.
                        </span>
                        <span className="om-mp-footer-hint">
                          The discount will only reduce the cost of these selected items when ordered.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Offer Title */}
                <div className="om-form-group">
                  <label className="om-label">Offer Title / Badge Text</label>
                  <input
                    type="text"
                    className="om-input"
                    placeholder="e.g. Special 20% Off Natural Spices"
                    value={editingOffer.title}
                    onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                  />
                </div>

                {/* Explanatory note */}
                <div className="om-rule-notice">
                  <FiInfo size={16} />
                  <span>
                    <strong>Automatic 1-Use Enforcement:</strong> Customers can only use this code once. If you add additional codes, customers can use each code once per user account/email.
                  </span>
                </div>
              </div>

              <div className="om-modal-footer">
                <button type="button" className="om-btn om-btn--outline" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="om-btn om-btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : isNew ? 'Create Offer Code' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Redemptions (Usages) */}
      {viewingUsagesOffer && (
        <div className="om-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingUsagesOffer(null); }}>
          <div className="om-modal om-modal--large">
            <div className="om-modal-header">
              <div>
                <h3>Redemptions for "{viewingUsagesOffer.code}"</h3>
                <span className="om-modal-sub">
                  {viewingUsagesOffer.discount_percentage}% discount • Total redemptions: {viewingUsagesOffer.usages?.length || 0}
                </span>
              </div>
              <button className="om-modal-close" onClick={() => setViewingUsagesOffer(null)}>&times;</button>
            </div>

            <div className="om-modal-body">
              {!viewingUsagesOffer.usages || viewingUsagesOffer.usages.length === 0 ? (
                <div className="om-empty-state om-empty-state--compact">
                  <div className="om-empty-icon">👥</div>
                  <p>No customers have redeemed this code yet.</p>
                  <span>Once a customer uses this code at checkout, their email and saved amount will appear here.</span>
                </div>
              ) : (
                <div className="om-usages-table-wrap">
                  <table className="om-usages-table">
                    <thead>
                      <tr>
                        <th>Customer Email</th>
                        <th>Order #</th>
                        <th>Discount Saved</th>
                        <th>Redeemed Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingUsagesOffer.usages.map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.user_email}</strong></td>
                          <td>Order #{u.order || 'N/A'}</td>
                          <td className="om-saved-amount">₹{parseFloat(u.discount_amount || 0).toFixed(2)}</td>
                          <td>{new Date(u.used_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="om-modal-footer">
              <button className="om-btn om-btn--outline" onClick={() => setViewingUsagesOffer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
