import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home, Copy } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
  children: ReactNode;
  fallbackType?: 'root' | 'route';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleCopyError = () => {
    if (this.state.error) {
      const errorText = `${this.state.error.toString()}\n${this.state.errorInfo?.componentStack || ''}`;
      navigator.clipboard.writeText(errorText);
      alert('Error details copied to clipboard');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.hash = '#/dashboard';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const content = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: this.props.fallbackType === 'root' ? '100vh' : '100%', padding: '32px', background: 'var(--color-canvas)', color: 'var(--color-ink)' }}>
          <Card style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--color-danger)' }}>
              <AlertTriangle size={32} />
              <h2 style={{ margin: 0, fontFamily: 'Fraunces, serif' }}>Something went wrong</h2>
            </div>
            
            <p style={{ color: 'var(--color-ink-2)', marginBottom: '24px' }}>
              The application encountered an unexpected error. 
            </p>

            <div style={{ background: 'var(--color-sunken)', padding: '16px', borderRadius: '8px', marginBottom: '24px', overflowX: 'auto', border: '1px solid var(--color-hairline)' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-danger)', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                {this.state.error && this.state.error.toString()}
              </div>
              <pre style={{ margin: 0, color: 'var(--color-ink-3)', fontSize: '12px', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace' }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button onClick={this.handleReload} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCcw size={16} /> Reload page
              </Button>
              <Button variant="secondary" onClick={this.handleGoHome} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Home size={16} /> Go to Dashboard
              </Button>
              <div style={{ flex: 1 }} />
              <Button variant="secondary" onClick={this.handleCopyError} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Copy size={16} /> Copy error details
              </Button>
            </div>
          </Card>
        </div>
      );

      return content;
    }

    return this.props.children;
  }
}

