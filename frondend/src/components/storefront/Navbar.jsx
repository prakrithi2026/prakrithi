import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import defaultConfig from '../../data/defaultConfig';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import SearchDrawer from './SearchDrawer';
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
  categories: '/categories',
  category:   '/categories',
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
  'Categories':        '/categories',
  'All Categories':    '/categories',
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

function SaleOnIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="nav-sale-icon"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <g clipPath="url(#clip0_sale_511_30)">
        <path
          d="M11.1184 1.62358C11.4969 0.92648 12.5031 0.92648 12.8816 1.62358C14.008 3.6982 16.4504 4.70984 18.7139 4.0394C19.4744 3.81412 20.1859 4.52556 19.9606 5.28613C19.2902 7.54965 20.3018 9.99195 22.3764 11.1184C23.0735 11.4969 23.0735 12.5031 22.3764 12.8816C20.3018 14.008 19.2902 16.4504 19.9606 18.7139C20.1859 19.4744 19.4744 20.1859 18.7139 19.9606C16.4504 19.2902 14.008 20.3018 12.8816 22.3764C12.5031 23.0735 11.4969 23.0735 11.1184 22.3764C9.99195 20.3018 7.54965 19.2902 5.28613 19.9606C4.52556 20.1859 3.81412 19.4744 4.0394 18.7139C4.70984 16.4504 3.6982 14.008 1.62358 12.8816C0.92648 12.5031 0.92648 11.4969 1.62358 11.1184C3.6982 9.99195 4.70984 7.54965 4.0394 5.28613C3.81412 4.52556 4.52556 3.81412 5.28613 4.0394C7.54965 4.70984 9.99195 3.6982 11.1184 1.62358Z"
          fill="url(#paint0_linear_sale_511_30)"
        />
        <path
          d="M6.96297 9.384C6.96297 8.94533 7.06097 8.54867 7.25697 8.194C7.4623 7.83 7.74697 7.54067 8.11097 7.326C8.47497 7.11133 8.88564 7.004 9.34297 7.004C9.81897 7.004 10.2343 7.11133 10.589 7.326C10.953 7.54067 11.233 7.83 11.429 8.194C11.6343 8.54867 11.737 8.94533 11.737 9.384C11.737 9.82267 11.6343 10.224 11.429 10.588C11.233 10.9427 10.953 11.2273 10.589 11.442C10.2343 11.6567 9.81897 11.764 9.34297 11.764C8.88564 11.764 8.47497 11.6567 8.11097 11.442C7.74697 11.2273 7.4623 10.9427 7.25697 10.588C7.06097 10.224 6.96297 9.82267 6.96297 9.384ZM8.25097 9.384C8.25097 9.58933 8.29764 9.78533 8.39097 9.972C8.4843 10.1493 8.6103 10.294 8.76897 10.406C8.93697 10.5087 9.1283 10.56 9.34297 10.56C9.5763 10.56 9.7723 10.5087 9.93097 10.406C10.0896 10.294 10.2156 10.1493 10.309 9.972C10.4023 9.78533 10.449 9.58933 10.449 9.384C10.449 9.16933 10.4023 8.97333 10.309 8.796C10.2156 8.61867 10.0896 8.47867 9.93097 8.376C9.7723 8.27333 9.5763 8.222 9.34297 8.222C9.1283 8.222 8.93697 8.27333 8.76897 8.376C8.6103 8.47867 8.4843 8.61867 8.39097 8.796C8.29764 8.97333 8.25097 9.16933 8.25097 9.384ZM12.801 14.816C12.801 14.368 12.9036 13.9667 13.109 13.612C13.3143 13.248 13.5943 12.9633 13.949 12.758C14.313 12.5433 14.7283 12.436 15.195 12.436C15.6616 12.436 16.0723 12.5433 16.427 12.758C16.791 12.9633 17.071 13.248 17.267 13.612C17.4723 13.9667 17.575 14.368 17.575 14.816C17.575 15.2453 17.4723 15.642 17.267 16.006C17.071 16.37 16.791 16.6593 16.427 16.874C16.0723 17.0793 15.6616 17.182 15.195 17.182C14.7283 17.182 14.313 17.0793 13.949 16.874C13.5943 16.6593 13.3143 16.37 13.109 16.006C12.9036 15.642 12.801 15.2453 12.801 14.816ZM14.103 14.802C14.103 15.0073 14.145 15.2033 14.229 15.39C14.3223 15.5673 14.4483 15.712 14.607 15.824C14.775 15.9267 14.971 15.978 15.195 15.978C15.419 15.978 15.6103 15.9267 15.769 15.824C15.937 15.712 16.063 15.5673 16.147 15.39C16.2403 15.2127 16.287 15.0167 16.287 14.802C16.287 14.5967 16.2403 14.4053 16.147 14.228C16.063 14.0507 15.937 13.9107 15.769 13.808C15.6103 13.696 15.419 13.64 15.195 13.64C14.971 13.64 14.775 13.696 14.607 13.808C14.4483 13.9107 14.3223 14.0507 14.229 14.228C14.145 14.4053 14.103 14.5967 14.103 14.802ZM14.915 7.2H16.413L9.62297 17H8.12497L14.915 7.2Z"
          fill="#FFFFFF"
        />
      </g>
      <defs>
        <linearGradient id="paint0_linear_sale_511_30" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="1" stopColor="#E00011" />
        </linearGradient>
        <clipPath id="clip0_sale_511_30">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
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
  const [profileOpen,    setProfileOpen]    = useState(false);
  const profileRef       = useRef(null);
  const navContainerRef  = useRef(null);

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
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (navContainerRef.current && !navContainerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
    };
  }, []);

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
      <div className="nav-container" ref={navContainerRef}>

        {/* ── Mobile Menu Toggle (Left Corner on Mobile) ── */}
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: navbar.textColor || '#004E38' }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {/* ── Logo (Centered on Mobile) ── */}
        {(() => {
          const logoSrc = navbar.logo !== undefined ? navbar.logo : defaultConfig.navbar?.logo;
          if (logoSrc) {
            return (
              <Link to="/" className="navbar-brand">
                <img
                  src={logoSrc}
                  alt={navbar.brandName || "Logo"}
                  className="navbar-brand-img"
                />
              </Link>
            );
          }
          if (navbar.brandName) {
            return (
              <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: navbar.textColor || '#004E38' }}>
                  {navbar.brandName}
                </span>
              </Link>
            );
          }
          return null;
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
                    /* item.badge          ? 'nav-item-badge'        : '', */
                    item.hasDropdown    ? 'nav-item-has-dropdown' : '',
                    active              ? 'nav-item--active'      : '',
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => item.hasDropdown && setOpenDropdown(item.id)}
                  onMouseLeave={() => item.hasDropdown && setOpenDropdown(null)}
                >
                  {/* Navbar Badges ("10% OFF*" and "Trending ⚡") commented out per user request:
                  {item.badge && (() => {
                    const badgeText = item.badge === '10% OFF' ? '10% OFF*' : item.badge;
                    const isTrending = badgeText.includes('⚡') || badgeText.toLowerCase().includes('trending') || item.id === 'new';
                    const isSale = item.id === 'sale' || badgeText.includes('10% OFF');
                    const defaultBg = (isTrending || isSale) ? '#004E38' : '#C5F1A9';
                    const defaultTextColor = (isTrending || isSale) ? '#FFFFFF' : '#004E38';
                    const badgeBg = isSale && item.badgeColor === '#C5F1A9' ? '#004E38' : (item.badgeColor || defaultBg);
                    const badgeTextColor = isSale && item.badgeTextColor === '#004E38' ? '#FFFFFF' : (item.badgeTextColor || defaultTextColor);
                    return (
                      <span
                        className={`badge-label ${isTrending ? 'badge-label--trending' : ''}`}
                        style={{
                          backgroundColor: badgeBg,
                          color:           badgeTextColor,
                        }}
                      >
                        {badgeText.includes('⚡') ? (
                          <>
                            <span>{badgeText.replace('⚡', '').trim()}</span>
                            <svg
                              className="badge-lightning-icon"
                              viewBox="0 0 448 512"
                              width="9"
                              height="11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288l111.5 0L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7l-111.5 0L349.4 44.6z"
                                fill={item.badgeTextColor === '#FFFFFF' || !item.badgeTextColor ? '#C5F1A9' : 'currentColor'}
                              />
                            </svg>
                          </>
                        ) : (
                          badgeText
                        )}
                      </span>
                    );
                  })()}
                  */}

                  <NavLink
                    href={href}
                    style={{ color: navbar.textColor || '#004E38' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {(item.id === 'sale' || (item.label && item.label.toLowerCase().includes('sale'))) && (
                      <SaleOnIcon />
                    )}
                    {item.label}
                    {item.hasDropdown && (
                      <svg
                        className={`dropdown-icon ${openDropdown === item.id ? 'dropdown-icon--open' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        width="18" height="18" viewBox="0 0 18 18" fill="none"
                      >
                        <path
                          d="M13.5 6.75L9 11.25L4.5 6.75"
                          stroke={navbar.textColor || '#004E38'}
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
                            style={{ color: navbar.textColor || '#004E38' }}
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
          <div className="nav-search-wrap">
            <button
              className="nav-icon-link nav-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.125 25C18.993 25 23.75 20.243 23.75 14.375C23.75 8.507 18.993 3.75 13.125 3.75C7.257 3.75 2.5 8.507 2.5 14.375C2.5 20.243 7.257 25 13.125 25Z" stroke={navbar.textColor || '#004E38'} strokeWidth="2" strokeLinejoin="round"/>
                <path d="M20.7637 22.0137L26.067 27.317" stroke={navbar.textColor || '#004E38'} strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Profile icon — with dropdown */}
          <div className="nav-profile-wrap" ref={profileRef}>
            <button
              className={`nav-icon-link nav-icon-user nav-profile-btn ${isActive('/profile') ? 'nav-icon--active' : ''}`}
              onClick={() => setProfileOpen(prev => !prev)}
              aria-label="Account"
              title={isLoggedIn ? `Signed in as ${user?.name}` : 'Sign in'}
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_524_232)">
                  <circle cx="15" cy="10" r="6" stroke={navbar.textColor || '#004E38'} strokeWidth="2"/>
                  <path d="M4 28C4 21.3726 8.92487 16 15 16" stroke={navbar.textColor || '#004E38'} strokeWidth="2"/>
                  <path d="M18.2222 28L20.4444 23.875L16 23.325L22.6667 17H23.7778L21.5556 21.125L26 21.675L19.3333 28H18.2222Z" fill="#FF0000"/>
                </g>
                <defs>
                  <clipPath id="clip0_524_232">
                    <rect width="30" height="30" fill="white"/>
                  </clipPath>
                </defs>
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
                      style={{ backgroundColor: navbar.textColor || '#004E38' }}
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
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_524_224)">
                <path d="M25.8828 11L24.1045 27H5.89551L4.11719 11H25.8828Z" stroke={navbar.textColor || '#004E38'} strokeWidth="2"/>
                <path d="M20 11C20 11 20.0002 3 15.0001 3C9.99987 3 10 11 10 11" stroke={navbar.textColor || '#004E38'} strokeWidth="2"/>
              </g>
              <defs>
                <clipPath id="clip0_524_224">
                  <rect width="30" height="30" fill="white"/>
                </clipPath>
              </defs>
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
      </div>

      {/* Slide-out Search Drawer */}
      <SearchDrawer isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}
