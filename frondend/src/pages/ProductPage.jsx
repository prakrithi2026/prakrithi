import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/storefront/Navbar';
import Footer from '../components/storefront/Footer';
import CartModal from '../components/storefront/CartModal';
import AnnouncementBar from '../components/storefront/AnnouncementBar';
import ProductCard from '../components/storefront/ProductCard';
import ProductImageGallery from '../components/storefront/ProductImageGallery';
import ProductLikeIcon from '../components/storefront/ProductLikeIcon';
import { fetchReviews, createReview, deleteReviewById, isOwnReview, processReviewMedia } from '../utils/reviewsApi';
import './ProductPage.css';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

// Orange Filled Star SVG (#ff9800 matches reference images)
const OrangeStarFilled = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#ff9800"
    stroke="#ff9800"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`review-orange-star filled ${className}`}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Orange Outlined Star SVG (matches reference image unfilled rows)
const OrangeStarOutline = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ff9800"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`review-orange-star outline ${className}`}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Orange Half / Partial Star (clean outline base with 50% filled overlay)
const OrangeStarHalf = ({ size = 16, className = '', percent = 50 }) => (
  <span
    className={`review-orange-star half ${className}`}
    style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: `${size}px`,
      height: `${size}px`,
      lineHeight: 1,
      flexShrink: 0,
    }}
    aria-hidden="true"
  >
    <OrangeStarOutline size={size} />
    <span
      className="star-half-clip"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${percent}%`,
        height: '100%',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <OrangeStarFilled size={size} />
    </span>
  </span>
);

// Trust Badge SVGs
const NaturalTrustIcon = ({ size = 20, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M15.9999 25.9487C14.7926 25.9487 13.6553 25.7501 12.588 25.3527C11.5208 24.9552 10.5531 24.4008 9.68462 23.6897L7.36928 25.9717C7.18751 26.1564 6.95617 26.2487 6.67528 26.2487C6.3944 26.2487 6.16162 26.1564 5.97695 25.9717C5.79228 25.7873 5.69995 25.5545 5.69995 25.2734C5.69995 24.9925 5.79228 24.7613 5.97695 24.5797L8.25895 22.2974C7.54784 21.4292 6.99362 20.4559 6.59628 19.3777C6.19873 18.2993 5.99995 17.1563 5.99995 15.9487C5.99995 13.1572 6.96873 10.7926 8.90628 8.85506C10.8438 6.91751 13.2084 5.94873 15.9999 5.94873H25.9999V15.9487C25.9999 18.7405 25.0312 21.1051 23.0936 23.0424C21.1561 24.9799 18.7915 25.9487 15.9999 25.9487ZM15.9999 23.9487C18.2222 23.9487 20.1111 23.1709 21.6666 21.6154C23.2222 20.0598 23.9999 18.1709 23.9999 15.9487V7.94873H15.9999C13.7777 7.94873 11.8888 8.72651 10.3333 10.2821C8.77773 11.8376 7.99995 13.7265 7.99995 15.9487C7.99995 16.8752 8.15039 17.7564 8.45128 18.5924C8.75217 19.4284 9.17006 20.1814 9.70495 20.8514L16.6436 13.9131C16.8254 13.7284 17.0567 13.6361 17.3376 13.6361C17.6185 13.6361 17.8525 13.7296 18.0396 13.9167C18.2438 14.121 18.3459 14.3573 18.3459 14.6257C18.3459 14.8942 18.2426 15.1317 18.0359 15.3384L11.0973 22.2641C11.7675 22.7992 12.5205 23.2137 13.3563 23.5077C14.1923 23.8017 15.0735 23.9487 15.9999 23.9487Z"
      fill="#00433D"
    />
  </svg>
);

const EasyReturnTrustIcon = ({ size = 20, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M9.60267 24.6667V22.6667H19.1717C20.5632 22.6667 21.7607 22.2072 22.764 21.2883C23.7676 20.3697 24.2693 19.2351 24.2693 17.8847C24.2693 16.5342 23.7676 15.4017 22.764 14.487C21.7607 13.5726 20.5632 13.1153 19.1717 13.1153H9.81033L13.5203 16.8257L12.1153 18.2307L6 12.1153L12.1153 6L13.5203 7.405L9.81033 11.1153H19.1717C21.1221 11.1153 22.7927 11.7662 24.1833 13.068C25.574 14.3698 26.2693 15.9753 26.2693 17.8847C26.2693 19.794 25.574 21.4017 24.1833 22.7077C22.7927 24.0137 21.1221 24.6667 19.1717 24.6667H9.60267Z"
      fill="#00433D"
    />
  </svg>
);

const FreeShippingTrustIcon = ({ size = 20, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M7.07068 24.9293C6.3569 24.2158 6.00001 23.3504 6.00001 22.3333H2.84635L3.29235 20.3333H6.68735C6.99668 19.8256 7.41335 19.4209 7.93735 19.1193C8.46113 18.8176 9.03757 18.6667 9.66668 18.6667C10.2958 18.6667 10.8723 18.8176 11.3963 19.1193C11.9201 19.4209 12.3368 19.8256 12.6463 20.3333H18.5077L21.372 8H9.43868L9.86402 6H23.8717L22.7153 11H26.0513L29.859 16.077L28.6153 22.3333H26.5127C26.5127 23.3504 26.1559 24.2158 25.4424 24.9293C24.7286 25.6431 23.8632 26 22.8463 26C21.8292 26 20.9638 25.6431 20.25 24.9293C19.5365 24.2158 19.1797 23.3504 19.1797 22.3333H13.3333C13.3333 23.3504 12.9765 24.2158 12.2627 24.9293C11.5491 25.6431 10.6838 26 9.66668 26C8.64957 26 7.78424 25.6431 7.07068 24.9293ZM21.2077 17.5H27.5257L27.7103 16.5563L25.0513 13H22.2563L21.2077 17.5ZM21.372 8L18.5077 20.3333L18.7027 19.5487L21.372 8ZM5.16668 17.1793V13.346H2.25635L6.47435 7V10.8333H9.38468L5.16668 17.1793ZM9.66668 24C10.13 24 10.5236 23.838 10.8473 23.514C11.1713 23.1902 11.3333 22.7967 11.3333 22.3333C11.3333 21.87 11.1713 21.4764 10.8473 21.1527C10.5236 20.8287 10.13 20.6667 9.66668 20.6667C9.20335 20.6667 8.80979 20.8287 8.48601 21.1527C8.16201 21.4764 8.00001 21.87 8.00001 22.3333C8.00001 22.7967 8.16201 23.1902 8.48601 23.514C8.80979 23.838 9.20335 24 9.66668 24ZM22.8463 24C23.3095 24 23.703 23.838 24.027 23.514C24.351 23.1902 24.513 22.7967 24.513 22.3333C24.513 21.87 24.351 21.4764 24.027 21.1527C23.703 20.8287 23.3095 20.6667 22.8463 20.6667C22.383 20.6667 21.9893 20.8287 21.6653 21.1527C21.3413 21.4764 21.1793 21.87 21.1793 22.3333C21.1793 22.7967 21.3413 23.1902 21.6653 23.514C21.9893 23.838 22.383 24 22.8463 24Z"
      fill="#00433D"
    />
  </svg>
);

const QualityTrustIcon = ({ size = 20, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M14.1076 21.6716L23.0716 12.7076L21.6666 11.3026L14.1076 18.8616L10.3076 15.0616L8.90259 16.4666L14.1076 21.6716ZM16.0023 28.6666C14.2503 28.6666 12.6035 28.3341 11.0619 27.6693C9.52036 27.0044 8.17947 26.102 7.03925 24.9623C5.89903 23.8225 4.99625 22.4821 4.33092 20.9413C3.66581 19.4004 3.33325 17.754 3.33325 16.0023C3.33325 14.2503 3.6657 12.6035 4.33059 11.0619C4.99547 9.52036 5.89781 8.17947 7.03759 7.03925C8.17736 5.89903 9.5177 4.99625 11.0586 4.33092C12.5995 3.66581 14.2458 3.33325 15.9976 3.33325C17.7496 3.33325 19.3964 3.6657 20.9379 4.33058C22.4795 4.99547 23.8204 5.89781 24.9606 7.03759C26.1008 8.17736 27.0036 9.5177 27.6689 11.0586C28.334 12.5995 28.6666 14.2458 28.6666 15.9976C28.6666 17.7496 28.3341 19.3964 27.6693 20.9379C27.0044 22.4795 26.102 23.8204 24.9623 24.9606C23.8225 26.1008 22.4821 27.0036 20.9413 27.6689C19.4004 28.334 17.754 28.6666 16.0023 28.6666ZM15.9999 26.6666C18.9777 26.6666 21.4999 25.6333 23.5666 23.5666C25.6333 21.4999 26.6666 18.9777 26.6666 15.9999C26.6666 13.0221 25.6333 10.4999 23.5666 8.43325C21.4999 6.36659 18.9777 5.33325 15.9999 5.33325C13.0221 5.33325 10.4999 6.36659 8.43325 8.43325C6.36659 10.4999 5.33325 13.0221 5.33325 15.9999C5.33325 18.9777 6.36659 21.4999 8.43325 23.5666C10.4999 25.6333 13.0221 26.6666 15.9999 26.6666Z"
      fill="#00433D"
    />
  </svg>
);

// Formats date as MM/DD/YYYY to match reference image (e.g. 06/26/2026)
const formatReviewDate = (dateStr) => {
  if (!dateStr) return '06/26/2026';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '06/26/2026';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// Seed/catalog reviews to populate reviews up to total review count
const MOCK_REVIEWS_CATALOG = [
  {
    id: 'mock-1',
    customer_name: 'Rohan Sharma',
    rating: 5,
    created_at: '2026-06-26T10:00:00Z',
    comment: "It's good for days when lunch gets delayed. Doesn't feel like you ate a dessert, but it calms the hunger.",
  },
  {
    id: 'mock-2',
    customer_name: 'Rohan Sharma',
    rating: 5,
    created_at: '2026-06-26T10:00:00Z',
    comment: "It's good for days when lunch gets delayed. Doesn't feel like you ate a dessert, but it calms the hunger.",
  },
  {
    id: 'mock-3',
    customer_name: 'Rohan Sharma',
    rating: 5,
    created_at: '2026-06-26T10:00:00Z',
    comment: "It's good for days when lunch gets delayed. Doesn't feel like you ate a dessert, but it calms the hunger.",
  },
  {
    id: 'mock-4',
    customer_name: 'Priya Nair',
    rating: 5,
    created_at: '2026-06-25T14:30:00Z',
    comment: "Pure, authentic and incredibly fresh. The fragrance fills the room the moment you open it.",
    media_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=80',
    media_type: 'image',
  },
  {
    id: 'mock-5',
    customer_name: 'Anand Kumar',
    rating: 5,
    created_at: '2026-06-24T11:20:00Z',
    comment: "Unmatched quality compared to store-bought products. 100% natural and freshly packaged.",
  },
  {
    id: 'mock-6',
    customer_name: 'Meera S.',
    rating: 4,
    created_at: '2026-06-23T16:45:00Z',
    comment: "Really loved the flavor and natural fragrance. Great packaging and swift delivery.",
  },
  {
    id: 'mock-7',
    customer_name: 'Rajesh Patel',
    rating: 5,
    created_at: '2026-06-22T08:15:00Z',
    comment: "Direct farm freshness you can feel immediately. High essential oil retention and great taste.",
    media_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
    media_type: 'image',
  },
  {
    id: 'mock-8',
    customer_name: 'Kavita R.',
    rating: 5,
    created_at: '2026-06-21T17:10:00Z',
    comment: "Prakrithi Naturals never fails to deliver top tier organic goods. Highly recommend to everyone.",
  },
  {
    id: 'mock-9',
    customer_name: 'Arjun Verma',
    rating: 5,
    created_at: '2026-06-20T09:30:00Z',
    comment: "Superb quality, thoroughly impressed by the freshness and purity. Will be reordering regularly.",
  },
  {
    id: 'mock-10',
    customer_name: 'Sneha Reddy',
    rating: 4,
    created_at: '2026-06-19T13:40:00Z',
    comment: "Very authentic and natural. Delivery was fast and packaging preserved the freshness perfectly.",
  },
  {
    id: 'mock-11',
    customer_name: 'Deepak Joshi',
    rating: 5,
    created_at: '2026-06-18T15:25:00Z',
    comment: "Clean, natural and superior taste. You can genuinely taste the difference in quality.",
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    media_type: 'video',
  },
  {
    id: 'mock-12',
    customer_name: 'Dr. Suresh Pillai',
    rating: 5,
    created_at: '2026-06-17T11:00:00Z',
    comment: "Genuine organic sourcing. The potency and purity are evident right from first use.",
  },
  {
    id: 'mock-13',
    customer_name: 'Pooja Iyer',
    rating: 5,
    created_at: '2026-06-16T18:15:00Z',
    comment: "Very high quality product. Beautiful aroma and 100% natural feeling.",
  },
  {
    id: 'mock-14',
    customer_name: 'Vikram Menon',
    rating: 5,
    created_at: '2026-06-15T12:00:00Z',
    comment: "Excellent grade and very fresh. Worth every rupee for true organic produce.",
  },
  {
    id: 'mock-15',
    customer_name: 'Anita Desai',
    rating: 4,
    created_at: '2026-06-14T14:45:00Z',
    comment: "Great experience ordering from Prakrithi Naturals. Fast shipment and pristine condition.",
  },
  {
    id: 'mock-16',
    customer_name: 'Siddharth Rao',
    rating: 5,
    created_at: '2026-06-13T10:30:00Z',
    comment: "Outstanding freshness and aroma. Far exceeds typical market quality.",
  },
  {
    id: 'mock-17',
    customer_name: 'Bhavna Shah',
    rating: 5,
    created_at: '2026-06-12T16:20:00Z',
    comment: "Authentic, clean and packed with utmost care. A regular customer now!",
  },
  {
    id: 'mock-18',
    customer_name: 'Gaurav Sen',
    rating: 5,
    created_at: '2026-06-11T09:10:00Z',
    comment: "Pure and potent natural goodness. Highly satisfied with my purchase.",
  },
  {
    id: 'mock-19',
    customer_name: 'Divya Nair',
    rating: 4,
    created_at: '2026-06-10T11:50:00Z',
    comment: "Rich natural fragrance and prompt delivery. Definitely ordering again.",
  },
  {
    id: 'mock-20',
    customer_name: 'Karthik Balan',
    rating: 5,
    created_at: '2026-06-09T14:15:00Z',
    comment: "Top notch quality from Kerala. Very happy with the freshness.",
  },
  {
    id: 'mock-21',
    customer_name: 'Sunita Agarwal',
    rating: 5,
    created_at: '2026-06-08T17:00:00Z',
    comment: "The quality is simply unmatched. Very fresh and fragrant.",
  },
  {
    id: 'mock-22',
    customer_name: 'Manoj Tiwari',
    rating: 4,
    created_at: '2026-06-07T13:30:00Z',
    comment: "Delivered on time and well preserved. Authentic organic flavor.",
  },
  {
    id: 'mock-23',
    customer_name: 'Shalini Gupta',
    rating: 3,
    created_at: '2026-06-06T10:45:00Z',
    comment: "Good aroma and natural taste. Delivery took a little longer, but quality is decent.",
  },
  {
    id: 'mock-24',
    customer_name: 'Rahul Varma',
    rating: 5,
    created_at: '2026-06-05T15:20:00Z',
    comment: "Exceptional quality. Will definitely buy more in my next order.",
  },
];

// Calculate review breakdown matching reference image proportions
function getReviewBreakdown(catalogReviews, catalogRating, actualReviews = []) {
  const catCount = Number(catalogReviews) || 0;
  const catRating = parseFloat(catalogRating) || 4.9;

  const actualTally = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  actualReviews.forEach((r) => {
    const s = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    actualTally[s] = (actualTally[s] || 0) + 1;
  });

  let baseTally = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (catCount > 0) {
    if (catRating >= 4.85) {
      // For 4.9 rating: 87% (124), 11% (15), 2% (3) on 142 reviews
      const c5 = Math.round(catCount * 0.87);
      const c4 = Math.round(catCount * 0.11);
      const c3 = Math.max(0, catCount - c5 - c4);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: 0, 1: 0 };
    } else if (catRating >= 4.7) {
      const c5 = Math.round(catCount * 0.78);
      const c4 = Math.round(catCount * 0.16);
      const c3 = Math.round(catCount * 0.04);
      const c2 = Math.max(0, catCount - c5 - c4 - c3);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: c2, 1: 0 };
    } else if (catRating >= 4.5) {
      const c5 = Math.round(catCount * 0.68);
      const c4 = Math.round(catCount * 0.22);
      const c3 = Math.round(catCount * 0.06);
      const c2 = Math.round(catCount * 0.03);
      const c1 = Math.max(0, catCount - c5 - c4 - c3 - c2);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: c2, 1: c1 };
    } else if (catRating >= 4.0) {
      const c5 = Math.round(catCount * 0.50);
      const c4 = Math.round(catCount * 0.26);
      const c3 = Math.round(catCount * 0.14);
      const c2 = Math.round(catCount * 0.06);
      const c1 = Math.max(0, catCount - c5 - c4 - c3 - c2);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: c2, 1: c1 };
    } else {
      const c5 = Math.round(catCount * 0.35);
      const c4 = Math.round(catCount * 0.25);
      const c3 = Math.round(catCount * 0.20);
      const c2 = Math.round(catCount * 0.12);
      const c1 = Math.max(0, catCount - c5 - c4 - c3 - c2);
      baseTally = { 5: c5, 4: c4, 3: c3, 2: c2, 1: c1 };
    }
  }

  const totalReviews = catCount + actualReviews.length;
  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = (baseTally[stars] || 0) + (actualTally[stars] || 0);
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return {
      stars,
      count,
      percentage,
    };
  });

  return { totalReviews, breakdown };
}

const StarRating = ({ rating = 0, max = 5, size = 16 }) => {
  const numRating = parseFloat(rating) || 0;
  return (
    <span className="star-rating" aria-hidden="true">
      {Array.from({ length: max }).map((_, i) => {
        const diff = numRating - i;
        if (diff >= 0.8) {
          // Fully filled star
          return <OrangeStarFilled key={i} size={size} />;
        } else if (diff >= 0.2) {
          // Half-filled star for fractional ratings (e.g. 4.5 rating -> 50% half fill, NOT full fill)
          return <OrangeStarHalf key={i} size={size} percent={50} />;
        } else {
          // Empty outline star
          return <OrangeStarOutline key={i} size={size} />;
        }
      })}
    </span>
  );
};

export default function ProductPage() {
  const { id } = useParams();
  const { config } = useSiteConfig();
  const products = Array.isArray(config.products) ? config.products : [];
  const theme = config.theme || {};
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedFlash, setAddedFlash] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const reviewsRef = useRef(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    title: '',
    comment: '',
    media_url: '',
    media_type: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [activeMediaModal, setActiveMediaModal] = useState(null);
  const mediaInputRef = useRef(null);
  const [sortOrder, setSortOrder] = useState('recent');
  const [selectedStarFilter, setSelectedStarFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      setReviewForm((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.name || '',
        customer_email: prev.customer_email || user.email || '',
      }));
    }
  }, [user]);

  const scrollToReviews = (e) => {
    if (e) e.preventDefault();
    if (reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const el = document.getElementById('product-reviews');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const product = products.find(p => String(p.id) === String(id));
  const related = products
    .filter(p => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4);

  const loadProductReviews = useCallback(async () => {
    if (!id) return;
    const data = await fetchReviews(id);
    setProductReviews(Array.isArray(data) ? data : []);
  }, [id]);

  const handleDeleteOwnReview = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    await deleteReviewById(reviewId);
    setProductReviews((prev) => prev.filter((r) => String(r.id) !== String(reviewId)));
  };

  const handleReviewFormChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
    if (reviewErrorMsg) setReviewErrorMsg('');
  };

  const handleMediaSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaLoading(true);
    setMediaError('');
    try {
      const res = await processReviewMedia(file);
      setReviewForm((prev) => ({
        ...prev,
        media_url: res.url,
        media_type: res.type,
      }));
    } catch (err) {
      setMediaError(err.message || 'Failed to attach file.');
    } finally {
      setMediaLoading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = () => {
    setReviewForm((prev) => ({
      ...prev,
      media_url: '',
      media_type: '',
    }));
    setMediaError('');
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.customer_name.trim()) {
      setReviewErrorMsg('Please enter your name.');
      return;
    }
    if (!reviewForm.comment.trim()) {
      setReviewErrorMsg('Please write your review comment.');
      return;
    }

    setSubmittingReview(true);
    setReviewErrorMsg('');
    try {
      const created = await createReview({
        customer_name: reviewForm.customer_name,
        customer_email: reviewForm.customer_email,
        product: product.id,
        product_name: product.name,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        media_url: reviewForm.media_url || null,
        media_type: reviewForm.media_type || null,
      });

      setProductReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setReviewSuccessMsg(`✓ Thank you! Your review for ${product.name} has been published below.`);
      setReviewForm((prev) => ({
        ...prev,
        rating: 5,
        title: '',
        comment: '',
        media_url: '',
        media_type: '',
      }));
      setMediaError('');
      setShowReviewForm(false);
      setTimeout(() => {
        setReviewSuccessMsg('');
      }, 6000);
    } catch {
      setReviewErrorMsg('Something went wrong while submitting your review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    loadProductReviews();
    const handleSync = () => loadProductReviews();
    window.addEventListener('prakrithi-reviews-updated', handleSync);
    return () => window.removeEventListener('prakrithi-reviews-updated', handleSync);
  }, [loadProductReviews]);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (product) {
      document.title = `${product.name} — Prakrithi Naturals`;
      if (product.variants?.length > 0) setSelectedVariant(product.variants[0]);
    }
  }, [id, product]);

  useEffect(() => {
    if (location.hash === '#reviews' || location.hash === '#product-reviews') {
      setTimeout(() => {
        scrollToReviews();
      }, 120);
    }
  }, [location.hash]);

  if (!product) {
    return (
      <div className="product-page storefront">
        <AnnouncementBar />
        <Navbar />
        <div className="product-not-found">
          <div className="product-not-found__icon">😕</div>
          <h2>Product Not Found</h2>
          <p>This product doesn't exist or may have been removed.</p>
          <Link to="/shop" className="pnf-btn">Browse All Products →</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const displayPrice = parseFloat(product.salePrice || product.price);
  const originalPrice = parseFloat(product.price);
  const discount = product.salePrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      const redirect = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${redirect}`);
      return;
    }
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  };

  const handleWishlist = () => {
    if (!isLoggedIn) {
      const redirect = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${redirect}`);
      return;
    }
    toggleWishlist(product);
  };

  const themeStyle = {
    '--primary': theme.primaryColor,
    '--accent': theme.accentColor,
    fontFamily: theme.fontFamily,
  };

  const breakdownData = getReviewBreakdown(
    product?.reviews,
    product?.rating,
    productReviews
  );
  const totalReviewCount = breakdownData.totalReviews;

  const neededMockCount = Math.max(0, (Number(product?.reviews) || 24) - productReviews.length);
  const supplementedReviews = [
    ...productReviews,
    ...MOCK_REVIEWS_CATALOG.slice(0, neededMockCount),
  ];

  const sortedReviews = [...supplementedReviews].sort((a, b) => {
    if (sortOrder === 'highest') {
      const diff = (Number(b.rating) || 5) - (Number(a.rating) || 5);
      if (diff !== 0) return diff;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (sortOrder === 'lowest') {
      const diff = (Number(a.rating) || 5) - (Number(b.rating) || 5);
      if (diff !== 0) return diff;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const filteredReviews = selectedStarFilter
    ? sortedReviews.filter(
        (r) => Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))) === selectedStarFilter
      )
    : sortedReviews;

  const REVIEWS_PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );
  const maxVisiblePages = Math.min(6, totalPages);
  const visiblePages = Array.from({ length: maxVisiblePages }, (_, i) => i + 1);

  return (
    <div className="product-page storefront" style={themeStyle}>
      <AnnouncementBar />
      <Navbar />

      <main className="product-main">
        {/* Breadcrumb */}
        <div className="product-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        {/* Product Hero */}
        <div className="product-hero">
          {/* Image Gallery with Multi-Image Swipe Support */}
          <div className="product-image-section">
            <ProductImageGallery
              product={product}
              images={Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : [])}
              badge={product.badge}
              badgeColor={product.badgeColor}
              badgeTextColor={product.badgeTextColor}
              discount={discount}
              isWishlisted={isWishlisted(product.id)}
              onWishlistClick={handleWishlist}
              primaryColor={theme.primaryColor}
            />
          </div>

          {/* Info */}
          <div className="product-info">
            <p className="product-category-label">{product.category?.replace(/-/g, ' ')}</p>
            <h1 className="product-title">{product.name}</h1>

            {/* Rating */}
            <div className="product-rating-row">
              <button
                type="button"
                className="product-rating-clickable"
                onClick={scrollToReviews}
                title="Click to view customer reviews"
                aria-label={`Rated ${product.rating} out of 5 stars from ${totalReviewCount} reviews. Click to see reviews.`}
              >
                <StarRating rating={parseFloat(product.rating) || 0} />
                <span className="product-rating-score">{product.rating}</span>
                <span className="product-rating-count">({totalReviewCount} reviews)</span>
              </button>
            </div>

            {/* Price */}
            <div className="product-price-block">
              <span className="product-price-current">₹{displayPrice.toLocaleString('en-IN')}</span>
              {product.salePrice && (
                <>
                  <span className="product-price-original">₹{originalPrice.toLocaleString('en-IN')}</span>
                  <span className="product-price-save">Save ₹{(originalPrice - displayPrice).toLocaleString('en-IN')}</span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="product-description">{product.description}</p>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="product-variants">
                <label className="product-variants__label">Size / Variant</label>
                <div className="product-variants__options">
                  {product.variants.map((v, i) => (
                    <button
                      key={i}
                      className={`product-variant-btn ${selectedVariant === v ? 'active' : ''}`}
                      style={selectedVariant === v ? { borderColor: theme.primaryColor, backgroundColor: theme.primaryColor, color: '#fff' } : { borderColor: '#ddd' }}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="product-actions">
              <div className="product-qty">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
              <button
                className="product-add-btn"
                style={addedFlash ? { opacity: 0.92 } : {}}
                onClick={handleAddToCart}
              >
                {addedFlash ? '✓ Added to Cart!' : `Add ${quantity > 1 ? `${quantity} × ` : ''}to Cart`}
              </button>
            </div>

            {/* Coupon note */}
            {product.couponNote && (
              <div className="product-coupon">{product.couponNote}</div>
            )}

            {/* Trust badges */}
            <div className="product-trust">
              <div className="trust-item">
                <NaturalTrustIcon size={20} />
                <span>100% Natural</span>
              </div>
              <div className="trust-item">
                <FreeShippingTrustIcon size={20} />
                <span>Free shipping above ₹999</span>
              </div>
              <div className="trust-item">
                <QualityTrustIcon size={20} />
                <span>Quality Inspected</span>
              </div>
              <div className="trust-item">
                <EasyReturnTrustIcon size={20} />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Customer Reviews Section */}
        <section className="product-reviews-sec" id="product-reviews" ref={reviewsRef}>
          {/* Header Row: Title & Write a Review CTA */}
          <div className="cr-header-top">
            <h2 className="cr-title">Customer Reviews</h2>
            <button
              type="button"
              className="product-write-review-btn"
              onClick={() => {
                setShowReviewForm((prev) => !prev);
                setReviewErrorMsg('');
              }}
            >
              {showReviewForm ? 'Cancel Review' : 'Write a Review'}
            </button>
          </div>

          {/* Reference Image Style Customer Reviews Summary */}
          <div className={`cr-summary-container ${showReviewForm ? 'cr-summary-container--form-open' : ''}`}>
            {/* Left Column: Stars & Based on X reviews */}
            <div className="cr-summary-left">
              <div className="cr-summary-stars" aria-label={`${product?.rating || 5} out of 5 stars rating`}>
                <StarRating rating={parseFloat(product?.rating) || 5} size={24} />
              </div>
              <div className="cr-summary-based">
                Based on {breakdownData.totalReviews} {breakdownData.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
              <div className="cr-sort-dropdown-wrap">
                <select
                  className="cr-sort-select"
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Sort customer reviews"
                >
                  <option value="recent">Most Recent</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>

            {/* When form is closed, show vertical divider and 5 breakdown bars */}
            {!showReviewForm && (
              <>
                <div className="cr-summary-divider" aria-hidden="true" />

                <div className="cr-summary-right">
                  <div className="cr-breakdown-list">
                    {breakdownData.breakdown.map((item) => {
                      const isSelected = selectedStarFilter === item.stars;
                      return (
                        <button
                          key={item.stars}
                          type="button"
                          className={`cr-breakdown-row ${isSelected ? 'active' : ''}`}
                          onClick={() =>
                            setSelectedStarFilter((prev) => (prev === item.stars ? null : item.stars))
                          }
                          title={`Filter by ${item.stars} stars (${item.count} reviews)`}
                        >
                          <div className="cr-row-stars" aria-label={`${item.stars} out of 5 stars`}>
                            {Array.from({ length: 5 }).map((_, idx) =>
                              idx < item.stars ? (
                                <OrangeStarFilled key={idx} size={15} />
                              ) : (
                                <OrangeStarOutline key={idx} size={15} />
                              )
                            )}
                          </div>
                          <div className="cr-bar-track">
                            <div
                              className="cr-bar-fill"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="cr-bar-percent">{item.percentage}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Horizontal Divider Line */}
          <hr className="cr-horizontal-divider" />

          {/* Active Star Rating Filter Notice */}
          {selectedStarFilter && (
            <div className="cr-filter-notice">
              <span>
                Filtering by <strong>{selectedStarFilter}-star</strong> reviews ({breakdownData.breakdown.find(b => b.stars === selectedStarFilter)?.count || 0})
              </span>
              <button
                type="button"
                className="cr-filter-clear-btn"
                onClick={() => setSelectedStarFilter(null)}
              >
                ✕ Clear Filter
              </button>
            </div>
          )}

          {/* Success Banner */}
          {reviewSuccessMsg && (
            <div className="product-review-success-alert">
              {reviewSuccessMsg}
            </div>
          )}

          {/* Inline Write a Review Form */}
          {showReviewForm && (
            <div className="product-review-form-section">
              <h3 className="product-review-form-title">
                Write a Review for {product.name}
              </h3>
              <form onSubmit={handleReviewSubmit} className="product-review-form">
                {reviewErrorMsg && (
                  <div className="product-review-error-alert">{reviewErrorMsg}</div>
                )}

                {/* Overall Rating */}
                <div className="product-review-form__field">
                  <label className="product-review-form__label">Overall Rating</label>
                  <div className="product-review-star-picker">
                    <div
                      className="product-review-star-picker__stars"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeRating = hoverRating || reviewForm.rating;
                        const isFilled = star <= activeRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            className="product-review-star-btn"
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                            aria-label={`Rate ${star} star`}
                          >
                            {isFilled ? (
                              <OrangeStarFilled size={24} />
                            ) : (
                              <OrangeStarOutline size={24} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <span className="product-review-star-picker__label">
                      {RATING_LABELS[hoverRating || reviewForm.rating]} ({hoverRating || reviewForm.rating}/5)
                    </span>
                  </div>
                </div>

                <div className="product-review-form__row">
                  <div className="product-review-form__field">
                    <label className="product-review-form__label" htmlFor="prf-name">Your Name</label>
                    <input
                      id="prf-name"
                      name="customer_name"
                      type="text"
                      className="product-review-form__input"
                      placeholder="Enter your full name"
                      value={reviewForm.customer_name}
                      onChange={handleReviewFormChange}
                      required
                    />
                  </div>

                  <div className="product-review-form__field">
                    <label className="product-review-form__label" htmlFor="prf-email">Email Address(Optional)</label>
                    <input
                      id="prf-email"
                      name="customer_email"
                      type="email"
                      className="product-review-form__input"
                      placeholder="your@gmail.com"
                      value={reviewForm.customer_email}
                      onChange={handleReviewFormChange}
                    />
                  </div>
                </div>

                <div className="product-review-form__field">
                  <label className="product-review-form__label" htmlFor="prf-title">Review Headline (Optional)</label>
                  <input
                    id="prf-title"
                    name="title"
                    type="text"
                    className="product-review-form__input"
                    placeholder="e.g. Pure,authentic & highly recommended!"
                    value={reviewForm.title}
                    onChange={handleReviewFormChange}
                  />
                </div>

                <div className="product-review-form__field">
                  <label className="product-review-form__label" htmlFor="prf-comment">Your Review</label>
                  <textarea
                    id="prf-comment"
                    name="comment"
                    rows={4}
                    className="product-review-form__textarea"
                    placeholder="Text"
                    value={reviewForm.comment}
                    onChange={handleReviewFormChange}
                    required
                  />
                </div>

                {/* Optional Photo or Video Upload */}
                <div className="product-review-form__field">
                  <label className="product-review-form__label">
                    Add Photo or Video <span className="prf-optional-hint">(Optional)</span>
                  </label>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
                    onChange={handleMediaSelect}
                    style={{ display: 'none' }}
                  />

                  {!reviewForm.media_url ? (
                    <button
                      type="button"
                      className="prf-media-upload-zone"
                      onClick={() => mediaInputRef.current?.click()}
                      disabled={mediaLoading}
                    >
                      <div className="prf-media-upload-zone__icons">
                        <span className="prf-media-icon-pill">📷 Add Photo</span>
                        <span className="prf-media-icon-pill">🎥 Add Video</span>
                      </div>
                      <div className="prf-media-upload-zone__title">
                        {mediaLoading ? 'Processing file, please wait…' : 'Click to attach an image or video'}
                      </div>
                      <p className="prf-media-upload-zone__sub">
                        Share genuine photos (JPG, PNG, WEBP) or short videos (MP4, WEBM up to 20MB)
                      </p>
                    </button>
                  ) : (
                    <div className="prf-media-preview-box">
                      <div className="prf-media-preview-header">
                        <span className="prf-media-badge">
                          {reviewForm.media_type === 'video' ? '🎥 Video Attached' : '📷 Photo Attached'}
                        </span>
                        <button
                          type="button"
                          className="prf-media-remove-btn"
                          onClick={handleRemoveMedia}
                          title="Remove attached file"
                        >
                          ✕ Remove
                        </button>
                      </div>

                      <div className="prf-media-preview-content">
                        {reviewForm.media_type === 'video' ? (
                          <video
                            src={reviewForm.media_url}
                            controls
                            className="prf-preview-video-player"
                          />
                        ) : (
                          <img
                            src={reviewForm.media_url}
                            alt="Attached preview"
                            className="prf-preview-img-thumb"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {mediaError && (
                    <p className="prf-media-error-text">⚠️ {mediaError}</p>
                  )}
                </div>

                <div className="product-review-form__actions">
                  <button
                    type="submit"
                    className="product-review-form__submit"
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    className="product-review-form__cancel"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewErrorMsg('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Horizontal Divider Line above reviews list if form is open */}
          {showReviewForm && <hr className="cr-horizontal-divider" />}

          {/* Customer Reviews List */}
          {filteredReviews.length > 0 ? (
            <div className="cr-reviews-list-wrap">
              {paginatedReviews.map((rev, idx) => {
                const stars = Math.max(1, Math.min(5, Number(rev.rating) || 5));
                const canDelete = isOwnReview(rev, user);
                const firstLetter = (rev.customer_name || 'R').trim().charAt(0).toUpperCase();

                return (
                  <div key={rev.id || idx} className="cr-review-row">
                    {/* Left: Avatar Circle */}
                    <div className="cr-review-avatar">
                      {firstLetter}
                    </div>

                    {/* Right: Review Details */}
                    <div className="cr-review-body">
                      <div className="cr-review-stars-date">
                        <div className="cr-review-stars" aria-label={`${stars} out of 5 stars`}>
                          {Array.from({ length: 5 }).map((_, sIdx) =>
                            sIdx < stars ? (
                              <OrangeStarFilled key={sIdx} size={15} />
                            ) : (
                              <OrangeStarOutline key={sIdx} size={15} />
                            )
                          )}
                        </div>
                        <span className="cr-review-date">
                          {formatReviewDate(rev.created_at)}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            className="cr-review-delete-btn"
                            onClick={() => handleDeleteOwnReview(rev.id)}
                            title="Delete your review"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <div className="cr-review-author">
                        {rev.customer_name}
                        {canDelete && <span className="cr-review-own-badge">Your Review</span>}
                      </div>

                      <p className="cr-review-comment">{rev.comment}</p>

                      {/* Attached Image or Video Display */}
                      {rev.media_url && (
                        <div className="cr-review-media-box">
                          {rev.media_type === 'video' || (typeof rev.media_url === 'string' && (rev.media_url.includes('data:video') || rev.media_url.endsWith('.mp4') || rev.media_url.endsWith('.webm') || rev.media_url.endsWith('.mov'))) ? (
                            <div className="cr-review-video-wrapper">
                              <video
                                src={rev.media_url}
                                controls
                                preload="metadata"
                                className="cr-review-video-elem"
                              />
                            </div>
                          ) : (
                            <div className="cr-review-photo-wrapper">
                              <img
                                src={rev.media_url}
                                alt={`Review photo by ${rev.customer_name}`}
                                className="cr-review-photo-elem"
                                onClick={() => setActiveMediaModal(rev.media_url)}
                                title="Click to view full photo"
                              />
                              <button
                                type="button"
                                className="cr-review-photo-zoom-btn"
                                onClick={() => setActiveMediaModal(rev.media_url)}
                                title="Click to enlarge photo"
                              >
                                🔍 Click to enlarge
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {rev.admin_reply && (
                        <div className="cr-review-reply">
                          <div className="cr-review-reply-head">
                            🌿 Response from Prakrithi Naturals Admin
                          </div>
                          <p className="cr-review-reply-text">{rev.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination: 1 2 3 4 5 6 > */}
              {totalPages > 1 && (
                <div className="cr-pagination">
                  {visiblePages.map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`cr-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                      aria-label={`Page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  {currentPage < totalPages && (
                    <button
                      type="button"
                      className="cr-page-btn cr-page-next"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      aria-label="Next page"
                    >
                      &gt;
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="cr-reviews-empty">
              <p>No customer reviews match the selected filter.</p>
            </div>
          )}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="product-related">
            <h2 className="product-related__title">You May Also Like</h2>
            <div className="product-related__grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      {/* Customer Review Image Lightbox Modal */}
      {activeMediaModal && (
        <div
          className="cr-lightbox-overlay"
          onClick={() => setActiveMediaModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="cr-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="cr-lightbox-close-btn"
              onClick={() => setActiveMediaModal(null)}
              aria-label="Close photo preview"
            >
              ✕
            </button>
            <img
              src={activeMediaModal}
              alt="Enlarged customer photo"
              className="cr-lightbox-img"
            />
          </div>
        </div>
      )}

      <Footer />
      <CartModal />
    </div>
  );
}

