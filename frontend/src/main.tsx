import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { initClientLogger } from './lib/clientLogger';
import { ErrorBoundary } from './components/ErrorBoundary';

const logWriteToken = (import.meta.env.VITE_LOG_WRITE_TOKEN as string | undefined) || undefined;
initClientLogger(logWriteToken ? { writeToken: logWriteToken } : undefined);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
