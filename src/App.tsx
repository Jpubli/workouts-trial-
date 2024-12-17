import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { LogViewer } from './components/dev/LogViewer';
import './i18n';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <LogViewer />
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;