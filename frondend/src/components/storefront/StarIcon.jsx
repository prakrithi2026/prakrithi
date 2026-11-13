// Prakrithi Brand Green Star Icons (#004E38) using the clean 5-point star polygon
export const StarFilled = ({ size = 16, className = '', color = '#004E38' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    stroke={color}
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`prakrithi-star filled ${className}`}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const StarOutline = ({ size = 16, className = '', color = '#004E38' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`prakrithi-star outline ${className}`}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const StarHalf = ({ size = 16, className = '', color = '#004E38', percent = 50 }) => (
  <span
    className={`prakrithi-star half ${className}`}
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
    <StarOutline size={size} color={color} />
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
      <StarFilled size={size} color={color} />
    </span>
  </span>
);

// Backward-compatible aliases for existing imports
export const OrangeStarFilled = StarFilled;
export const OrangeStarOutline = StarOutline;
export const OrangeStarHalf = StarHalf;

export default StarFilled;
