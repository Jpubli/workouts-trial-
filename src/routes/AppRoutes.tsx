import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Home } from '../pages/Home';
import { Events } from '../pages/Events';
import { EventDetails } from '../pages/EventDetails';
import { Profile } from '../pages/Profile';
import { CreateEvent } from '../pages/CreateEvent';
import { Auth } from '../pages/Auth';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { logger } from '../utils/logger';

export function AppRoutes() {
  const { isLoading, error } = useAuth();

  React.useEffect(() => {
    if (error) {
      logger.error('Authentication error in routes', { error });
    }
  }, [error]);

  if (isLoading) {
    logger.info('Loading authentication state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de autenticación</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/events/create" element={<CreateEvent />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Layout>
  );
}