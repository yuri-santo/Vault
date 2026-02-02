import React from 'react';
import { logReactError } from '../lib/clientLogger';

type Props = {
  children: React.ReactNode;
};

type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logReactError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Algo deu errado.</h2>
          <p>Atualize a página. Se o erro continuar, envie o horário para suporte.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
