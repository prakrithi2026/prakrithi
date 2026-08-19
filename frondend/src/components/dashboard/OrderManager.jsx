import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiTrash2, FiSearch, FiRefreshCw, FiBell, FiDownload, FiPackage
} from 'react-icons/fi';
import { useSiteConfig } from '../../context/SiteConfigContext';
import API_BASE_URL from '../../utils/api';
import './OrderManager.css';

// ── Poll interval: check for new orders every 30 seconds ──────────────────
const POLL_INTERVAL_MS = 30_000;

// ── Generate & print a styled PDF for a single order ──────────────────────
function printOrderPDF(order, products) {
  const getProductName = (item) => {
    const p = products.find((x) => String(x.id) === String(item.product));
    return p ? p.name : `Product #${item.product}`;
  };

  const itemsHTML = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${getProductName(item)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">
          ₹${parseFloat(item.price).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');

  const payLabel = {
    cod: 'Cash on Delivery',
    upi: 'UPI',
    credit_card: 'Credit / Debit Card',
  }[order.payment_method] || order.payment_method;

  const html = `
    <div id="om-pdf-print" style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;color:#111;padding:32px">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
        <div>
          <div style="font-size:22px;font-weight:800;color:#006B3F">Order Invoice</div>
          <div style="font-size:13px;color:#6b7280;margin-top:2px">Order #${order.id}</div>
        </div>
        <div style="text-align:right;font-size:12px;color:#6b7280">
          <div>${new Date(order.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</div>
          <div>${new Date(order.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</div>
        </div>
      </div>

      <!-- Divider -->
      <div style="height:2px;background:linear-gradient(90deg,#006B3F,#00895A,transparent);margin-bottom:24px;border-radius:2px"></div>

      <!-- Customer & Shipping -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div style="background:#f9fafb;border-radius:10px;padding:16px;border:1px solid #e5e7eb">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;margin-bottom:8px">Customer Details</div>
          <div style="font-weight:700;font-size:14px">${order.customer_name}</div>
          <div style="color:#2563eb;font-size:13px;margin:2px 0">${order.customer_email}</div>
          <div style="color:#6b7280;font-size:13px">${order.customer_phone}</div>
        </div>
        <div style="background:#f9fafb;border-radius:10px;padding:16px;border:1px solid #e5e7eb">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;margin-bottom:8px">Shipping Address</div>
          <div style="font-size:13px;line-height:1.6;color:#374151">${order.shipping_address}</div>
        </div>
      </div>

      <!-- Payment info -->
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#15803d;margin-bottom:2px">Payment Method</div>
          <div style="font-weight:600;color:#166534">${payLabel}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#15803d;margin-bottom:2px">Status</div>
          <div style="font-weight:700;color:#166534;text-transform:capitalize">${order.status}</div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;margin-bottom:10px">Ordered Items</div>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Product</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
      </div>

      <!-- Total -->
      <div style="display:flex;justify-content:flex-end">
        <div style="background:#006B3F;color:#fff;border-radius:10px;padding:14px 24px;min-width:200px;text-align:right">
          <div style="font-size:11px;opacity:0.8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Total Amount</div>
          <div style="font-size:24px;font-weight:800">₹${parseFloat(order.total_amount).toFixed(2)}</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
        Generated on ${new Date().toLocaleString('en-IN')} · Thank you for your order!
      </div>
    </div>
  `;

  // Inject into a hidden div, then trigger print
  let printDiv = document.getElementById('om-pdf-print');
  if (printDiv) printDiv.remove();
  printDiv = document.createElement('div');
  printDiv.id = 'om-pdf-print';
  printDiv.innerHTML = html;
  printDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:99999;background:#fff;display:none';
  document.body.appendChild(printDiv);

  // Swap visibility temporarily for print
  const style = document.createElement('style');
  style.id = 'om-print-style';
  style.textContent = `
    @media print {
      body > *:not(#om-pdf-print) { display: none !important; }
      #om-pdf-print { display: block !important; position: static !important; }
    }
  `;
  document.head.appendChild(style);

  window.print();

  // Cleanup after print dialog closes
  setTimeout(() => {
    printDiv.remove();
    style.remove();
  }, 1000);
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function OrderManager() {
  const { config } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];

  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');
  const [newOrderIds, setNewOrderIds]     = useState(new Set());
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showBanner, setShowBanner]       = useState(false);
  const [bannerMsg, setBannerMsg]         = useState('');
  const knownIdsRef                       = useRef(null); // null = first load
  const pollTimerRef                      = useRef(null);

  // ── Fetch orders from API ────────────────────────────────────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/`);
      if (!res.ok) throw new Error('Network response not OK');
      const data = await res.json();
      const sorted = [...data].sort((a, b) => b.id - a.id);

      if (knownIdsRef.current === null) {
        // First load — just record known IDs
        knownIdsRef.current = new Set(sorted.map((o) => o.id));
      } else {
        // Subsequent polls — detect truly new orders
        const freshNew = sorted.filter((o) => !knownIdsRef.current.has(o.id));
        if (freshNew.length > 0) {
          freshNew.forEach((o) => knownIdsRef.current.add(o.id));
          setNewOrderIds((prev) => {
            const next = new Set(prev);
            freshNew.forEach((o) => next.add(o.id));
            return next;
          });
          setNewOrderCount((c) => c + freshNew.length);
          setBannerMsg(
            freshNew.length === 1
              ? `New order #${freshNew[0].id} from ${freshNew[0].customer_name}!`
              : `${freshNew.length} new orders received!`
          );
          setShowBanner(true);
        }
      }

      setOrders(sorted);
    } catch (err) {
      console.error('OrderManager fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial fetch + polling ──────────────────────────────────────────────
  useEffect(() => {
    fetchOrders(false);
    pollTimerRef.current = setInterval(() => fetchOrders(true), POLL_INTERVAL_MS);
    return () => clearInterval(pollTimerRef.current);
  }, [fetchOrders]);

  // ── Mark banner seen & clear count ──────────────────────────────────────
  const dismissBanner = () => {
    setShowBanner(false);
    setNewOrderCount(0);
  };

  // ── Delete order ────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm(`Delete Order #${id}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        setNewOrderIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      } else {
        alert('Failed to delete order (status ' + res.status + ')');
      }
    } catch (err) {
      alert('Error deleting order.');
      console.error(err);
    }
  };

  // ── Change order status ─────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
      console.error(err);
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────
  const q = searchQuery.toLowerCase();
  const filteredOrders = orders.filter(
    (o) =>
      (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
      (o.customer_name  && o.customer_name.toLowerCase().includes(q))  ||
      o.id.toString().includes(q)
  );

  // ── Stats ───────────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div>
      <div className="dash-panel" style={{ padding: 0, overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div className="om-header">
          <div className="om-header__left">
            <h2>📦 Order Manager</h2>
            <p>{orders.length} orders total · ₹{totalRevenue.toFixed(2)} revenue</p>
          </div>

          <div className="om-header__actions">
            {/* Bell button with badge */}
            <button
              className={`om-bell-btn ${newOrderCount > 0 ? 'om-bell-btn--active' : ''}`}
              onClick={() => { setShowBanner((v) => !v); if (newOrderCount > 0) setNewOrderCount(0); }}
              title="New order notifications"
            >
              <FiBell size={17} />
              {newOrderCount > 0 && (
                <span className="om-bell-badge">{newOrderCount}</span>
              )}
            </button>

            {/* Refresh */}
            <button
              className="dash-btn dash-btn--ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => fetchOrders(false)}
              disabled={loading}
            >
              <FiRefreshCw size={15} className={loading ? 'om-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── New-order notification banner ── */}
        {showBanner && (
          <div className="om-notif-banner">
            <div className="om-notif-banner__icon">🔔</div>
            <div className="om-notif-banner__text">
              <p className="om-notif-banner__title">{bannerMsg}</p>
              <p className="om-notif-banner__sub">Scroll down to view the latest orders</p>
            </div>
            <button className="om-notif-banner__close" onClick={dismissBanner} title="Dismiss">✕</button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="om-stats" style={{ padding: '16px 24px 0' }}>
          <div className="om-stat">
            <div className="om-stat__value">{orders.length}</div>
            <div className="om-stat__label">Total Orders</div>
          </div>
          <div className="om-stat">
            <div className="om-stat__value">{pendingCount}</div>
            <div className="om-stat__label">Pending</div>
          </div>
          <div className="om-stat">
            <div className="om-stat__value">₹{totalRevenue.toFixed(0)}</div>
            <div className="om-stat__label">Revenue</div>
          </div>
          <div className="om-stat">
            <div className="om-stat__value">{orders.filter((o) => o.status === 'delivered').length}</div>
            <div className="om-stat__label">Delivered</div>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="om-filters">
          <div className="om-search-wrap">
            <FiSearch size={15} />
            <input
              className="om-search-input"
              placeholder="Search by name, email or order ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ── Order List ── */}
        <div className="om-list">
          {loading ? (
            <div className="om-loading">
              <div className="om-loading__dot" />
              <div className="om-loading__dot" />
              <div className="om-loading__dot" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="om-empty">
              <div className="om-empty__icon">📭</div>
              <div className="om-empty__text">
                {searchQuery ? 'No orders match your search.' : 'No orders yet.'}
              </div>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isNew = newOrderIds.has(order.id);
              return (
                <div key={order.id} className={`om-card ${isNew ? 'om-card--new' : ''}`}>

                  {/* Card Header */}
                  <div className="om-card__header">
                    <div className="om-card__header-left">
                      <span className="om-card__id">Order #{order.id}</span>
                      {isNew && <span className="om-card__new-badge">🆕 New</span>}
                      <select
                        className={`om-card__status-select om-card__status-select--${order.status}`}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        {['pending','processing','shipped','delivered','cancelled'].map((s) => (
                          <option key={s} value={s} style={{ background: '#fff', color: '#333' }}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="om-card__header-right">
                      <span className="om-card__date">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}{' '}
                        {new Date(order.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="om-card__body">
                    {/* Customer */}
                    <div>
                      <div className="om-card__section-label">Customer</div>
                      <div className="om-card__customer-name">{order.customer_name}</div>
                      <a href={`mailto:${order.customer_email}`} className="om-card__customer-email">
                        {order.customer_email}
                      </a>
                      <div className="om-card__customer-phone">{order.customer_phone}</div>
                    </div>

                    {/* Address */}
                    <div>
                      <div className="om-card__section-label">Shipping Address</div>
                      <div className="om-card__address">{order.shipping_address}</div>
                    </div>

                    {/* Total */}
                    <div>
                      <div className="om-card__section-label">Total</div>
                      <div className="om-card__total-amount">₹{parseFloat(order.total_amount).toFixed(2)}</div>
                      <div className="om-card__payment-method">
                        {{
                          cod: '💵 Cash on Delivery',
                          upi: '📱 UPI',
                          credit_card: '💳 Card',
                        }[order.payment_method] || order.payment_method}
                      </div>
                    </div>
                  </div>

                  {/* Ordered Products */}
                  {order.items && order.items.length > 0 && (
                    <div className="om-card__products">
                      <div className="om-card__products-label">Ordered Items</div>
                      {order.items.map((item, idx) => {
                        const product = products.find((p) => String(p.id) === String(item.product));
                        const name = product ? product.name : `Product #${item.product}`;
                        return (
                          <div key={idx} className="om-product-row">
                            {product?.image ? (
                              <img src={product.image} alt={name} className="om-product-row__img" />
                            ) : (
                              <div className="om-product-row__placeholder">📦</div>
                            )}
                            <div>
                              <div className="om-product-row__name">{name}</div>
                              <div className="om-product-row__qty">Qty: {item.quantity}</div>
                            </div>
                            <div className="om-product-row__price">
                              ₹{parseFloat(item.price).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="om-card__actions">
                    {/* Download PDF */}
                    <button
                      className="om-action-btn om-action-btn--pdf"
                      onClick={() => printOrderPDF(order, products)}
                      title="Download order as PDF"
                    >
                      <FiDownload size={13} />
                      Download PDF
                    </button>

                    {/* Delete */}
                    <button
                      className="om-action-btn om-action-btn--delete"
                      onClick={() => handleDelete(order.id)}
                      title="Delete order"
                    >
                      <FiTrash2 size={13} />
                      Delete
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
