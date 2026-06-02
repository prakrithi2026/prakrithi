import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = '404 — Page Not Found | Prakrithi Naturals';
  }, []);

  return (
    <div className="not-found">
      <div className="not-found__inner">
        <div className="not-found__leaf">🌿</div>
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Page Not Found</h2>
        <p className="not-found__subtitle">
          Oops! Looks like this page wandered off into the wild forests of Kerala.
        </p>
        <div className="not-found__actions">
          <Link to="/" className="not-found__btn not-found__btn--primary">
            🏠 Back to Home
          </Link>
          <Link to="/shop" className="not-found__btn not-found__btn--secondary">
            🛒 Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
