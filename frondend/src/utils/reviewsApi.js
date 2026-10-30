import API_BASE_URL from './api';
import { compressImage } from './imageOptimizer';

export function processReviewMedia(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected.'));
      return;
    }
    if (file.type.startsWith('image/')) {
      compressImage(file, 900, 900, 0.78)
        .then((url) => resolve({ url, type: 'image' }))
        .catch((err) => reject(new Error('Failed to process image: ' + (err.message || 'unknown error'))));
      return;
    }
    if (file.type.startsWith('video/')) {
      const maxSizeBytes = 20 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        reject(new Error('Video size exceeds 20MB. Please choose a smaller or shorter video clip.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result, type: 'video' });
      reader.onerror = () => reject(new Error('Failed to read video file.'));
      reader.readAsDataURL(file);
      return;
    }
    reject(new Error('Unsupported file format. Please upload an image (PNG, JPG, WEBP) or video (MP4, WEBM).'));
  });
}

const STORAGE_KEY = 'prakrithi_customer_reviews';
const MY_REVIEWS_KEY = 'prakrithi_my_review_ids';

const DEFAULT_SEED_REVIEWS = [
  {
    id: 'seed-1',
    product: 1,
    product_name: 'Organic Cardamom',
    customer_name: 'Priya Nair',
    customer_email: 'priya.n@example.com',
    rating: 5,
    title: 'Pure, authentic & highly recommended!',
    comment: 'The aroma when opening the package is intoxicating. Pure, whole green pods of the highest grade with incredible essential oil content. Truly organic and fresh.',
    media_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=80',
    media_type: 'image',
    admin_reply: 'Thank you Priya! We source our cardamom directly from certified organic farmers in Idukki.',
    replied_at: '2026-10-15T10:00:00Z',
    created_at: '2026-10-14T09:30:00Z',
  },
  {
    id: 'seed-2',
    product: 1,
    product_name: 'Organic Cardamom',
    customer_name: 'Anand Kumar',
    customer_email: 'anand.k@example.com',
    rating: 5,
    title: 'Best organic cardamom I have bought online',
    comment: 'Rich bold aroma and fresh plump green pods. Makes the chai taste sensational. Fast delivery too!',
    admin_reply: null,
    replied_at: null,
    created_at: '2026-10-18T14:15:00Z',
  },
  {
    id: 'seed-3',
    product: 1,
    product_name: 'Organic Cardamom',
    customer_name: 'Meera S.',
    customer_email: 'meera.s@example.com',
    rating: 4,
    title: 'Great flavor and sturdy packaging',
    comment: 'Really loved the freshness and natural fragrance. Added great depth to my homemade sweets and biryani.',
    admin_reply: 'Warm thanks Meera for your kind feedback!',
    replied_at: '2026-10-20T11:00:00Z',
    created_at: '2026-10-19T16:45:00Z',
  },
  {
    id: 'seed-4',
    product: 1,
    product_name: 'Organic Cardamom',
    customer_name: 'Rajesh Patel',
    customer_email: 'rajesh.p@example.com',
    rating: 5,
    title: 'Fresh harvest quality',
    comment: 'Pods are vibrant green and completely filled with dark seeds. You can immediately tell it is direct from Kerala hills.',
    media_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
    media_type: 'image',
    admin_reply: null,
    replied_at: null,
    created_at: '2026-10-21T08:20:00Z',
  },
  {
    id: 'seed-5',
    product: 1,
    product_name: 'Organic Cardamom',
    customer_name: 'Kavita R.',
    customer_email: 'kavita.r@example.com',
    rating: 5,
    title: 'Prakrithi Naturals never disappoints',
    comment: 'Second time ordering. The aroma is far superior to supermarket brands. Will definitely order the 500g pack next time.',
    admin_reply: 'Glad to hear that Kavita! Thank you for choosing Prakrithi Naturals.',
    replied_at: '2026-10-22T12:00:00Z',
    created_at: '2026-10-22T10:00:00Z',
  },
  {
    id: 'seed-6',
    product: 11,
    product_name: 'Wild Forest Honey',
    customer_name: 'Dr. Suresh Pillai',
    customer_email: 'suresh@example.com',
    rating: 5,
    title: 'Unprocessed, pure raw honey',
    comment: 'Distinctive wild flora flavor and thick raw texture. Genuine wild forest honey is rare to find and this is 100% authentic.',
    admin_reply: 'Thank you Dr. Suresh for your trust in our natural sourcing!',
    replied_at: '2026-10-19T09:00:00Z',
    created_at: '2026-10-18T10:00:00Z',
  },
  {
    id: 'seed-7',
    product: 13,
    product_name: 'Organic Ashwagandha Powder',
    customer_name: 'Vikram Menon',
    customer_email: 'vikram.m@example.com',
    rating: 5,
    title: 'Potent and pure root powder',
    comment: 'Finely milled and very potent. Noticeable boost in energy and sleep quality within two weeks of daily use.',
    admin_reply: null,
    replied_at: null,
    created_at: '2026-10-20T17:30:00Z',
  }
];

function getLocalReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SEED_REVIEWS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SEED_REVIEWS;
  } catch {
    return DEFAULT_SEED_REVIEWS;
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
    media_url: payload.media_url || null,
    media_type: payload.media_type || null,
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

