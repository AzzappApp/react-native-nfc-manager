import React from 'react';

type ErrorBoundaryWithRetryProps = {
  fallback: React.ReactNode | ((props: { retry: () => void }) => void);
  onRetry: () => void;
  screenId: string;
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

class ErrorBoundaryWithRetry extends React.Component<
  ErrorBoundaryWithRetryProps,
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  _retry = () => {
    this.props.onRetry();
    this.setState({
      error: null,
    });
  };

  componentDidCatch(_error: Error) {
    // TODO sentry
    // if (!__DEV__) {
    //   trackError(ExceptionModel.createFromError(error), {
    //     screenId: this.props.screenId,
    //   });
    // }
  }

  render() {
    const { children, fallback } = this.props;
    const { error } = this.state;
    if (this.props.screenId === 'HOME') {
      return children;
    }
    if (error) {
      if (typeof fallback === 'function') {
        fallback({
          retry: this._retry,
        });
        return;
      }
      return fallback;
    }
    return children;
  }
}

export default ErrorBoundaryWithRetry;
