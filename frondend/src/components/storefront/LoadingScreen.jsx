import './LoadingScreen.css';

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-screen__inner">
        <div className="loading-logo">
          <div className="loading-leaf">🌿</div>
          <div className="loading-ring" />
        </div>
        <p className="loading-brand">Prakrithi Naturals</p>
        <p className="loading-sub">Loading your store...</p>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
