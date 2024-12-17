import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, X, MessageSquare } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useMarkMessageAsRead, useReplyToMessage } from '../../hooks/useMessages';
import { logger } from '../../utils/logger';

interface Message {
  id: string;
  message: string;
  sent_at: string;
  type: string;
  status: string;
  event: {
    id: string;
    title: string;
  };
  instructor: {
    id: string;
    name: string;
  };
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);

  const markAsRead = useMarkMessageAsRead();
  const sendReply = useReplyToMessage();

  const handleMessageClick = async (message: Message) => {
    if (message.status !== 'read') {
      try {
        await markAsRead.mutateAsync(message.id);
      } catch (error) {
        logger.error('Error marking message as read', { error });
      }
    }
    setSelectedMessage(message);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !reply.trim()) return;

    try {
      setIsSending(true);
      await sendReply.mutateAsync({
        message: selectedMessage,
        reply: reply.trim()
      });
      setReply('');
      setSelectedMessage(null);
    } catch (error) {
      logger.error('Error sending reply', { error });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No tienes mensajes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          onClick={() => handleMessageClick(message)}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            message.status !== 'read'
              ? 'bg-indigo-50 hover:bg-indigo-100'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">{message.event.title}</p>
              <p className="text-sm text-gray-500">De: {message.instructor.name}</p>
            </div>
            <span className="text-sm text-gray-500">
              {format(new Date(message.sent_at), 'PPp', { locale: es })}
            </span>
          </div>
          <p className="mt-2 text-gray-700">{message.message}</p>
        </div>
      ))}

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Responder mensaje</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-medium">{selectedMessage.event.title}</p>
                <p className="text-sm text-gray-500 mb-2">
                  {selectedMessage.instructor.name} - {' '}
                  {format(new Date(selectedMessage.sent_at), 'PPp', { locale: es })}
                </p>
                <p className="text-gray-700">{selectedMessage.message}</p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                />

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={isSending || !reply.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                  >
                    {isSending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar respuesta
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}