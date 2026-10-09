import { useId } from 'react';

/**
 * ProductLikeIcon component:
 * - Before user liked (unliked): circular white badge with gradient (#E8E8E8 -> #C8C8C8) heart
 * - After like (liked): circular white badge with vibrant red (#F41E3E) heart
 */
export default function ProductLikeIcon({ isLiked = false, size = 30, className = '' }) {
  const rawId = useId();
  const gradId = `paint0_linear_${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const combinedClass = `product-like-icon ${className}`.trim();

  if (isLiked) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="4 5 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={combinedClass}
      >
        <rect x="4" y="5" width="28" height="28" rx="14" fill="white" />
        <path
          d="M18 28L16.9543 27.0757C15.3839 25.6749 14.0852 24.4712 13.0583 23.4646C12.0313 22.4578 11.2176 21.5618 10.6169 20.7765C10.0163 19.9914 9.59668 19.2752 9.35811 18.6278C9.11937 17.9806 9 17.3238 9 16.6575C9 15.3355 9.45332 14.2287 10.3599 13.3372C11.2667 12.4457 12.3924 12 13.7368 12C14.5639 12 15.3455 12.1902 16.0816 12.5705C16.8177 12.9509 17.4572 13.4964 18 14.2069C18.5428 13.4964 19.1823 12.9509 19.9184 12.5705C20.6545 12.1902 21.4361 12 22.2632 12C23.6076 12 24.7333 12.4457 25.6401 13.3372C26.5467 14.2287 27 15.3355 27 16.6575C27 17.3238 26.8806 17.9806 26.6419 18.6278C26.4033 19.2752 25.9837 19.9914 25.3831 20.7765C24.7824 21.5618 23.9702 22.4578 22.9462 23.4646C21.9224 24.4712 20.6222 25.6749 19.0457 27.0757L18 28Z"
          fill="#F41E3E"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="4 5 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={combinedClass}
    >
      <rect x="4" y="5" width="28" height="28" rx="14" fill="white" />
      <path
        d="M18 28L16.9543 27.0757C15.3839 25.6749 14.0852 24.4712 13.0583 23.4646C12.0313 22.4578 11.2176 21.5618 10.6169 20.7765C10.0163 19.9914 9.59668 19.2752 9.35811 18.6278C9.11937 17.9806 9 17.3238 9 16.6575C9 15.3355 9.45332 14.2287 10.3599 13.3372C11.2667 12.4457 12.3924 12 13.7368 12C14.5639 12 15.3455 12.1902 16.0816 12.5705C16.8177 12.9509 17.4572 13.4964 18 14.2069C18.5428 13.4964 19.1823 12.9509 19.9184 12.5705C20.6545 12.1902 21.4361 12 22.2632 12C23.6076 12 24.7333 12.4457 25.6401 13.3372C26.5467 14.2287 27 15.3355 27 16.6575C27 17.3238 26.8806 17.9806 26.6419 18.6278C26.4033 19.2752 25.9837 19.9914 25.3831 20.7765C24.7824 21.5618 23.9702 22.4578 22.9462 23.4646C21.9224 24.4712 20.6222 25.6749 19.0457 27.0757L18 28Z"
        fill={`url(#${gradId})`}
      />
      <defs>
        <linearGradient
          id={gradId}
          x1="18"
          y1="12"
          x2="18"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E8E8E8" />
          <stop offset="1" stopColor="#C8C8C8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
