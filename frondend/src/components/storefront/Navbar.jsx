import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import defaultConfig from '../../data/defaultConfig';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

/**
 * Built-in route map — overrides stale `#` hrefs stored in the DB.
 * Keys match the item `id` field in the navbar config.
 */
const NAV_ROUTES = {
  products: '/shop',
  sale:     '/shop?tag=on-sale',
  new:      '/shop?tag=new-arrival',
  best:     '/shop?tag=best-seller',
  account:  '/profile',
};

const DROPDOWN_ROUTES = {
  'Best Sellers':      '/shop?tag=best-seller',
  'New Arrivals':      '/shop?tag=new-arrival',
  'Kerala Spices':     '/shop?category=spices',
  'Snacks':            '/shop?category=snacks',
  'Honey':             '/shop?category=honey',
  'My Orders':         '/profile?tab=orders',
  'Wishlist':          '/profile?tab=wishlist',
  'Track Order':       '/profile?tab=orders',
  'Contact Us':        '/contact',
};

/**
 * Resolves the final href for a nav item:
 * 1. If item.id is in NAV_ROUTES → use that route
 * 2. Else if stored href is a non-empty internal path (starts with /) → use it
 * 3. Otherwise fall back to '#'
 */
function resolveHref(item) {
  if (NAV_ROUTES[item.id]) return NAV_ROUTES[item.id];
  if (item.href && item.href !== '#' && item.href.startsWith('/')) return item.href;
  return null; // will render as <a href="#">
}

function resolveDropdownHref(dd) {
  if (DROPDOWN_ROUTES[dd.label]) return DROPDOWN_ROUTES[dd.label];
  if (dd.href && dd.href !== '#' && dd.href.startsWith('/')) return dd.href;
  return null;
}

/**
 * Smart link: React Router <Link> for internal paths, <a> for external/hash.
 */
