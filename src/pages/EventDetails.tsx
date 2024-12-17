import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Users, Star, Clock, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { EventMap } from '../components/map/EventMap';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useEvent, useEventRegistration, useCancelRegistration } from '../hooks/useEvents';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logger } from '../utils/logger';

interface RegistrationModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function RegistrationModal({ onClose, onConfirm, isLoading }: RegistrationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Confirmar inscripción</h3>
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que quieres inscribirte en este evento? 
          Recibirás un correo electrónico con los detalles de la inscripción.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Confirmar inscripción'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: event, isLoading, error } = useEvent(id!);
  const eventRegistration = useEventRegistration();
  const cancelRegistrationMutation = useCancelRegistration();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Verificar si el usuario está registrado
  const isRegistered = event?.registrations?.some(
    reg => reg.user_id === user?.id && reg.status === 'confirmed'
  );

  const handleCancelRegistration = async () => {
    try {
      setIsCancelling(true);
      setCancelError(null);
      await cancelRegistrationMutation.mutateAsync(id!);      
      logger.info('Registration cancelled successfully');
      // Forzar la recarga del evento para actualizar el estado
      queryClient.invalidateQueries({ queryKey: ['events', id] });
    } catch (err) {
      logger.error('Error cancelling registration', { error: err });
      setCancelError((err as Error).message || 'Error al cancelar la inscripción');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    logger.error('Error loading event details', { error });
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error al cargar el evento
        </h2>
        <p className="text-gray-600">
          No se pudo cargar la información del evento. Por favor, inténtalo de nuevo.
        </p>
      </div>
    );
  }

  const formattedDate = format(new Date(event.date), 'PPP', {
    locale: i18n.language === 'es' ? es : undefined,
  });

  const handleRegistration = async () => {
    if (!user) {
      logger.info('User not logged in, redirecting to auth');
      navigate('/auth');
      return;
    }

    try {
      await eventRegistration.mutateAsync(event.id);
      setRegistrationSuccess(true);
      setShowRegistrationModal(false);
      logger.info('Successfully registered for event', { eventId: event.id });
    } catch (error) {
      logger.error('Error registering for event', { error });
    }
  };
  return (
    <div className="space-y-6">
      {registrationSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-green-800 font-medium">¡Inscripción exitosa!</h3>
            <p className="text-green-700 mt-1">
              Te has inscrito correctamente al evento. Recibirás un correo electrónico con los detalles.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="aspect-video relative">
          <img
            src={event.image_url || "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3"}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {!event.price && (
            <span className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {t('events.free')}
            </span>
          )}
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-gray-600">{event.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  {formattedDate}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  {event.duration} minutos
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-2" />
                  {event.registrations.length}/{event.max_participants} {t('events.participants')}
                </div>
                {event.rating && (
                  <div className="flex items-center text-gray-600">
                    <Star className="w-5 h-5 mr-2 text-yellow-400" />
                    {event.rating.toFixed(1)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  {t('events.requirements')}
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {event.requirements?.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <EventMap
                events={[event]}
                center={[event.latitude, event.longitude]}
                zoom={15}
                interactive={false}
              />
              
              <button
                onClick={() => setShowRegistrationModal(true)}
                disabled={registrationSuccess || isRegistered}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistered ? 'Ya estás inscrito' : t('events.register')}
              </button>
              {isRegistered && !isCancelling && (
                <button
                  onClick={handleCancelRegistration}
                  disabled={isCancelling}
                  className="w-full mt-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Cancelar inscripción
                </button>
              )}
              {isCancelling && (
                <div className="w-full mt-2 py-3 flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Cancelando inscripción...</span>
                </div>
              )}
              {cancelError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {cancelError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showRegistrationModal && (
        <RegistrationModal
          onClose={() => setShowRegistrationModal(false)}
          onConfirm={handleRegistration}
          isLoading={eventRegistration.isPending}
        />
      )}
    </div>
  );
}