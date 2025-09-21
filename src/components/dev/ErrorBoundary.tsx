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
        <pre style={{ padding: 16, whiteSpace: 'pre-wrap', background: '#fff5f5', color: '#7f1d1d' }}>
          {message}
        </pre>
      );
    }

    return this.props.children;
  }
}
