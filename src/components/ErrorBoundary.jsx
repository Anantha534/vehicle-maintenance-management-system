import React from 'react';

/**
 * ErrorBoundary catches unhandled React render errors and displays
 * a diagnostic message instead of a blank white page.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f4f3ef',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px'
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '640px',
            width: '100%',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            <h2 style={{ color: '#991b1b', fontWeight: 700, marginBottom: '12px', fontSize: '18px' }}>
              Application Error
            </h2>
            <p style={{ color: '#374151', fontSize: '13px', marginBottom: '16px' }}>
              A runtime error occurred. Please refresh the page or clear your browser cache.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '11px',
                color: '#7f1d1d',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  '\n\nComponent Stack:' + this.state.errorInfo.componentStack
                )}
              </pre>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('fleet_token');
                window.location.reload();
              }}
              style={{
                marginTop: '16px',
                padding: '8px 20px',
                background: '#1e3a2b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Session &amp; Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
