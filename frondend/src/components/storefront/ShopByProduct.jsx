import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import ProductCard from './ProductCard';
import './ShopByProduct.css';

export default function ShopByProduct() {
  const { config } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];
  const theme = config.theme || {};
  const [activeFilter, setActiveFilter] = useState('all');
  const [scrollProgress, setScrollProgress] = useState(30);
  const scrollRef = useRef(null);

  const baseProducts = products.filter((p) => !p.tags?.includes('concern'));
  const displayProducts = baseProducts.length > 0 ? baseProducts : products;

  const allFilters = [
    { id: 'all', label: 'All' },
    { id: 'on-sale', label: 'On Sale!' },
    { id: 'new-arrival', label: 'New Arrivals' },
    { id: 'best-seller', label: 'Best Seller' },
  ];

  const availableFilters = allFilters.filter(
    (f) => f.id === 'all' || displayProducts.some((p) => p.tags && p.tags.includes(f.id))
  );

  const filteredProducts =
    activeFilter === 'all'
      ? displayProducts
      : displayProducts.filter((p) => p.tags && p.tags.includes(activeFilter));

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const progress = maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0;
    setScrollProgress(Math.max(30, progress));
  };

  useEffect(() => {
    setScrollProgress(30);
  }, [activeFilter]);

  return (
    <section className="shop-section">
      <div className="section-container">
        <h2 className="section-title">Shop by Product</h2>

        {/* Filter tabs will only show if there are tags available, or at least 'All' if we want it.
            Actually, if only 'All' is available, maybe don't show the filter tabs at all? 
            Let's keep 'All' visible so the layout stays consistent, or hide it if it's the ONLY one.
        */}
        {availableFilters.length > 1 && (
          <div className="filter-tabs">
            {availableFilters.map((f) => (
              <button
                key={f.id}
                className={`filter-btn ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.id)}
                style={
                  activeFilter === f.id
                    ? { backgroundColor: theme.primaryColor, color: '#fff', borderColor: theme.primaryColor }
                    : { borderColor: theme.primaryColor, color: theme.primaryColor }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div
          className="products-scroll-wrapper"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          <div className="products-row">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Progress + View All */}
        <div className="progress-viewall-row">
          <div className="scroll-progress">
            <div
              className="scroll-progress-bar"
              style={{ width: `${scrollProgress}%`, backgroundColor: theme.primaryColor }}
            />
          </div>
          <div className="view-all-row" style={{ borderColor: theme.primaryColor }}>
            <Link to="/shop" className="btn-view-all" style={{ color: theme.primaryColor }}>
              View All →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
