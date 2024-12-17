import React from 'react';
import { useInstructorEvents } from '../../hooks/useInstructorEvents';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { InstructorEventCard } from './InstructorEventCard';
import { AlertCircle } from 'lucide-react';

export function InstructorEventList() {
  const { data: events, isLoading, error } = useInstructorEvents();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error al cargar los eventos
        </h2>
        <p className="text-gray-600">
          No se pudieron cargar tus eventos. Por favor, inténtalo de nuevo.
        </p>
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No has creado ningún evento aún.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {events.map((event) => (
        <InstructorEventCard key={event.id} event={event} />
      ))}
    </div>
  );
}