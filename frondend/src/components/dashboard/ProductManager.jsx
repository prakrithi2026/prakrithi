import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiRefreshCw, FiCheck, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import ProductImageUploader from './ProductImageUploader';
import MultiProductImageUploader from './MultiProductImageUploader';
import { sortVariantsByWeight } from '../../utils/weightSort';
import './ProductManager.css';

const PRESET_WEIGHTS = ['50gm', '100gm', '200gm', '250gm', '500gm', '1kg', '100ml', '250ml', '500ml', '1L', 'Pack of 2'];
const ATTRIBUTE_PRESETS = ['WEIGHT', 'QUANTITY', 'PACK', 'SIZE', 'VOLUME'];

const emptyProduct = {
  name: '',
  description: '',
  price: 0,
  salePrice: null,
  image: '',
  images: [],
  category: 'spices',
  tags: [],
  badge: null,
  badgeColor: '#D32F2F',
  rating: 4.0,
  reviews: 0,
  variantAttribute: 'WEIGHT',
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

  // Variations helper state
  const [customVariant, setCustomVariant] = useState({ label: '', price: '', salePrice: '' });
  const [previewSelectedVariant, setPreviewSelectedVariant] = useState(null);

  // Category card modal state (Only Image, Title, Link to category - NO PRICES)
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const categoryCards = Array.isArray(config.shopByCategory?.categories)
    ? config.shopByCategory.categories
    : (Array.isArray(config.shopByConcern?.categories) ? config.shopByConcern.categories : []);

  const normalizeVariantList = (rawList, basePrice, baseSalePrice) => {
    if (!Array.isArray(rawList)) return [];
    let foundDefault = false;
    const result = rawList.map((v, idx) => {
      if (typeof v === 'string') {
        const clean = v.trim();
        if (!clean) return null;
        const isDef = !foundDefault && idx === 0;
        if (isDef) foundDefault = true;
        return {
          id: `var-${idx}-${clean}`,
          label: clean,
          weight: clean,
          price: basePrice || '',
          salePrice: baseSalePrice || '',
          isDefault: isDef,
        };
      }
      if (typeof v === 'object' && v !== null) {
        const label = (v.label || v.weight || v.name || '').trim();
        if (!label) return null;
        const isDef = Boolean(v.isDefault);
        if (isDef) foundDefault = true;
        return {
          id: v.id || `var-${idx}-${label}`,
          label,
          weight: label,
          price: v.price !== undefined && v.price !== null ? v.price : '',
          salePrice: v.salePrice !== undefined && v.salePrice !== null ? v.salePrice : '',
          isDefault: isDef,
        };
      }
      return null;
    }).filter(Boolean);

    if (result.length > 0 && !foundDefault) {
      result[0].isDefault = true;
    }
    return sortVariantsByWeight(result);
  };

  // ── Product Handlers ──
  const openNew = () => {
    setEditing({ ...emptyProduct, images: [] });
    setCustomVariant({ label: '', price: '', salePrice: '' });
    setPreviewSelectedVariant(null);
    setIsNew(true);
  };

  const openEdit = (product) => {
    const rawImages = Array.isArray(product.images) && product.images.length > 0 
      ? product.images 
      : (product.image ? [product.image] : []);
    const normalizedVars = normalizeVariantList(product.variants, product.price, product.salePrice);
    setEditing({
      ...product,
      variantAttribute: product.variantAttribute || 'WEIGHT',
      variants: normalizedVars,
      images: rawImages,
      image: rawImages[0] || ''
    });
    setCustomVariant({ label: '', price: '', salePrice: '' });
    setPreviewSelectedVariant(normalizedVars.find(v => v.isDefault) || normalizedVars[0] || null);
    setIsNew(false);
  };

  const close = () => {
    setEditing(null);
    setPreviewSelectedVariant(null);
    setIsNew(false);
  };

  const save = async () => {
    if (!editing || !editing.name.trim()) return alert('Product name is required');
    const images = Array.isArray(editing.images) ? editing.images.filter(Boolean) : [];
    const primaryImage = images.length > 0 ? images[0] : '';

    // Clean and validate variants
    const cleanVariants = (editing.variants || []).map((v, idx) => {
      const label = (v.label || v.weight || '').trim();
      if (!label) return null;
      const p = v.price !== '' && v.price !== null && v.price !== undefined ? parseFloat(v.price) : null;
      const sp = v.salePrice !== '' && v.salePrice !== null && v.salePrice !== undefined ? parseFloat(v.salePrice) : null;
      return {
        id: `var-${idx}-${label}`,
        label,
        weight: label,
        price: p !== null && !isNaN(p) ? p : null,
        salePrice: sp !== null && !isNaN(sp) ? sp : null,
        attribute: (editing.variantAttribute || 'WEIGHT').trim().toUpperCase(),
        isDefault: Boolean(v.isDefault),
      };
    }).filter(Boolean);

    const productToSave = {
      ...editing,
      variantAttribute: (editing.variantAttribute || 'WEIGHT').trim().toUpperCase(),
      variants: cleanVariants,
      image: primaryImage,
      images: images,
    };

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

  // Toggle preset variant: if already selected, UNSELECT (remove) it; if not, add it & sort orderly by weight
  const toggleVariantPreset = (presetLabel) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const current = prev.variants || [];
      const cleanLabel = presetLabel.trim();
      const existingIndex = current.findIndex(
        (v) => (v.label || v.weight || '').trim().toLowerCase() === cleanLabel.toLowerCase()
      );

      let nextVariants;
      if (existingIndex >= 0) {
        // UNSELECT / REMOVE
        nextVariants = current.filter((_, idx) => idx !== existingIndex);
      } else {
        // ADD
        const newVar = {
          id: `var-${Date.now()}-${cleanLabel}`,
          label: cleanLabel,
          weight: cleanLabel,
          price: prev.price || '',
          salePrice: prev.salePrice || '',
          isDefault: current.length === 0,
        };
        nextVariants = [...current, newVar];
      }

      // Automatically sort orderly by weight (e.g. 50g, 200g, 300g)
      const sorted = sortVariantsByWeight(nextVariants);
      return {
        ...prev,
        variants: sorted,
      };
    });
  };

  const addCustomVariant = () => {
    const label = (customVariant.label || '').trim();
    if (!label) return;
    setEditing((prev) => {
      if (!prev) return prev;
      const current = prev.variants || [];
      const newVar = {
        id: `var-${Date.now()}-${label}`,
        label,
        weight: label,
        price: customVariant.price !== '' ? customVariant.price : (prev.price || ''),
        salePrice: customVariant.salePrice !== '' ? customVariant.salePrice : '',
        isDefault: current.length === 0,
      };
      // Automatically sort orderly by weight
      const sorted = sortVariantsByWeight([...current, newVar]);
      return {
        ...prev,
        variants: sorted,
      };
    });
    setCustomVariant({ label: '', price: '', salePrice: '' });
  };

  const sortEditingVariants = () => {
    setEditing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: sortVariantsByWeight(prev.variants || []),
      };
    });
  };

  const updateVariant = (i, field, value) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const variants = [...(prev.variants || [])];
      variants[i] = { ...variants[i], [field]: value };
      if (field === 'label') variants[i].weight = value;
      return { ...prev, variants };
    });
  };

  const setDefaultVariant = (index) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const variants = (prev.variants || []).map((v, i) => ({
        ...v,
        isDefault: i === index,
      }));
      return { ...prev, variants };
    });
    setPreviewSelectedVariant(editing?.variants?.[index] || null);
  };

  const moveVariant = (index, direction) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const variants = [...(prev.variants || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= variants.length) return prev;
      const temp = variants[index];
      variants[index] = variants[targetIndex];
      variants[targetIndex] = temp;
      return { ...prev, variants };
    });
  };

  const removeVariant = (i) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const filtered = (prev.variants || []).filter((_, idx) => idx !== i);
      if (filtered.length > 0 && !filtered.some(v => v.isDefault)) {
        filtered[0].isDefault = true;
      }
      return { ...prev, variants: filtered };
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
      viewAllLink: config.shopByCategory?.viewAllLink || '/categories',
      categories: updatedCards,
    };

    const updatedShopByConcern = {
      ...(config.shopByConcern || {}),
      title: config.shopByConcern?.title || 'Shop By Category',
      viewAllText: config.shopByConcern?.viewAllText || 'View All →',
      viewAllLink: config.shopByConcern?.viewAllLink || '/categories',
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
        viewAllLink: config.shopByCategory?.viewAllLink || '/categories',
        categories: categoryCards,
      },
      shopByConcern: {
        ...(config.shopByConcern || {}),
        title: config.shopByConcern?.title || 'Shop By Category',
        viewAllText: config.shopByConcern?.viewAllText || 'View All →',
        viewAllLink: config.shopByConcern?.viewAllLink || '/categories',
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
        {(Array.isArray(p.images) && p.images.length > 0) ? (
          <img src={p.images[0]} alt={p.name} />
        ) : p.image ? (
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
          {Array.isArray(p.variants) && p.variants.length > 0 && (
            <span className="pm-item__variant-badge" title="Quantity / Weight variations configured">
              ⚖️ {p.variants.length} options ({p.variants.map(v => typeof v === 'object' ? (v.label || v.weight) : v).filter(Boolean).slice(0, 3).join(', ')}{p.variants.length > 3 ? '...' : ''})
            </span>
          )}
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
            <h3 style={{ fontSize: '1.1rem', color: '#004E38', margin: 0 }}>Shop by Product</h3>
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
            <h3 style={{ fontSize: '1.1rem', color: '#004E38', margin: 0 }}>Shop by Category</h3>
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

              {/* Product Multi-Image Upload */}
              <div className="dash-field">
                <MultiProductImageUploader
                  label="Product Images *"
                  images={editing.images || (editing.image ? [editing.image] : [])}
                  onChange={(newImages) => {
                    const primary = newImages.length > 0 ? newImages[0] : '';
                    setEditing((prev) => ({
                      ...prev,
                      images: newImages,
                      image: primary,
                    }));
                  }}
                  maxWidth={800}
                  maxHeight={800}
                  quality={0.85}
                  helperText="Upload multiple product photos (PNG, JPG, WEBP). First photo is the cover photo shown on product cards. Drag, reorder, or click 'Set as Cover'."
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

              {/* ── Product Quantity / Weight Variations Manager ── */}
              <div className="pm-variants-panel">
                <div className="pm-variants-panel__header">
                  <div>
                    <h4 className="pm-variants-panel__title">⚖️ Quantity / Weight Variations</h4>
                    <p className="pm-variants-panel__sub">
                      Configure weight or quantity options (e.g. 250gm, 50gm, 100gm, 500gm) and their custom prices. Controlled directly from here!
                    </p>
                  </div>
                </div>

                {/* Attribute Name Selector */}
                <div className="dash-field" style={{ marginBottom: '14px' }}>
                  <label className="dash-field__label">Variation Attribute Heading</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      className="dash-field__input"
                      style={{ maxWidth: '170px' }}
                      value={editing.variantAttribute || 'WEIGHT'}
                      onChange={(e) => setEditing(prev => ({ ...prev, variantAttribute: e.target.value.toUpperCase() }))}
                      placeholder="e.g. WEIGHT"
                    />
                    <div className="pm-attribute-pills">
                      {ATTRIBUTE_PRESETS.map((attr) => (
                        <button
                          key={attr}
                          type="button"
                          className={`pm-attr-pill ${(editing.variantAttribute || 'WEIGHT') === attr ? 'active' : ''}`}
                          onClick={() => setEditing(prev => ({ ...prev, variantAttribute: attr }))}
                        >
                          {attr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="dash-field" style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="dash-field__label" style={{ margin: 0 }}>Quick Add / Toggle Weights (Click to Select or Unselect)</label>
                    <span style={{ fontSize: '0.75rem', color: '#004E38', fontWeight: 600 }}>Auto-ordered by weight</span>
                  </div>
                  <div className="pm-preset-weights">
                    {PRESET_WEIGHTS.map((preset) => {
                      const alreadyHas = (editing.variants || []).some(v => (v.label || v.weight || '').toLowerCase() === preset.toLowerCase());
                      return (
                        <button
                          key={preset}
                          type="button"
                          className={`pm-preset-btn ${alreadyHas ? 'added' : ''}`}
                          onClick={() => toggleVariantPreset(preset)}
                          title={alreadyHas ? `Click to unselect / remove ${preset}` : `Click to select / add ${preset}`}
                        >
                          {alreadyHas ? `✓ ${preset}` : `+ ${preset}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Add Row */}
                <div className="pm-add-variant-bar">
                  <div className="pm-add-variant-col">
                    <label className="pm-mini-label">Weight / Option Label</label>
                    <input
                      className="dash-field__input"
                      placeholder="e.g. 750gm, 2L, Pack of 3"
                      value={customVariant.label}
                      onChange={(e) => setCustomVariant(prev => ({ ...prev, label: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomVariant(); } }}
                    />
                  </div>
                  <div className="pm-add-variant-col">
                    <label className="pm-mini-label">Regular Price ₹ (MRP)</label>
                    <input
                      className="dash-field__input"
                      type="number"
                      placeholder={editing.price ? `Default ₹${editing.price}` : '₹650'}
                      value={customVariant.price}
                      onChange={(e) => setCustomVariant(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="pm-add-variant-col">
                    <label className="pm-mini-label">Sale / Offer Price ₹</label>
                    <input
                      className="dash-field__input"
                      type="number"
                      placeholder={editing.salePrice ? `Default ₹${editing.salePrice}` : '₹580'}
                      value={customVariant.salePrice}
                      onChange={(e) => setCustomVariant(prev => ({ ...prev, salePrice: e.target.value }))}
                    />
                  </div>
                  <button
                    type="button"
                    className="dash-btn dash-btn--primary pm-add-variant-btn"
                    onClick={addCustomVariant}
                  >
                    <FiPlus size={16} style={{ marginRight: '4px' }} />
                    Add Option
                  </button>
                </div>

                {/* Configured Variants List */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="dash-field__label" style={{ margin: 0 }}>
                    Configured Variations ({editing.variants?.length || 0})
                  </label>
                  {(editing.variants || []).length > 1 && (
                    <button
                      type="button"
                      className="dash-btn"
                      style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: '#004E38', color: '#004E38' }}
                      onClick={sortEditingVariants}
                      title="Sort all variations in ascending numerical weight order (e.g. 50g, 200g, 300g)"
                    >
                      ⇅ Sort Orderly by Weight
                    </button>
                  )}
                </div>
                <div className="pm-variant-table-container">
                  {(editing.variants || []).length > 0 ? (
                    <table className="pm-variant-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px', textAlign: 'center' }}>Order</th>
                          <th>Option / Weight</th>
                          <th style={{ width: '130px' }}>Regular Price (₹)</th>
                          <th style={{ width: '130px' }}>Sale Price (₹)</th>
                          <th style={{ width: '90px', textAlign: 'center' }}>Default</th>
                          <th style={{ width: '50px', textAlign: 'center' }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editing.variants.map((v, i) => (
                          <tr key={v.id || i} className={v.isDefault ? 'is-default-row' : ''}>
                            <td style={{ textAlign: 'center' }}>
                              <div className="pm-order-btns">
                                <button
                                  type="button"
                                  disabled={i === 0}
                                  className="pm-order-btn"
                                  onClick={() => moveVariant(i, -1)}
                                  title="Move Up"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={i === editing.variants.length - 1}
                                  className="pm-order-btn"
                                  onClick={() => moveVariant(i, 1)}
                                  title="Move Down"
                                >
                                  ▼
                                </button>
                              </div>
                            </td>
                            <td>
                              <input
                                className="dash-field__input pm-table-input"
                                value={v.label}
                                onChange={(e) => updateVariant(i, 'label', e.target.value)}
                                placeholder="e.g. 100gm"
                              />
                            </td>
                            <td>
                              <input
                                className="dash-field__input pm-table-input"
                                type="number"
                                value={v.price}
                                onChange={(e) => updateVariant(i, 'price', e.target.value)}
                                placeholder={editing.price || '0'}
                              />
                            </td>
                            <td>
                              <input
                                className="dash-field__input pm-table-input"
                                type="number"
                                value={v.salePrice}
                                onChange={(e) => updateVariant(i, 'salePrice', e.target.value)}
                                placeholder={editing.salePrice || 'None'}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className={`pm-default-btn ${v.isDefault ? 'active' : ''}`}
                                onClick={() => setDefaultVariant(i)}
                                title={v.isDefault ? 'Currently selected by default' : 'Click to make this the default option'}
                              >
                                {v.isDefault ? '⭐ Default' : 'Set'}
                              </button>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="pm-action-btn pm-action-btn--delete"
                                onClick={() => removeVariant(i)}
                                title="Delete this option"
                              >
                                <FiX size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="pm-no-variants">
                      <p>No quantity / weight options added yet. Click any quick preset above (e.g. <strong>+ 100gm</strong>, <strong>+ 250gm</strong>) to add!</p>
                    </div>
                  )}
                </div>

                {/* Storefront Live Preview matching reference image */}
                {(editing.variants || []).length > 0 && (
                  <div className="pm-storefront-preview-card">
                    <div className="pm-preview-badge">Storefront Live Preview</div>
                    <div className="pm-preview-content">
                      <div className="product-weight-heading-row">
                        <span className="product-weight-heading">{(editing.variantAttribute || 'WEIGHT')}:</span>
                        <span className="product-weight-selected-label">
                          {previewSelectedVariant ? previewSelectedVariant.label : (editing.variants.find(v => v.isDefault)?.label || editing.variants[0]?.label)}
                        </span>
                      </div>
                      <div className="product-weight-boxes" style={{ margin: '8px 0' }}>
                        {editing.variants.map((v, i) => {
                          const currentActive = previewSelectedVariant
                            ? previewSelectedVariant.id === v.id
                            : (v.isDefault || i === 0);
                          return (
                            <div
                              key={v.id || i}
                              className={`product-weight-box ${currentActive ? 'active' : ''}`}
                              onClick={() => setPreviewSelectedVariant(v)}
                              style={{ cursor: 'pointer' }}
                            >
                              {v.label}
                            </div>
                          );
                        })}
                      </div>
                      <div className="product-price-block" style={{ margin: '8px 0 0' }}>
                        {(() => {
                          const cur = previewSelectedVariant || editing.variants.find(v => v.isDefault) || editing.variants[0];
                          const reg = cur?.price !== '' && cur?.price !== null && cur?.price !== undefined
                            ? parseFloat(cur.price)
                            : parseFloat(editing.price || 0);
                          const sl = cur?.salePrice !== '' && cur?.salePrice !== null && cur?.salePrice !== undefined
                            ? parseFloat(cur.salePrice)
                            : (cur?.price ? null : (editing.salePrice ? parseFloat(editing.salePrice) : null));
                          const isDisc = sl !== null && !isNaN(sl) && sl < reg;
                          return (
                            <>
                              {isDisc && <span className="product-price-original">₹{reg.toFixed(2)}</span>}
                              <span className="product-price-current">₹{(isDisc ? sl : (sl || reg)).toFixed(2)}</span>
                              <span className="product-tax-note">(Inclusive of all taxes).</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
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
