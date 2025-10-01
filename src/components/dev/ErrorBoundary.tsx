import React from 'react';

type ErrorBoundaryState = {
  err?: unknown;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { err: undefined };

  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    return { err };
  }

  componentDidCatch(err: unknown, info: unknown) {
    console.error('ErrorBoundary', err, info);
  }

  render() {
    if (this.state.err) {
      const message = this.state.err instanceof Error ? this.state.err.stack ?? this.state.err.message : String(this.state.err);
      return (
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: 'hsl(220, 30%, 5%)', 
          color: 'hsl(220, 10%, 95%)',
          padding: '2rem',
          fontFamily: 'monospace'
        }}>
          <div style={{
            maxWidth: '48rem',
            margin: '0 auto',
            backgroundColor: 'hsl(0, 75%, 60%, 0.1)',
            border: '1px solid hsl(0, 75%, 60%, 0.3)',
            borderRadius: '0.5rem',
            padding: '1.5rem'
          }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: 'hsl(0, 75%, 60%)',
              marginBottom: '1rem'
            }}>
              Application Error
            </h1>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '0.875rem',
              color: 'hsl(220, 10%, 95%)',
              overflowX: 'auto'
            }}>
              {message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'hsl(240, 100%, 70%)',
                color: 'hsl(220, 30%, 5%)',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
