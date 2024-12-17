import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { User, Settings, Calendar, Star, Award, MessageSquare, MapPin, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useUserMessages } from '../hooks/useMessages';
import { MessageList } from '../components/messages/MessageList';
import { InstructorProfile } from '../types/auth';
import { logger } from '../utils/logger';

export function Profile() {
  const { t } = useTranslation();
  const { user, isInstructor } = useAuth();
  const navigate = useNavigate();
  const { data: messages, isLoading: isLoadingMessages } = useUserMessages();

  const { data: registeredEvents } = useQuery({
    queryKey: ['registeredEvents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          event:events (
            id,
            title,
            date,
            location,
            image_url
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'confirmed');

      if (error) throw error;
      return data.map(reg => reg.event);
    },
    enabled: !!user
  });

  if (!user) {
    logger.warn('Unauthorized access to profile');
    return <Navigate to="/auth" replace />;
  }

  const instructorProfile = isInstructor ? user as InstructorProfile : null;

  const handleCreateEvent = () => {
    logger.info('Navigating to create event page');
    navigate('/events/create');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-100 p-3 rounded-full">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
            <p className="text-gray-600">{user.email} • {isInstructor ? 'Monitor' : 'Usuario'}</p>
          </div>
        </div>
        {instructorProfile && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600">{instructorProfile.bio}</p>
            <div className="mt-2 flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {instructorProfile.experience_years} años de experiencia
              </span>
              {instructorProfile.rating && (
                <span className="flex items-center text-sm text-gray-500">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  {instructorProfile.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">
              {isInstructor ? 'Gestión de Eventos' : 'Mis Eventos'}
            </h2>
          </div>
          {isInstructor ? (
            <>
              <button 
                onClick={handleCreateEvent}
                className="w-full mb-4 px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('events.create')}
              </button>
              <InstructorEventList />
            </>
          ) : registeredEvents?.length ? (
            <div className="space-y-4">
              {registeredEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 relative"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={event.image_url || "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3"}
                      alt={event.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.location}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              {isInstructor ? 'No has creado eventos' : 'No te has inscrito a ningún evento'}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            {isInstructor ? (
              <>
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">
                  Mensajes
                  {messages?.some(m => m.status !== 'read') && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                      Nuevos
                    </span>
                  )}
                </h2>
              </>
            ) : (
              <>
                <Star className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Mis Valoraciones</h2>
              </>
            )}
          </div>
          {isInstructor ? (
            <MessageList messages={messages || []} isLoading={isLoadingMessages} />
          ) : (
            <p className="text-gray-600">No has realizado valoraciones</p>
          )}
        </div>

        {isInstructor ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Award className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Certificaciones</h2>
            </div>
            {instructorProfile?.certifications?.length ? (
              <ul className="space-y-2">
                {instructorProfile.certifications.map((cert, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2" />
                    {cert}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No hay certificaciones añadidas</p>
            )}
            <button className="mt-4 w-full px-4 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors">
              Añadir Certificación
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Preferencias</h2>
            </div>
            <button className="w-full px-4 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors">
              Editar Preferencias
            </button>
          </div>
        )}
      </div>
    </div>
  );
}