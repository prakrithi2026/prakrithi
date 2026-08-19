import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import ProductCard from './ProductCard';
import './ShopByConcern.css';

export default function ShopByConcern() {
  const { config } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];
  const categories = Array.isArray(config.categories) ? config.categories : [];
  const theme = config.theme || {};
  const [activeCategory, setActiveCategory] = useState('all');
  const [scrollProgress, setScrollProgress] = useState(30);
  const scrollRef = useRef(null);

  const filteredProducts =
    activeCategory === 'all'
      ? products.filter(p => p.tags?.includes('concern'))
      : products.filter((p) => p.category === activeCategory && p.tags?.includes('concern'));

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const progress = maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0;
    setScrollProgress(Math.max(30, progress));
  };

  return (
    <section className="shop-section">
      <div className="section-container">
        <h2 className="section-title">Shop By Concern</h2>

        <div className="filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              style={
                activeCategory === cat.id
                  ? { backgroundColor: theme.primaryColor, color: '#fff', borderColor: theme.primaryColor }
                  : { borderColor: theme.primaryColor, color: theme.primaryColor }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

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
