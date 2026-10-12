import API_BASE_URL from './api';

const STORAGE_KEY = 'prakrithi_customer_reviews';
const MY_REVIEWS_KEY = 'prakrithi_my_review_ids';

function getLocalReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalReviews(reviews) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // ignore storage quota errors
  }
}

export function getMyReviewIds() {
  try {
    const raw = localStorage.getItem(MY_REVIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function addMyReviewId(reviewId) {
  if (reviewId === undefined || reviewId === null) return;
  try {
    const ids = new Set(getMyReviewIds());
    ids.add(String(reviewId));
    localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

function removeMyReviewId(reviewId) {
  try {
    const next = getMyReviewIds().filter((id) => id !== String(reviewId));
    localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function isOwnReview(review, user = null) {
  if (!review) return false;
  const myIds = getMyReviewIds();
  if (review.id !== undefined && review.id !== null && myIds.includes(String(review.id))) {
    return true;
  }
  if (user) {
    if (
      user.email &&
      review.customer_email &&
      user.email.trim().toLowerCase() === review.customer_email.trim().toLowerCase()
    ) {
      return true;
    }
    if (
      user.name &&
      review.customer_name &&
      user.name.trim().toLowerCase() === review.customer_name.trim().toLowerCase()
    ) {
      return true;
    }
  }
  return false;
}

function notifyReviewsUpdated() {
  try {
    window.dispatchEvent(new CustomEvent('prakrithi-reviews-updated'));
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('prakrithi-reviews-sync');
      ch.postMessage({ type: 'REVIEWS_UPDATED' });
      ch.close();
    }
  } catch {
    // ignore
  }
}

export async function fetchReviews(productId = null) {
  try {
    const url = productId
      ? `${API_BASE_URL}/reviews/?product=${encodeURIComponent(productId)}`
      : `${API_BASE_URL}/reviews/`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        if (!productId) {
          setLocalReviews(data);
        }
        return data;
      }
    }
  } catch {
    // Fallback to local reviews if backend is offline
  }

  const local = getLocalReviews();
  if (productId) {
    return local.filter((r) => String(r.product) === String(productId));
  }
  return local;
}

export async function createReview(payload) {
  const cleanPayload = {
    customer_name: (payload.customer_name || '').trim(),
    customer_email: (payload.customer_email || '').trim() || null,
    product: payload.product ? Number(payload.product) : null,
    product_name: payload.product_name || null,
    rating: Number(payload.rating) || 5,
    title: (payload.title || '').trim() || null,
    comment: (payload.comment || '').trim(),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/reviews/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    });
    if (res.ok) {
      const created = await res.json();
      addMyReviewId(created.id);
      const current = getLocalReviews().filter((r) => r.id !== created.id);
      setLocalReviews([created, ...current]);
      notifyReviewsUpdated();
      return created;
    }
  } catch {
    // Fallback to local storage if backend is offline
  }

  const fallbackReview = {
    id: Date.now(),
    ...cleanPayload,
    admin_reply: null,
    replied_at: null,
    created_at: new Date().toISOString(),
  };
  addMyReviewId(fallbackReview.id);
  const current = getLocalReviews();
  setLocalReviews([fallbackReview, ...current]);
  notifyReviewsUpdated();
  return fallbackReview;
}

export async function replyToReview(reviewId, adminReply) {
  const trimmedReply = (adminReply || '').trim();
  const payload = { admin_reply: trimmedReply };

  try {
    const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updated = await res.json();
      const current = getLocalReviews().map((r) =>
        String(r.id) === String(reviewId) ? updated : r
      );
      setLocalReviews(current);
      notifyReviewsUpdated();
      return updated;
    }
  } catch {
    // Fallback to local update
  }

  const now = trimmedReply ? new Date().toISOString() : null;
  let updatedItem = null;
  const current = getLocalReviews().map((r) => {
    if (String(r.id) === String(reviewId)) {
      updatedItem = {
        ...r,
        admin_reply: trimmedReply || null,
        replied_at: now,
      };
      return updatedItem;
    }
    return r;
  });
  setLocalReviews(current);
  notifyReviewsUpdated();
  return updatedItem || { id: reviewId, admin_reply: trimmedReply || null, replied_at: now };
}

export async function deleteReviewById(reviewId) {
  removeMyReviewId(reviewId);
  try {
    const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}/`, {
      method: 'DELETE',
    });
    if (res.ok || res.status === 204) {
      const current = getLocalReviews().filter((r) => String(r.id) !== String(reviewId));
      setLocalReviews(current);
      notifyReviewsUpdated();
      return true;
    }
  } catch {
    // Fallback to local delete
  }

  const current = getLocalReviews().filter((r) => String(r.id) !== String(reviewId));
  setLocalReviews(current);
  notifyReviewsUpdated();
  return true;
}

