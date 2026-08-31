import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiDroplet, FiNavigation, FiImage, FiBox, FiLayout, FiFileText,
  FiArrowLeft, FiRefreshCw, FiExternalLink, FiMonitor, FiSmartphone,
  FiTablet, FiChevronLeft, FiChevronRight, FiChevronDown, FiEye, FiSave, FiCheck, FiShoppingCart,
  FiLogOut
} from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import NavbarEditor from './NavbarEditor';
import HeroEditor from './HeroEditor';
import ProductManager from './ProductManager';
import SectionManager from './SectionManager';
import FooterEditor from './FooterEditor';
import OrderManager from './OrderManager';
import AdminLogin, { useAdminAuth } from './AdminLogin';
import './DashboardLayout.css';

const menuGroups = [
  {
    title: 'Home',
    items: [
      { id: 'navbar', icon: FiNavigation, label: 'Navbar', desc: 'Logo & navigation' },
      { id: 'hero', icon: FiImage, label: 'Hero Banner', desc: 'Hero section' },
      { id: 'sections', icon: FiLayout, label: 'Sections', desc: 'Page sections' },
      { id: 'footer', icon: FiFileText, label: 'Footer', desc: 'Footer content' },
    ]
  },
  {
    title: 'Store',
    items: [
      { id: 'products', icon: FiBox, label: 'Products', desc: 'Product catalog' },
      { id: 'orders', icon: FiShoppingCart, label: 'Manage Orders', desc: 'View & manage' },
    ]
  }
];

const editorComponents = {
  navbar: NavbarEditor,
  hero: HeroEditor,
  products: ProductManager,
  orders: OrderManager,
  sections: SectionManager,
  footer: FooterEditor,
};

const viewportModes = [
  { id: 'desktop', icon: FiMonitor, label: 'Desktop', width: 1280 },
  { id: 'tablet', icon: FiTablet, label: 'Tablet', width: 768 },
  { id: 'mobile', icon: FiSmartphone, label: 'Mobile', width: 375 },
];

// ── Auth gate: shown when NOT logged in ─────────────────────────────────────
export default function DashboardLayout() {
  const { isAuthenticated, login, logout } = useAdminAuth();

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  // Once authenticated, render the full dashboard (separate component so that
  // ALL hooks are always called unconditionally — React Rules of Hooks).
  return <DashboardContent logout={logout} />;
}

