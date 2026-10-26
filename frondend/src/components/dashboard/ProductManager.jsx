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
  const { config, updateConfig, addProduct, updateProduct, deleteProduct, saveConfig } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];
  const categories = Array.isArray(config.categories) ? config.categories : [];

  // Product modal state
  const [editing, setEditing] = useState(null); // null or product object
  const [isNew, setIsNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Category card modal state (Only Image, Title, Link to category - NO PRICES)
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const categoryCards = Array.isArray(config.shopByCategory?.categories)
    ? config.shopByCategory.categories
    : (Array.isArray(config.shopByConcern?.categories) ? config.shopByConcern.categories : []);

  // ── Product Handlers ──
  const openNew = () => {
    setEditing({ ...emptyProduct });
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

  // ── Category Card Handlers (Title, Image, Link only - NO PRICES) ──
  const openNewCategory = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      title: '',
      label: '',
      image: '',
      category: '',
      link: '/shop',
    });
    setEditingCategoryIndex(null);
    setIsNewCategory(true);
  };

  const openEditCategory = (card, index) => {
    setEditingCategory({
      id: card.id || `cat-${index}`,
      title: card.title || card.label || '',
      label: card.label || card.title || '',
      image: card.image || '',
      category: card.category || '',
      link: card.link || (card.category ? `/shop?category=${card.category}` : '/shop'),
    });
    setEditingCategoryIndex(index);
    setIsNewCategory(false);
  };

  const closeCategory = () => {
    setEditingCategory(null);
    setEditingCategoryIndex(null);
    setIsNewCategory(false);
  };

  const saveCategory = async () => {
    if (!editingCategory) return;
    const title = (editingCategory.title || editingCategory.label || '').trim();
    if (!title) return alert('Category title is required');
    if (!editingCategory.image || !editingCategory.image.trim()) return alert('Category image is required');

    const cardToSave = {
      id: editingCategory.id || `cat-${Date.now()}`,
      title: title,
      label: title,
      image: editingCategory.image.trim(),
      category: editingCategory.category || '',
      link: editingCategory.link?.trim() || (editingCategory.category ? `/shop?category=${editingCategory.category}` : '/shop'),
    };

    let updatedCards;
    if (isNewCategory || editingCategoryIndex === null || editingCategoryIndex === undefined) {
      updatedCards = [...categoryCards, cardToSave];
    } else {
      updatedCards = categoryCards.map((c, i) => (i === editingCategoryIndex ? cardToSave : c));
    }

    const updatedShopByCategory = {
      ...(config.shopByCategory || {}),
      title: config.shopByCategory?.title || 'Shop By Category',
      viewAllText: config.shopByCategory?.viewAllText || 'View All →',
      viewAllLink: config.shopByCategory?.viewAllLink || '/shop',
      categories: updatedCards,
    };

    const updatedShopByConcern = {
      ...(config.shopByConcern || {}),
      title: config.shopByConcern?.title || 'Shop By Category',
      viewAllText: config.shopByConcern?.viewAllText || 'View All →',
      viewAllLink: config.shopByConcern?.viewAllLink || '/shop',
      categories: updatedCards,
    };

    if (typeof updateConfig === 'function') {
      updateConfig('shopByCategory.categories', updatedCards);
      updateConfig('shopByConcern.categories', updatedCards);
    }
    closeCategory();

    try {
      await saveConfig({
        ...config,
        shopByCategory: updatedShopByCategory,
        shopByConcern: updatedShopByConcern,
      });
    } catch (err) {
      console.warn('Auto-save category card failed:', err);
    }
  };

  const handleDeleteCategory = async (index) => {
    if (window.confirm('Are you sure you want to delete this category card?')) {
      const updatedCards = categoryCards.filter((_, i) => i !== index);
      const updatedShopByCategory = {
        ...(config.shopByCategory || {}),
        categories: updatedCards,
      };
      const updatedShopByConcern = {
        ...(config.shopByConcern || {}),
        categories: updatedCards,
      };
      if (typeof updateConfig === 'function') {
        updateConfig('shopByCategory.categories', updatedCards);
        updateConfig('shopByConcern.categories', updatedCards);
      }
      try {
        await saveConfig({
          ...config,
          shopByCategory: updatedShopByCategory,
          shopByConcern: updatedShopByConcern,
        });
      } catch (err) {
        console.warn('Delete category card failed:', err);
      }
    }
  };

  // ── Manual Save All Changes ──
  const handleManualSave = async () => {
    setSaving(true);
    const res = await saveConfig({
      ...config,
      products,
      shopByCategory: {
        ...(config.shopByCategory || {}),
        title: config.shopByCategory?.title || 'Shop By Category',
        viewAllText: config.shopByCategory?.viewAllText || 'View All →',
        viewAllLink: config.shopByCategory?.viewAllLink || '/shop',
        categories: categoryCards,
      },
      shopByConcern: {
        ...(config.shopByConcern || {}),
        title: config.shopByConcern?.title || 'Shop By Category',
        viewAllText: config.shopByConcern?.viewAllText || 'View All →',
        viewAllLink: config.shopByConcern?.viewAllLink || '/shop',
        categories: categoryCards,
      },
    });
    setSaving(false);
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Filtered lists
  const baseFiltered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const shopByProducts = baseFiltered.filter((p) => !p.tags || (!p.tags.includes('category') && !p.tags.includes('concern')));

  const filteredCategoryCards = categoryCards.filter((card) => {
    const title = (card.title || card.label || '').toLowerCase();
    const cat = (card.category || '').toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || cat.includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || card.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Render Product Item (with Price)
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
        <button className="pm-action-btn pm-action-btn--edit" title="Edit Product" onClick={() => openEdit(p)}>
          <FiEdit2 size={14} />
        </button>
        <button className="pm-action-btn pm-action-btn--delete" title="Delete Product" onClick={() => handleDelete(p.id)}>
          <FiTrash2 size={14} />
        </button>
      </div>
    </div>
  );

  // Render Category Card Item (Title, Image, Link - STRICTLY NO PRICE)
  const renderCategoryItem = (card, index) => {
    const title = card.title || card.label || 'Untitled Category';
    const linkTarget = card.link || (card.category ? `/shop?category=${card.category}` : '/shop');
    return (
      <div key={card.id || index} className="pm-item">
        <div className="pm-item__image">
          {card.image ? (
            <img src={card.image} alt={title} />
          ) : (
            <span className="pm-item__emoji">📁</span>
          )}
        </div>
        <div className="pm-item__info">
          <h4 className="pm-item__name">{title}</h4>
          <div className="pm-item__meta">
            <span className="pm-item__category" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              {card.category || 'Category Card'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {linkTarget}
            </span>
          </div>
        </div>
        {/* Strictly NO price displayed here */}
        <div className="pm-item__actions">
          <button
            type="button"
            className="pm-action-btn pm-action-btn--edit"
            title="Edit Category Card"
            onClick={() => openEditCategory(card, index)}
          >
            <FiEdit2 size={14} />
          </button>
          <button
            type="button"
            className="pm-action-btn pm-action-btn--delete"
            title="Delete Category Card"
            onClick={() => handleDeleteCategory(index)}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="dash-panel">
        <div className="pm-header">
          <div>
            <h2 className="dash-panel__title">📦 Product Manager</h2>
            <p className="dash-panel__subtitle">
              {shopByProducts.length} products • {categoryCards.length} category cards
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="pm-filters">
          <input
            className="dash-field__input pm-search"
            placeholder="Search products or categories..."
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

        {/* ── Shop by Product Section ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '0 20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#00433D', margin: 0 }}>Shop by Product</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Standard products with prices, ratings, and variants.
            </p>
          </div>
          <button className="dash-btn dash-btn--primary" onClick={openNew}>
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

        {/* ── Shop by Category Section (NO PRICES) ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', padding: '20px 20px 0', borderTop: '1px solid #eee' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#00433D', margin: 0 }}>Shop by Category</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Category cards with image, title, and link shown on the storefront scroller.
            </p>
          </div>
          <button className="dash-btn dash-btn--primary" onClick={openNewCategory}>
            <FiPlus size={16} style={{ marginRight: '6px' }} />
            Add Category
          </button>
        </div>
        <div className="pm-list">
          {filteredCategoryCards.map(renderCategoryItem)}
          {filteredCategoryCards.length === 0 && (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: '0.9rem' }}>
              No categories added yet. Click &quot;Add Category&quot; to upload an image, title, and category link.
            </p>
          )}
        </div>

        {/* ── Save Changes Bottom Bar ── */}
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
            <span>{saving ? 'Saving...' : (saveSuccess ? 'Saved to Server!' : 'Save All Changes')}</span>
          </button>
        </div>
      </div>

      {/* ── Product Edit / Add Modal ── */}
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

              {/* Product Image Upload */}
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
                      type="button"
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

      {/* ── Category Card Modal (ONLY Title, Image Upload, Category Link - NO PRICES) ── */}
      {editingCategory && (
        <div className="pm-modal-overlay" onClick={closeCategory}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal__header">
              <h3>{isNewCategory ? 'Add Category Card' : 'Edit Category Card'}</h3>
              <button className="pm-modal__close" onClick={closeCategory}><FiX size={20} /></button>
            </div>
            <div className="pm-modal__body">
              <div className="dash-field">
                <label className="dash-field__label">Category Title *</label>
                <input
                  className="dash-field__input"
                  placeholder="e.g. Spices, Hair Care, Cold-Pressed Oils"
                  value={editingCategory.title || editingCategory.label || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingCategory((prev) => ({ ...prev, title: val, label: val }));
                  }}
                  autoFocus
                />
              </div>

              {/* Category Image Upload */}
              <div className="dash-field">
                <ProductImageUploader
                  label="Category Card Image *"
                  value={editingCategory.image || ''}
                  onChange={(val) => setEditingCategory((prev) => ({ ...prev, image: val }))}
                  maxWidth={800}
                  maxHeight={1000}
                  quality={0.85}
                  helperText="Upload an image (PNG, JPG, WEBP) or enter an image URL for this category card."
                />
              </div>

              {/* Link to Category */}
              <div className="dash-row">
                <div className="dash-field">
                  <label className="dash-field__label">Select Category</label>
                  <select
                    className="dash-field__input"
                    value={editingCategory.category || ''}
                    onChange={(e) => {
                      const catVal = e.target.value;
                      setEditingCategory((prev) => ({
                        ...prev,
                        category: catVal,
                        link: catVal ? `/shop?category=${catVal}` : prev.link || '/shop'
                      }));
                    }}
                  >
                    <option value="">Select Category...</option>
                    {categories.filter(c => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="dash-field">
                  <label className="dash-field__label">Link / URL</label>
                  <input
                    className="dash-field__input"
                    placeholder="/shop?category=spices"
                    value={editingCategory.link || ''}
                    onChange={(e) => setEditingCategory((prev) => ({ ...prev, link: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="pm-modal__footer">
              <button className="dash-btn dash-btn--ghost" onClick={closeCategory}>Cancel</button>
              <button className="dash-btn dash-btn--primary" onClick={saveCategory}>
                <FiSave size={16} style={{ marginRight: '6px' }} />
                {isNewCategory ? 'Add Category' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
