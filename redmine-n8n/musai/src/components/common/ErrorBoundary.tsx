import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
{
  public constructor(props: ErrorBoundaryProps)
  {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState
  {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void
  {
    // eslint-disable-next-line no-console
    console.error('Musai ErrorBoundary caught an error:', error, errorInfo);
  }

  public render(): React.ReactNode
  {
    if (this.state.hasError)
    {
      return this.props.fallback ?? (
        <div className="p-6">
          <div className="max-w-xl mx-auto border rounded-lg p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <h2 className="text-red-700 dark:text-red-300 font-semibold mb-2">Something went wrong.</h2>
            <p className="text-sm text-red-700/80 dark:text-red-300/80">Please try reloading the app. If the problem persists, check the console for details.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


