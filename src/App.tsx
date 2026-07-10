import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './routes';
import { ConfirmDialogHost } from './components/ui/ConfirmDialogHost';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRouter />
      <ConfirmDialogHost />
    </BrowserRouter>
  );
};

export default App;
