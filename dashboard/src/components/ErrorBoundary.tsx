import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log to console for debugging
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, showDetails } = this.state;

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-xl border border-border bg-surface-1 p-6 sm:p-8 shadow-xl">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
          </div>

          {/* Message */}
          <h2 className="text-lg font-bold text-text-primary text-center mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-text-secondary text-center mb-6 leading-relaxed">
            An unexpected error occurred while rendering the application.
            You can try again or report the issue on GitHub.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={this.handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <a
              href="https://github.com/agdanish/tipflow/issues/new?title=Runtime+Error&labels=bug"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface-2 text-text-secondary text-sm font-medium hover:text-text-primary hover:border-accent-border transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Report Issue
            </a>
          </div>

          {/* Collapsible error details */}
          <div className="rounded-lg border border-border bg-surface-2 overflow-hidden">
            <button
              onClick={this.toggleDetails}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
            >
              {showDetails ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              Error Details (for developers)
            </button>
            {showDetails && (
              <div className="px-4 pb-4 space-y-3">
                {error && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Error
                    </p>
                    <pre className="text-xs text-red-400 bg-surface font-mono p-3 rounded-md border border-border overflow-x-auto whitespace-pre-wrap break-words">
                      {error.toString()}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Component Stack
                    </p>
                    <pre className="text-sm text-text-secondary bg-surface font-mono p-3 rounded-md border border-border overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
