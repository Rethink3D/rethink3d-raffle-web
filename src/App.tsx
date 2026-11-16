import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './routes';
import { ConfirmDialogHost } from './components/ui/ConfirmDialogHost';
import { AppErrorBoundary } from './components/layout/AppErrorBoundary';

const App: React.FC = () => {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRouter />
        <ConfirmDialogHost />
      </BrowserRouter>
    </AppErrorBoundary>
  );
};

export default App;
