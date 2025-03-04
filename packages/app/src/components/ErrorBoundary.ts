import React from 'react';

export type ErrorBoundaryProps = {
  /**
   * The children to render
   */
  children: (props: {
    /**
     * The error that was caught, if any
     */
    error: Error | null;
    /**
     * Reset the error boundary (set the error to null)
     */
    reset: () => void;
  }) => React.ReactNode;
  onError?: (error: Error) => void;
};

/**
 * Utility component to catch error in a component tree
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const {
      props: { children },
      state: { error },
      reset,
    } = this;
    return children({
      error,
      reset,
    });
  }
}

export default ErrorBoundary;
