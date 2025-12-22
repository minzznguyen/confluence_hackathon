import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// CSS Reset - must be imported first to override browser defaults
import '@atlaskit/css-reset';

// Global styles - variables must be imported before other styles that use them
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
