import React from 'react';
import { logReactError } from '../lib/clientLogger';

type Props = {
  children: React.ReactNode;
};

type State = { hasError: boolean; error?: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logReactError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Algo deu errado.</h2>
          <p>Atualize a página. Se o erro continuar, copie os detalhes abaixo.</p>
          {this.state.error ? (
            <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: 12 }}>
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}
