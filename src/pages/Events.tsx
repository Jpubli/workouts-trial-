import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEvents } from '../hooks/useEvents';
import { EventMap } from '../components/map/EventMap';
import { EventCard } from '../components/events/EventCard';
import { EventFilters } from '../components/events/EventFilters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { logger } from '../utils/logger';

export function Events() {
  const { t } = useTranslation();
  const { isInstructor } = useAuth();
  const { data: events, isLoading, error } = useEvents();
  const [mapCenter, setMapCenter] = React.useState<[number, number]>([40.4168, -3.7038]);
  const [selectedLocation, setSelectedLocation] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Intentar obtener la ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          logger.info('Ubicación del usuario obtenida', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          logger.warn('Error al obtener la ubicación del usuario', { error });
        }
      );
    }
  }, []);

  if (error) {
    logger.error('Error al cargar eventos', { error });
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error al cargar los eventos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('events.title')}</h1>
        {isInstructor && (
          <Link
            to="/events/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('events.create')}
          </Link>
        )}
      </div>
      
      <EventFilters />
      
      <EventMap
        events={events || []}
        center={mapCenter}
        onLocationSelect={setSelectedLocation}
      />
      
      <div className="relative">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : events?.length === 0 ? (
          <p className="text-center py-12 text-gray-500">{t('events.noEvents')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}