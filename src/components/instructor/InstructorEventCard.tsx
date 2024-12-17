import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Users, MessageSquare, Edit, Trash2, Mail } from 'lucide-react';
import { useEventMessages, useSendEventMessage, useCancelEvent } from '../../hooks/useInstructorEvents';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EventParticipantList } from './EventParticipantList';
import { EventMessageList } from './EventMessageList';
import { logger } from '../../utils/logger';

interface InstructorEventCardProps {
  event: any;
}

export function InstructorEventCard({ event }: InstructorEventCardProps) {
  const [showParticipants, setShowParticipants] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  
  const { data: messages, isLoading: isLoadingMessages } = useEventMessages(event.id);
  const sendMessage = useSendEventMessage();
  const cancelEventMutation = useCancelEvent();

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage.mutateAsync({
        eventId: event.id,
        message,
        type: 'general',
      });
      logger.info('Message sent successfully');
    } catch (error) {
      logger.error('Error sending message', { error });
    }
  };

  const handleSendPrivateMessage = async (message: string, toUserId: string) => {
    try {
      await sendMessage.mutateAsync({
        eventId: event.id,
        message,
        type: 'private',
        toUserId
      });
      logger.info('Private message sent successfully');
    } catch (error) {
      logger.error('Error sending private message', { error });
    }
  };

  const handleCancelEvent = async () => {
    try {
      await cancelEventMutation.mutateAsync({
        eventId: event.id,
        message: cancelMessage
      });
      setShowCancelModal(false);
      logger.info('Event cancelled successfully');
    } catch (error) {
      logger.error('Error cancelling event', { error });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
            <div className="mt-2 space-y-2">
              <p className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {format(new Date(event.date), 'PPP', { locale: es })}
              </p>
              <p className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {event.location}
              </p>
              <p className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                {event.registrations.length}/{event.max_participants} participantes
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowMessages(true)}
              className="p-2 text-gray-600 hover:text-indigo-600 relative"
              title="Mensajes"
            >
              <MessageSquare className="w-5 h-5" />
              {messages?.some(m => !m.read) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-2 text-gray-600 hover:text-indigo-600"
              title="Participantes"
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => {}} // TODO: Implementar edición
              className="p-2 text-gray-600 hover:text-indigo-600"
              title="Editar"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="p-2 text-gray-600 hover:text-red-600"
              title="Cancelar evento"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {showParticipants ? 'Ocultar participantes' : 'Ver participantes'}
          </button>
          
          {showParticipants && (
            <EventParticipantList
              participants={event.registrations}
              onClose={() => setShowParticipants(false)}
            />
          )}
        </div>
      </div>

      {/* Modal de mensajes */}
      {showMessages && (
        <EventMessageList
          eventId={event.id}
          participants={event.registrations}
          messages={messages || []}
          isLoading={isLoadingMessages}
          onSendMessage={(message, toUserId) => 
            toUserId ? handleSendPrivateMessage(message, toUserId) : handleSendMessage(message)
          }
          onClose={() => setShowMessages(false)}
        />
      )}

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Cancelar evento</h3>
            <p className="text-gray-600 mb-4">
              Esta acción es irreversible. Se notificará a todos los participantes.
            </p>
            <textarea
              value={cancelMessage}
              onChange={(e) => setCancelMessage(e.target.value)}
              placeholder="Mensaje para los participantes..."
              className="w-full p-2 border rounded-md mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCancelEvent}
                disabled={cancelEventMutation.isPending || !cancelMessage.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {cancelEventMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Confirmar cancelación'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}