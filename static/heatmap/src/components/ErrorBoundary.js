import React, { Component } from 'react';
import PropTypes from 'prop-types';
import InlineMessage from '@atlaskit/inline-message';

/**
 * Error Boundary component to catch JavaScript errors in child components.
 * Prevents entire app from crashing due to unhandled errors.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="conf-container">
          <InlineMessage type="error" title="Something went wrong">
            {this.state.error?.message || 'An unexpected error occurred'}
          </InlineMessage>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
