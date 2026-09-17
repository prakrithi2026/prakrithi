import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import ProductImageUploader from './ProductImageUploader';
import './ProductManager.css';

const emptyProduct = {
  name: '',
  description: '',
  price: 0,
  salePrice: null,
  image: '',
  category: 'spices',
  tags: [],
  badge: null,
  badgeColor: '#D32F2F',
  rating: 4.0,
  reviews: 0,
  variants: [],
};

export default function ProductManager() {
  const { config, addProduct, updateProduct, deleteProduct, saveConfig } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];
  const categories = Array.isArray(config.categories) ? config.categories : [];
  const [editing, setEditing] = useState(null); // null or product object
  const [isNew, setIsNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const openNew = (isConcern) => {
    setEditing({ 
      ...emptyProduct,
      tags: isConcern ? ['concern'] : []
    });
    setIsNew(true);
  };

  const openEdit = (product) => {
    setEditing({ ...product });
    setIsNew(false);
  };

  const close = () => {
    setEditing(null);
    setIsNew(false);
  };

  const save = async () => {
    if (!editing || !editing.name.trim()) return alert('Product name is required');
    const productToSave = { ...editing };

    let updatedProducts;
    if (isNew) {
      const maxId = products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
      const newProd = { ...productToSave, id: maxId + 1 };
      updatedProducts = [...products, newProd];
      addProduct(newProd);
    } else {
      updatedProducts = products.map((p) => (p.id === productToSave.id ? productToSave : p));
      updateProduct(productToSave.id, productToSave);
    }
    close();

    // Directly persist to server in isolation so added product & image are never lost
    try {
      await saveConfig({ products: updatedProducts });
    } catch (err) {
      console.warn('Auto-save product failed:', err);
    }
  };

  const handleManualSave = async () => {
    setSaving(true);
    const res = await saveConfig({ products });
    setSaving(false);
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      const updatedProducts = products.filter((p) => p.id !== id);
      try {
        await saveConfig({ delete_product_id: id, products: updatedProducts });
      } catch (err) {
        console.warn('Delete save failed:', err);
      }
    }
  };

  const toggleTag = (tag) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const currentTags = prev.tags || [];
      const tags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      return { ...prev, tags };
    });
  };

  const addVariant = () => {
    setEditing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: [...(prev.variants || []), { color: '#8B4513', label: '' }],
      };
    });
  };

  const updateVariant = (i, field, value) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const variants = [...(prev.variants || [])];
      variants[i] = { ...variants[i], [field]: value };
      return { ...prev, variants };
    });
  };

  const removeVariant = (i) => {
    setEditing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: (prev.variants || []).filter((_, idx) => idx !== i),
      };
    });
  };

  const baseFiltered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const shopByProducts = baseFiltered.filter((p) => !p.tags || !p.tags.includes('concern'));
  const concernProducts = baseFiltered.filter((p) => p.tags && p.tags.includes('concern'));

  const renderProductItem = (p) => (
    <div key={p.id} className="pm-item">
      <div className="pm-item__image">
        {p.image ? (
          <img src={p.image} alt={p.name} />
        ) : (
          <span className="pm-item__emoji">
            {p.category === 'spices' ? '🌿' : p.category === 'snacks' ? '🍌' : p.category === 'honey' ? '🍯' : '🌾'}
          </span>
        )}
      </div>
      <div className="pm-item__info">
        <h4 className="pm-item__name">{p.name}</h4>
        <div className="pm-item__meta">
          <span className="pm-item__category">{p.category}</span>
          {p.badge && <span className="pm-item__badge" style={{ background: p.badgeColor }}>{p.badge}</span>}
        </div>
      </div>
      <div className="pm-item__price">
        {p.salePrice ? (
          <>
            <span className="pm-item__sale-price">₹{p.salePrice}</span>
            <span className="pm-item__orig-price">₹{p.price}</span>
          </>
        ) : (
          <span>₹{p.price}</span>
        )}
      </div>
      <div className="pm-item__actions">
        <button className="pm-action-btn pm-action-btn--edit" onClick={() => openEdit(p)}>
          <FiEdit2 size={14} />
        </button>
        <button className="pm-action-btn pm-action-btn--delete" onClick={() => handleDelete(p.id)}>
          <FiTrash2 size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="dash-panel">
        <div className="pm-header">
          <div>
            <h2 className="dash-panel__title">📦 Product Manager</h2>
            <p className="dash-panel__subtitle">{products.length} products total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="pm-filters">
          <input
            className="dash-field__input pm-search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="dash-field__input pm-cat-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Shop by Product Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '0 20px' }}>
           <h3 style={{ fontSize: '1.1rem', color: '#012B28' }}>Shop by Product</h3>
           <button className="dash-btn dash-btn--primary" onClick={() => openNew(false)}>
             <FiPlus size={16} style={{ marginRight: '6px' }} />
             Add Product
           </button>
        </div>
        <div className="pm-list">
          {shopByProducts.map(renderProductItem)}
          {shopByProducts.length === 0 && (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0' }}>No products found.</p>
          )}
        </div>

        {/* Shop By Concern Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', padding: '20px 20px 0', borderTop: '1px solid #eee' }}>
           <h3 style={{ fontSize: '1.1rem', color: '#012B28' }}>Shop By Concern</h3>
           <button className="dash-btn dash-btn--primary" onClick={() => openNew(true)}>
             <FiPlus size={16} style={{ marginRight: '6px' }} />
             Add Concern Product
           </button>
        </div>
        <div className="pm-list">
          {concernProducts.map(renderProductItem)}
          {concernProducts.length === 0 && (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0' }}>No products found.</p>
          )}
        </div>

        {/* ── Save Product Changes Bottom Bar ── */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px 20px 10px', borderTop: '1px solid #eee' }}>
          <button
            type="button"
            className={`dash-btn dash-btn--primary ${saveSuccess ? 'dash-btn--success' : ''}`}
            onClick={handleManualSave}
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
            <span>{saving ? 'Saving...' : (saveSuccess ? 'Saved to Server!' : 'Save Product Changes')}</span>
          </button>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {editing && (
        <div className="pm-modal-overlay" onClick={close}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h3>{isNew ? 'Add New Product' : 'Edit Product'}</h3>
              <button className="pm-modal__close" onClick={close}><FiX size={20} /></button>
            </div>
            <div className="pm-modal__body">
              <div className="dash-row">
                <div className="dash-field">
                  <label className="dash-field__label">Product Name *</label>
                  <input
                    className="dash-field__input"
                    value={editing.name}
                    onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="dash-field">
                  <label className="dash-field__label">Category</label>
                  <select
                    className="dash-field__input"
                    value={editing.category}
                    onChange={(e) => setEditing((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.filter(c => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dash-field">
                <label className="dash-field__label">Description</label>
                <textarea
                  className="dash-field__textarea"
                  value={editing.description}
                  onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* ── Product Image Upload ── */}
              <div className="dash-field">
                <ProductImageUploader
                  label="Product Image"
                  value={editing.image}
                  onChange={(val) => setEditing((prev) => ({ ...prev, image: val }))}
                  maxWidth={800}
                  maxHeight={800}
                  quality={0.85}
                  helperText="Upload a product image (PNG, JPG, WEBP) or enter an image URL."
                />
              </div>

              <div className="dash-row">
                <div className="dash-field">
                  <label className="dash-field__label">Price (₹)</label>
                  <input
                    className="dash-field__input"
                    type="number"
                    value={editing.price}
                    onChange={(e) => setEditing((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  />
                </div>
                <div className="dash-field">
                  <label className="dash-field__label">Sale Price (₹, leave 0 for none)</label>
                  <input
                    className="dash-field__input"
                    type="number"
                    value={editing.salePrice || 0}
                    onChange={(e) => setEditing((prev) => ({ ...prev, salePrice: Number(e.target.value) || null }))}
                  />
                </div>
              </div>

              <div className="dash-row">
                <div className="dash-field">
                  <label className="dash-field__label">Rating</label>
                  <input
                    className="dash-field__input"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={editing.rating}
                    onChange={(e) => setEditing((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                  />
                </div>
                <div className="dash-field">
                  <label className="dash-field__label">Reviews Count</label>
                  <input
                    className="dash-field__input"
                    type="number"
                    value={editing.reviews}
                    onChange={(e) => setEditing((prev) => ({ ...prev, reviews: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="dash-row">
                <div className="dash-field">
                  <label className="dash-field__label">Badge Text</label>
                  <input
                    className="dash-field__input"
                    value={editing.badge || ''}
                    onChange={(e) => setEditing((prev) => ({ ...prev, badge: e.target.value || null }))}
                    placeholder="e.g. Sale 60% OFF"
                  />
                </div>
                <div className="dash-field">
                  <label className="dash-field__label">Badge Color</label>
                  <input
                    className="dash-field__input"
                    value={editing.badgeColor || '#D32F2F'}
                    onChange={(e) => setEditing((prev) => ({ ...prev, badgeColor: e.target.value }))}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="dash-field">
                <label className="dash-field__label">Tags</label>
                <div className="pm-tags">
                  {['on-sale', 'new-arrival', 'best-seller'].map((tag) => (
                    <button
                      key={tag}
                      className={`pm-tag ${editing.tags.includes(tag) ? 'pm-tag--active' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div className="dash-field">
                <label className="dash-field__label">Variants</label>
                {(editing.variants || []).map((v, i) => (
                  <div key={i} className="pm-variant-row">
                    <input type="color" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} />
                    <input
                      className="dash-field__input"
                      value={v.label}
                      onChange={(e) => updateVariant(i, 'label', e.target.value)}
                      placeholder="e.g. 100g"
                    />
                    <button className="pm-action-btn pm-action-btn--delete" onClick={() => removeVariant(i)}>
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
                <button className="dash-btn dash-btn--ghost" onClick={addVariant} style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                  <FiPlus size={14} style={{ marginRight: '4px' }} /> Add Variant
                </button>
              </div>
            </div>
            <div className="pm-modal__footer">
              <button className="dash-btn dash-btn--ghost" onClick={close}>Cancel</button>
              <button className="dash-btn dash-btn--primary" onClick={save}>
                <FiSave size={16} style={{ marginRight: '6px' }} />
                {isNew ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
