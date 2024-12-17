import React from 'react';
import { User, Mail, X } from 'lucide-react';

interface EventParticipantListProps {
  participants: Array<{
    user: {
      name: string;
    };
    status: string;
  }>;
  onClose: () => void;
}

export function EventParticipantList({ participants, onClose }: EventParticipantListProps) {
  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Participantes</h4>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-3">
        {participants.map((participant, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium">{participant.user.name}</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-sm rounded-full ${
              participant.status === 'confirmed'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {participant.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}