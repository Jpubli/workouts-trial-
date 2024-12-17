import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, X } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface EventMessageListProps {
  eventId: string;
  participants: Array<{
    user: {
      id: string;
      name: string;
    };
  }>;
  messages: Array<{
    message: string;
    sent_at: string;
    type: string;
    to_id?: string;
    instructor: {
      name: string;
    };
  }>;
  isLoading: boolean;
  onSendMessage: (message: string, toUserId?: string) => Promise<void>;
  onClose: () => void;
}

export function EventMessageList({
  participants,
  messages,
  isLoading,
  onSendMessage,
  onClose
}: EventMessageListProps) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      await onSendMessage(newMessage, selectedParticipant);
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Mensajes del evento</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-96 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="md" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500">No hay mensajes aún</p>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">{message.instructor.name}</p>
                    <span className="text-sm text-gray-500">
                      {format(new Date(message.sent_at), 'PPp', { locale: es })}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700">{message.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="mb-4">
            <select
              value={selectedParticipant || ''}
              onChange={(e) => setSelectedParticipant(e.target.value || undefined)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Mensaje general</option>
              {participants.map((p) => (
                <option key={p.user.id} value={p.user.id}>
                  Mensaje privado para {p.user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !newMessage.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}