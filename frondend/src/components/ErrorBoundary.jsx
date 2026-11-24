import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    // Also store globally for easy debugging
    if (typeof window !== 'undefined') {
      window.__lastReactError = {
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
      };
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px',
          maxWidth: '800px',
          margin: '40px auto',
          background: '#fff1f2',
          border: '2px solid #f43f5e',
          borderRadius: '12px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#881337',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: '#be123c', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Application Error Caught
          </h2>
          <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 0', color: '#9f1239' }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          <pre style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #fecdd3',
            overflowX: 'auto',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: '#1f2937'
          }}>
            {this.state.error?.stack}
          </pre>
          {this.state.errorInfo?.componentStack && (
            <pre style={{
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              overflowX: 'auto',
              fontSize: '0.8rem',
              lineHeight: 1.4,
              color: '#475569',
              marginTop: '12px'
            }}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#004E38',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
