import { useState } from 'react';

export default function OptimizedImage({ src, alt, className, style, loading = 'lazy', ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className="opt-image-container" style={style}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        className={`opt-image ${isLoaded ? 'loaded' : ''} ${className || ''}`}
        {...props}
      />
      {!isLoaded && <div className="opt-image-skeleton" />}
    </div>
  );
}
