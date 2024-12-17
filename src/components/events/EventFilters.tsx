import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, MapPin, Navigation } from 'lucide-react';
import { useEventFilters } from '../../hooks/useEventFilters';
import type { ActivityType, DifficultyLevel } from '../../types/database';
import { logger } from '../../utils/logger';

export function EventFilters() {
  const { t } = useTranslation();
  const filters = useEventFilters();
  const [isLocating, setIsLocating] = React.useState(false);

  const handleUseMyLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          logger.info('User location obtained', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          filters.setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radius: 10 // 10km por defecto
          });
          setIsLocating(false);
        },
        (error) => {
          logger.error('Error getting user location', { error });
          setIsLocating(false);
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Filtro de ubicación */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
        >
          {isLocating ? (
            <Navigation className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 mr-2" />
          )}
          {t('events.useMyLocation')}
        </button>
        {filters.location && (
          <span className="text-sm text-gray-600">
            {t('events.distance')}: 10km
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <select
          value={filters.activityType || ''}
          onChange={(e) => filters.setActivityType(e.target.value as ActivityType || undefined)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"
        >
          <option value="">{t('events.activityType')}</option>
          <option value="running">Running</option>
          <option value="cycling">Ciclismo</option>
          <option value="swimming">Natación</option>
          <option value="yoga">Yoga</option>
          <option value="fitness">Fitness</option>
          <option value="other">Otro</option>
        </select>

        <select
          value={filters.difficulty || ''}
          onChange={(e) => filters.setDifficulty(e.target.value as DifficultyLevel || undefined)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"
        >
          <option value="">{t('events.difficulty')}</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>

        <select
          value={filters.priceRange || ''}
          onChange={(e) => filters.setPriceRange(e.target.value || undefined)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"
        >
          <option value="">{t('events.price')}</option>
          <option value="free">Gratis</option>
          <option value="0-10">0-10€</option>
          <option value="10-20">10-20€</option>
          <option value="20+">20€+</option>
        </select>

        <select
          value={filters.dateRange || ''}
          onChange={(e) => filters.setDateRange(e.target.value || undefined)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"
        >
          <option value="">{t('events.date')}</option>
          <option value="today">Hoy</option>
          <option value="tomorrow">Mañana</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
        </select>
      </div>

      {(filters.search || filters.activityType || filters.difficulty || filters.priceRange || filters.dateRange) && (
        <button
          onClick={filters.reset}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <Filter className="w-4 h-4 mr-2" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}