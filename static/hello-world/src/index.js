import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// CSS Reset (must be first)
import '@atlaskit/css-reset';

// Global Styles (variables must be first)
import './styles/variables.css';
import './styles/layout.css';
import './styles/typography.css';
import './styles/content.css';
import './styles/comments.css';
import './styles/chart.css';

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
);