// ── Full dashboard UI — only mounted after successful login ──────────────────
function DashboardContent({ logout }) {
  const { saveConfig, resetConfig, hasUnsavedChanges } = useSiteConfig();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('navbar');
  const [viewportMode, setViewportMode] = useState('desktop');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(260);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingLeftRef = useRef(false);
  const isResizingRightRef = useRef(false);
  const iframeRef = useRef(null);

  const [expandedGroups, setExpandedGroups] = useState({ 'Home': false, 'Store': true });

  const toggleGroup = (title) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const previewContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!previewContainerRef.current) return;
    const updateSize = () => {
      if (previewContainerRef.current) {
        const rect = previewContainerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };
    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(previewContainerRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [activeSection, leftCollapsed, rightCollapsed, leftPanelWidth, rightPanelWidth]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeftRef.current) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
          setLeftPanelWidth(newWidth);
        }
      }
      if (isResizingRightRef.current) {
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth >= 250 && newWidth <= 800) {
          setRightPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizingLeftRef.current || isResizingRightRef.current) {
        isResizingLeftRef.current = false;
        isResizingRightRef.current = false;
        setIsResizing(false);
        document.body.style.cursor = 'default';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleLeftResizeStart = (e) => {
    isResizingLeftRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  };

  const handleRightResizeStart = (e) => {
    isResizingRightRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  };

  // Show a brief "Saved!" animation ONLY if save succeeds
  const handleSave = async () => {
    const res = await saveConfig();
    if (res?.success) {
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
    }
  };

  const handlePreview = () => {
    window.open('/', '_blank');
  };

  const handleBackToStore = () => {
    navigate('/');
  };

  // Warn on leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const ActiveEditor = editorComponents[activeSection];
  const activeViewport = viewportModes.find((v) => v.id === viewportMode) || viewportModes[0];

  const getViewportStyles = () => {
    const cWidth = containerSize.width || 800;
    const cHeight = containerSize.height || 700;

    // Available space inside preview container with padding
    const paddingX = 24;
    const paddingY = 24;
    const availW = Math.max(cWidth - paddingX, 320);
    const availH = Math.max(cHeight - paddingY, 400);

    if (viewportMode === 'desktop') {
      const targetW = 1280;
      const scale = Math.min(availW / targetW, 1);
      const frameW = Math.round(targetW * scale);
      const frameH = availH;
      const iframeW = targetW;
      const iframeH = Math.round(frameH / scale);

      return {
        frameStyle: {
          width: `${frameW}px`,
          height: `${frameH}px`,
        },
        iframeStyle: {
          width: `${iframeW}px`,
          height: `${iframeH}px`,
          transform: scale < 1 ? `scale(${scale})` : 'none',
          transformOrigin: 'top left',
        },
        scale: Math.round(scale * 100),
      };
    }

    if (viewportMode === 'tablet') {
      const targetW = 768;
      const scale = Math.min(availW / targetW, 1);
      const frameW = Math.round(targetW * scale);
      const frameH = availH;
      const iframeW = targetW;
      const iframeH = Math.round(frameH / scale);

      return {
        frameStyle: {
          width: `${frameW}px`,
          height: `${frameH}px`,
        },
        iframeStyle: {
          width: `${iframeW}px`,
          height: `${iframeH}px`,
          transform: scale < 1 ? `scale(${scale})` : 'none',
          transformOrigin: 'top left',
        },
        scale: Math.round(scale * 100),
      };
    }

    // Mobile mode (375px)
    const targetW = 375;
    const scale = Math.min(availW / targetW, 1);
    const frameW = Math.round(targetW * scale);
    const frameH = Math.min(availH, 812);
    const iframeW = targetW;
    const iframeH = Math.round(frameH / scale);

    return {
      frameStyle: {
        width: `${frameW}px`,
        height: `${frameH}px`,
      },
      iframeStyle: {
        width: `${iframeW}px`,
        height: `${iframeH}px`,
        transform: scale < 1 ? `scale(${scale})` : 'none',
        transformOrigin: 'top left',
      },
      scale: Math.round(scale * 100),
    };
  };

  const { frameStyle, iframeStyle } = getViewportStyles();

  return (
    <div className="shopify-dash">
      {/* ── Top Header Bar ── */}
      <header className="shopify-dash__header">
        <div className="shopify-dash__header-left">
          <button className="shopify-dash__back-btn" onClick={handleBackToStore} title="Back to store">
            <FiArrowLeft size={18} />
          </button>
          <div className="shopify-dash__brand">
            <span className="shopify-dash__brand-icon">⚙️</span>
            <span className="shopify-dash__brand-name">Theme Editor</span>
          </div>
          {hasUnsavedChanges && (
            <span className="shopify-dash__unsaved-badge">Unsaved changes</span>
          )}
        </div>

        <div className="shopify-dash__header-center">
          {/* Viewport switcher */}
          {activeSection !== 'orders' && activeSection !== 'products' && (
            <div className="shopify-dash__viewport-switcher">
              {viewportModes.map((mode) => (
                <button
                  key={mode.id}
                  className={`shopify-dash__viewport-btn ${viewportMode === mode.id ? 'shopify-dash__viewport-btn--active' : ''}`}
                  onClick={() => setViewportMode(mode.id)}
                  title={mode.label}
                >
                  <mode.icon size={16} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="shopify-dash__header-right">
          {/* Reset button — reverts to last saved state */}
          <button
            className="shopify-dash__discard-btn"
            onClick={resetConfig}
            disabled={!hasUnsavedChanges}
            title="Discard unsaved changes"
          >
            <FiRefreshCw size={14} />
            <span>Discard</span>
          </button>

          {/* Save button */}
          <button
            className={`shopify-dash__save-btn ${saveFlash ? 'shopify-dash__save-btn--saved' : ''} ${!hasUnsavedChanges ? 'shopify-dash__save-btn--disabled' : ''}`}
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
          >
            {saveFlash ? (
              <>
                <FiCheck size={16} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <FiSave size={16} />
                <span>Save</span>
              </>
            )}
          </button>

          {/* Preview in new tab */}
          <button className="shopify-dash__preview-btn" onClick={handlePreview}>
            <FiEye size={16} />
            <span>Preview</span>
            <FiExternalLink size={13} />
          </button>

          {/* Logout button */}
          <button
            className="shopify-dash__logout-btn"
            onClick={logout}
            title="Sign out of admin"
          >
            <FiLogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ── Main 3-Panel Area ── */}
      <div className="shopify-dash__body">
        {/* LEFT PANEL — Templates / Sections */}
        <aside 
          className={`shopify-dash__left ${leftCollapsed ? 'shopify-dash__left--collapsed' : ''}`}
          style={{ 
            width: leftCollapsed ? undefined : `${leftPanelWidth}px`,
            transition: isResizing ? 'none' : undefined 
          }}
        >
          <button
            className="shopify-dash__panel-toggle shopify-dash__panel-toggle--left"
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            title={leftCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {leftCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
          </button>

          {!leftCollapsed && (
            <>
              <div className="shopify-dash__left-header">
                <h3 className="shopify-dash__left-title">Templates</h3>
                <p className="shopify-dash__left-subtitle">Page sections</p>
              </div>

              <nav className="shopify-dash__section-list">
                {menuGroups.map((group, gIdx) => (
                  <div key={gIdx} className="shopify-dash__menu-group">
                    <button 
                      className="shopify-dash__group-header"
                      onClick={() => toggleGroup(group.title)}
                    >
                      <span className="shopify-dash__group-title-text">{group.title}</span>
                      {expandedGroups[group.title] ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    </button>
                    {expandedGroups[group.title] && (
                      <div className="shopify-dash__group-items">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            className={`shopify-dash__section-item ${activeSection === item.id ? 'shopify-dash__section-item--active' : ''}`}
                            onClick={() => setActiveSection(item.id)}
                          >
                            <div className="shopify-dash__section-icon">
                              <item.icon size={18} />
                            </div>
                            <div className="shopify-dash__section-text">
                              <span className="shopify-dash__section-label">{item.label}</span>
                              <span className="shopify-dash__section-desc">{item.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </>
          )}
        </aside>

        {/* LEFT RESIZER */}
        {!leftCollapsed && (
          <div 
            className="shopify-dash__resizer" 
            onMouseDown={handleLeftResizeStart}
          />
        )}

        {/* Dynamic Center and Right Layout */}
        {activeSection === 'orders' || activeSection === 'products' ? (
          <main className="shopify-dash__center" style={{ background: '#f8f9fb', padding: '32px', overflowY: 'auto', flex: 1, display: 'block' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
              <ActiveEditor />
            </div>
          </main>
        ) : (
          <>
            {/* CENTER PANEL — Live Preview */}
            <main className="shopify-dash__center">
              <div className="shopify-dash__preview-container" ref={previewContainerRef}>
                <div
                  className={`shopify-dash__preview-frame shopify-dash__preview-frame--${viewportMode}`}
                  style={frameStyle}
                >
                  <iframe
                    ref={iframeRef}
                    src={activeSection === 'products' ? "/shop?mode=preview" : "/?mode=preview"}
                    className="shopify-dash__iframe"
                    style={{
                      ...iframeStyle,
                      pointerEvents: isResizing ? 'none' : 'auto',
                    }}
                    title="Storefront Preview"
                  />
                </div>
              </div>
            </main>

            {/* RIGHT RESIZER */}
            {!rightCollapsed && (
              <div 
                className="shopify-dash__resizer" 
                onMouseDown={handleRightResizeStart}
              />
            )}

            {/* RIGHT PANEL — Edit Tools */}
            <aside 
              className={`shopify-dash__right ${rightCollapsed ? 'shopify-dash__right--collapsed' : ''}`}
              style={{ 
                width: rightCollapsed ? undefined : `${rightPanelWidth}px`,
                transition: isResizing ? 'none' : undefined 
              }}
            >
              <button
                className="shopify-dash__panel-toggle shopify-dash__panel-toggle--right"
                onClick={() => setRightCollapsed(!rightCollapsed)}
                title={rightCollapsed ? 'Expand panel' : 'Collapse panel'}
              >
                {rightCollapsed ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
              </button>

              {!rightCollapsed && (
                <div className="shopify-dash__editor-wrap">
                  <ActiveEditor />
                </div>
              )}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
