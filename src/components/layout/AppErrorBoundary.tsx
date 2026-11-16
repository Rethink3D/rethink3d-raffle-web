import React from 'react';
import { isStaleBuildError, reloadOnceForStaleBuild } from '../../utils/staleBuild';

interface AppErrorBoundaryState {
  failed: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Tela interrompida por um erro:', error);
    if (isStaleBuildError(error)) reloadOnceForStaleBuild();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6 text-center">
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <p className="text-lg font-display font-bold text-brand-strong">Algo saiu do lugar</p>
          <p className="text-sm text-brand-muted">
            O site foi atualizado ou a conexão oscilou. Recarregue para continuar de onde parou.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-full bg-brand-primary text-white font-ui font-bold"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}
