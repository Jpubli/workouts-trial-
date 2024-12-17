import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EventForm } from '../components/events/EventForm';
import { useCreateEvent, useEventValidation } from '../hooks/useEvents';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { AlertCircle } from 'lucide-react';

export function CreateEvent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isInstructor } = useAuth();
  const createEvent = useCreateEvent();
  const validateEvent = useEventValidation();

  // Redirigir si no es instructor
  React.useEffect(() => {
    if (!isInstructor) {
      logger.warn('Non-instructor user attempted to access event creation');
      navigate('/events');
    }
  }, [isInstructor, navigate]);

  if (!user || !isInstructor) {
    logger.warn('Unauthorized access to event creation');
    return null;
  }

  const handleSubmit = async (data: any) => {
    try {
      logger.info('Attempting to create event', { eventData: data });
      
      // Validar el evento antes de crearlo
      const validationResult = await validateEvent.mutateAsync(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      // Añadir el ID del instructor
      const eventData = {
        ...data,
        instructor_id: user.id,
        created_at: new Date().toISOString(),
      };

      await createEvent.mutateAsync(eventData);
      logger.info('Event created successfully');
      navigate('/events');
    } catch (error) {
      logger.error('Error creating event', { error });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('events.create')}</h1>
        {createEvent.isError && (
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Error al crear el evento</span>
          </div>
        )}
      </div>
      <div className="bg-white shadow-sm rounded-lg p-6">
        <EventForm onSubmit={handleSubmit} isLoading={createEvent.isPending} />
      </div>
    </div>
  );
}