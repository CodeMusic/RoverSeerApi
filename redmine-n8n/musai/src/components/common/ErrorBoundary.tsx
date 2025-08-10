import React from 'react';
import ErrorExperience from '@/pages/ErrorExperience';

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
      return this.props.fallback ?? <ErrorExperience />;
    }

    return this.props.children;
  }
}


