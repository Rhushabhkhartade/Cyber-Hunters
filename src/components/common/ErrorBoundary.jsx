import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled error in SentinelAI UI", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-display text-white mb-3">Something went wrong</h2>
          <p className="text-gray-400 text-sm">
            The page could not be rendered. Please refresh and try again.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
