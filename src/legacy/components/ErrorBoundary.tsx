/**
 * ErrorBoundary: catches React render errors, shows a friendly Boxy "oops" card.
 * Provides "Try again" and "Start fresh" buttons.
 */
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Boxy } from './Boxy';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleStartFresh = () => {
    // Clear session storage and reload
    try { sessionStorage.clear(); } catch {}
    window.location.hash = '#/drop';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: 'var(--space-xl)',
            gap: 'var(--space-lg)',
          }}
        >
          <Boxy mood="oops" tip="Something went wrong!" size={100} />
          <div
            className="sticker-card"
            style={{
              maxWidth: 400,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
            }}
          >
            <h2 style={{ fontSize: 'var(--text-lg)', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 }}>
              Oops, something broke
            </h2>
            <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--text-sm)' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="sticker-btn" onClick={this.handleRetry}>
                Try again
              </button>
              <button className="sticker-btn secondary" onClick={this.handleStartFresh}>
                Start fresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
