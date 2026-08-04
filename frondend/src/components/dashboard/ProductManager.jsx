import { useState, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiUpload, FiImage } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { compressImage } from '../../utils/imageOptimizer';
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
  const { config, addProduct, updateProduct, deleteProduct } = useSiteConfig();
  const { products, categories } = config;
  const [editing, setEditing] = useState(null); // null or product object
  const [isNew, setIsNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [imgDragActive, setImgDragActive] = useState(false);
  const imgFileInputRef = useRef(null);

  const handleProductImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImage(file, 600, 600, 0.75);
      setEditing((prev) => prev ? { ...prev, image: compressed } : prev);
    } catch (err) {
      console.error('Error compressing product image:', err);
    }
  };

  const handleImgFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProductImageFile(file);
    e.target.value = '';
  };

  const handleImgDrop = (e) => {
    e.preventDefault();
    setImgDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProductImageFile(file);
  };

  const handleImgDragOver = (e) => {
    e.preventDefault();
    setImgDragActive(true);
  };

  const handleImgDragLeave = () => {
    setImgDragActive(false);
  };

  const removeProductImage = () => {
    setEditing((prev) => prev ? { ...prev, image: '' } : prev);
  };

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

  const save = () => {
    if (!editing.name.trim()) return alert('Product name is required');
    if (isNew) {
      addProduct(editing);
    } else {
      updateProduct(editing.id, editing);
    }
    close();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  const toggleTag = (tag) => {
    const tags = editing.tags.includes(tag)
      ? editing.tags.filter((t) => t !== tag)
      : [...editing.tags, tag];
    setEditing({ ...editing, tags });
  };

  const addVariant = () => {
    setEditing({
      ...editing,
      variants: [...editing.variants, { color: '#8B4513', label: '' }],
    });
  };

  const updateVariant = (i, field, value) => {
    const variants = [...editing.variants];
    variants[i] = { ...variants[i], [field]: value };
    setEditing({ ...editing, variants });
  };

  const removeVariant = (i) => {
    setEditing({ ...editing, variants: editing.variants.filter((_, idx) => idx !== i) });
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
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="dash-field">
                  <label className="dash-field__label">Category</label>
                  <select
                    className="dash-field__input"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
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
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>

              {/* ── Product Image Upload ── */}
              <div className="dash-field">
                <label className="dash-field__label">Product Image</label>

                {/* Preview */}
                {editing.image && (
                  <div className="pm-img-preview">
                    <img src={editing.image} alt="Preview" className="pm-img-preview__img" />
                    <button className="pm-img-preview__remove" onClick={removeProductImage} title="Remove image">
                      <FiX size={14} /> Remove
                    </button>
                  </div>
                )}

                {/* Upload zone */}
                <div
                  className={`pm-img-upload ${imgDragActive ? 'pm-img-upload--active' : ''}`}
                  onClick={() => imgFileInputRef.current?.click()}
                  onDrop={handleImgDrop}
                  onDragOver={handleImgDragOver}
                  onDragLeave={handleImgDragLeave}
                >
                  <input
                    ref={imgFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImgFileChange}
                    style={{ display: 'none' }}
                  />
                  <div className="pm-img-upload__icon"><FiUpload size={20} /></div>
                  <p className="pm-img-upload__text"><strong>Click to upload</strong> or drag & drop</p>
                  <p className="pm-img-upload__hint">PNG, JPG, WEBP up to 5MB</p>
                </div>

                {/* URL paste */}
                <div className="pm-img-url">
                  <div className="pm-img-url__divider"><span>or paste image URL</span></div>
                  <div className="pm-img-url__row">
                    <FiImage size={15} className="pm-img-url__icon" />
                    <input
                      className="dash-field__input pm-img-url__input"
                      value={editing.image}
                      onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                      placeholder="https://example.com/product.jpg"
                    />
                  </div>
                </div>
              </div>

              <div className="dash-row">
                <div className="dash-field">
                  <label className="dash-field__label">Price (₹)</label>
                  <input
                    className="dash-field__input"
                    type="number"
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  />
                </div>
                <div className="dash-field">
                  <label className="dash-field__label">Sale Price (₹, leave 0 for none)</label>
                  <input
                    className="dash-field__input"
                    type="number"
                    value={editing.salePrice || 0}
                    onChange={(e) => setEditing({ ...editing, salePrice: Number(e.target.value) || null })}
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
                    onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
                  />
                </div>
                <div className="dash-field">
                  <label className="dash-field__label">Reviews Count</label>
                  <input
                    className="dash-field__input"
                    type="number"
                    value={editing.reviews}
                    onChange={(e) => setEditing({ ...editing, reviews: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="dash-row">
                <div className="dash-field">
                  <label className="dash-field__label">Badge Text</label>
                  <input
                    className="dash-field__input"
                    value={editing.badge || ''}
                    onChange={(e) => setEditing({ ...editing, badge: e.target.value || null })}
                    placeholder="e.g. Sale 60% OFF"
                  />
                </div>
                <div className="dash-field">
                  <label className="dash-field__label">Badge Color</label>
                  <input
                    className="dash-field__input"
                    value={editing.badgeColor || '#D32F2F'}
                    onChange={(e) => setEditing({ ...editing, badgeColor: e.target.value })}
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
                {editing.variants.map((v, i) => (
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