function NavLink({ href, children, style, className, onClick }) {
  if (href && href.startsWith('/')) {
    return (
      <Link to={href} style={style} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href || '#'} style={style} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

export default function Navbar() {
  const { config } = useSiteConfig();
  const { navbar, theme } = config;
  const { cartCount, toggleCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSticky,       setIsSticky]       = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [openDropdown,   setOpenDropdown]   = useState(null);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [profileOpen,    setProfileOpen]    = useState(false);
  const searchRef        = useRef(null);
  const searchInputRef   = useRef(null);
  const profileRef       = useRef(null);

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const searchResults = searchQuery.trim()
    ? (config.products || [])
        .filter(p =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  // Active link check
  const isActive = (href) => {
    if (!href) return false;
    
    const origin = window.location.origin;
    const itemUrl = new URL(href, origin);
    const currentUrl = new URL(location.pathname + location.search, origin);
    
    let isPathMatch = (itemUrl.pathname === currentUrl.pathname);
    if (!isPathMatch) {
      if ((itemUrl.pathname === '/profile' || itemUrl.pathname === '/orders') &&
          (currentUrl.pathname === '/profile' || currentUrl.pathname === '/orders')) {
        isPathMatch = true;
      }
    }
    
    if (!isPathMatch) return false;
    
    const itemParams = Array.from(itemUrl.searchParams.entries());
    if (itemParams.length > 0) {
      return itemParams.every(([key, value]) => currentUrl.searchParams.get(key) === value);
    }
    
    if (currentUrl.search) {
      const otherHrefs = [];
      if (navbar && navbar.items) {
        navbar.items.forEach(otherItem => {
          const h = resolveHref(otherItem);
          if (h && h !== href) otherHrefs.push(h);
        });
      }
      
      const matchedOther = otherHrefs.some(otherHref => {
        const otherUrl = new URL(otherHref, origin);
        if (otherUrl.pathname !== currentUrl.pathname) return false;
        const otherParams = Array.from(otherUrl.searchParams.entries());
        if (otherParams.length === 0) return false;
        return otherParams.every(([key, value]) => currentUrl.searchParams.get(key) === value);
      });
      
      if (matchedOther) return false;
    }
    
    return true;
  };

  return (
    <nav
      className={`navbar ${isSticky ? 'navbar--scrolled' : ''}`}
      style={{ backgroundColor: navbar.bgColor || '#FFFFFF' }}
    >
      <div className="nav-container">

        {/* ── Logo ── */}
        {(() => {
          const logoSrc = navbar.logo || defaultConfig.navbar?.logo;
          return logoSrc ? (
            <Link to="/" className="navbar-brand">
              <img
                src={logoSrc}
                alt={navbar.brandName || "Logo"}
                style={{ height: '48px', width: 'auto' }}
              />
            </Link>
          ) : null;
        })()}

        {/* ── Nav Links ── */}
        <div className={`nav-links ${mobileOpen ? 'nav-links--open' : ''}`}>
          <ul>
            {navbar.items.map((item) => {
              const href = resolveHref(item);
              const active = isActive(href);
              return (
                <li
                  key={item.id}
                  className={[
                    item.badge          ? 'nav-item-badge'        : '',
                    item.hasDropdown    ? 'nav-item-has-dropdown' : '',
                    active              ? 'nav-item--active'      : '',
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => item.hasDropdown && setOpenDropdown(item.id)}
                  onMouseLeave={() => item.hasDropdown && setOpenDropdown(null)}
                >
                  {item.badge && (
                    <span
                      className="badge-label"
                      style={{
                        backgroundColor: item.badgeColor    || '#BDD681',
                        color:           item.badgeTextColor || '#012B28',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}

                  <NavLink
                    href={href}
                    style={{ color: navbar.textColor || '#012B28' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                    {item.hasDropdown && (
                      <svg
                        className={`dropdown-icon ${openDropdown === item.id ? 'dropdown-icon--open' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        width="18" height="18" viewBox="0 0 18 18" fill="none"
                      >
                        <path
                          d="M13.5 6.75L9 11.25L4.5 6.75"
                          stroke={navbar.textColor || '#012B28'}
                          strokeWidth="2" strokeLinecap="square" strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </NavLink>

                  {/* Dropdown */}
                  {item.hasDropdown && openDropdown === item.id && item.dropdownItems?.length > 0 && (
                    <div className="nav-dropdown-menu">
                      {item.dropdownItems.map((dd, j) => {
                        const ddHref = resolveDropdownHref(dd);
                        return (
                          <NavLink
                            key={j}
                            href={ddHref}
                            className="nav-dropdown-menu__item"
                            style={{ color: navbar.textColor || '#012B28' }}
                            onClick={() => { setOpenDropdown(null); setMobileOpen(false); }}
                          >
                            {dd.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* ── Nav Icons ── */}
        <div className="nav-icons">

          {/* Search */}
          <div className="nav-search-wrap" ref={searchRef}>
            <button
              className="nav-icon-link nav-search-btn"
              onClick={() => setSearchOpen(prev => !prev)}
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 30 30" fill="none">
                <path d="M13.125 25C18.993 25 23.75 20.243 23.75 14.375C23.75 8.507 18.993 3.75 13.125 3.75C7.257 3.75 2.5 8.507 2.5 14.375C2.5 20.243 7.257 25 13.125 25Z"
                  stroke={navbar.textColor || '#012B28'} strokeWidth="2" strokeLinejoin="round"/>
                <path d="M20.7637 22.0137L26.067 27.317"
                  stroke={navbar.textColor || '#012B28'} strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </button>

            {searchOpen && (
              <div className="nav-search-panel">
                <form onSubmit={handleSearchSubmit} className="nav-search-form">
                  <input
                    ref={searchInputRef}
                    type="search"
                    className="nav-search-input"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="nav-search-submit">→</button>
                </form>

                {searchResults.length > 0 && (
                  <div className="nav-search-results">
                    {searchResults.map(p => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        className="nav-search-result-item"
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      >
                        {p.image
                          ? <img src={p.image} alt="" />
                          : <span className="nav-search-result-emoji">🌿</span>
                        }
                        <div>
                          <p className="nav-search-result-name">{p.name}</p>
                          <p className="nav-search-result-price">
                            ₹{parseFloat(p.salePrice || p.price).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </Link>
                    ))}
                    <Link
                      to={`/shop?q=${encodeURIComponent(searchQuery)}`}
                      className="nav-search-see-all"
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    >
                      See all results for "{searchQuery}" →
                    </Link>
                  </div>
                )}

                {searchQuery.trim() && searchResults.length === 0 && (
                  <div className="nav-search-empty">No products found for "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>

          {/* Profile icon — with dropdown */}
          <div className="nav-profile-wrap" ref={profileRef}>
            <button
              className={`nav-icon-link nav-icon-user nav-profile-btn ${isActive('/profile') ? 'nav-icon--active' : ''}`}
              onClick={() => setProfileOpen(prev => !prev)}
              aria-label="Account"
              title={isLoggedIn ? `Signed in as ${user?.name}` : 'Sign in'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="26" viewBox="0 0 19 25" fill="none">
                <circle cx="12" cy="7" r="6" stroke={navbar.textColor || '#012B28'} strokeWidth="2"/>
                <path d="M1 25C1 18.3726 5.92487 13 12 13" stroke={navbar.textColor || '#012B28'} strokeWidth="2"/>
              </svg>
              {wishlistCount > 0 && (
                <span className="nav-wishlist-badge">{wishlistCount}</span>
              )}
            </button>

            {profileOpen && (
              <div className="nav-profile-dropdown">
                {isLoggedIn ? (
                  <>
                    <div className="nav-profile-user">
                      <span className="nav-profile-avatar">
                        {(user?.name || 'U')[0].toUpperCase()}
                      </span>
                      <div>
                        <p className="nav-profile-name">{user?.name}</p>
                        <p className="nav-profile-email">{user?.email}</p>
                      </div>
                    </div>
                    <div className="nav-profile-divider" />
                    <Link
                      to="/profile"
                      className="nav-profile-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>👤</span> My Profile
                    </Link>
                    <Link
                      to="/profile?tab=orders"
                      className="nav-profile-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>📦</span> My Orders
                    </Link>
                    <Link
                      to="/profile?tab=wishlist"
                      className="nav-profile-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>❤️</span> Wishlist
                    </Link>
                    <div className="nav-profile-divider" />
                    <button
                      className="nav-profile-item nav-profile-logout"
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                        navigate('/');
                      }}
                    >
                      <span>🚪</span> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <p className="nav-profile-guest">Sign in to your account</p>
                    <Link
                      to="/login"
                      className="nav-profile-login-btn"
                      style={{ backgroundColor: navbar.textColor || '#012B28' }}
                      onClick={() => setProfileOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="nav-profile-signup-link"
                      onClick={() => setProfileOpen(false)}
                    >
                      Create Account →
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <button className="nav-icon-link cart-link" onClick={toggleCart} aria-label="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path d="M25.8828 11L24.1045 27H5.89551L4.11719 11H25.8828Z"
                stroke={navbar.textColor || '#012B28'} strokeWidth="2"/>
              <path d="M20 11C20 11 20.0002 3 15.0001 3C9.99987 3 10 11 10 11"
                stroke={navbar.textColor || '#012B28'} strokeWidth="2"/>
            </svg>
            {cartCount > 0 && (
              <svg className="cart-badge-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#EF1C1C"/>
                <text x="10" y="10" textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="10" fontWeight="bold">
                  {cartCount}
                </text>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: navbar.textColor }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
