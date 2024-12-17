import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Users, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number | 'free';
  participants: number;
  maxParticipants: number;
  rating?: number;
  imageUrl?: string;
}

export function EventCard({
  id,
  title,
  description,
  date,
  location,
  price,
  participants,
  maxParticipants,
  rating,
  imageUrl,
}: EventCardProps) {
  const { t, i18n } = useTranslation();

  const formattedDate = format(new Date(date), 'PPP', {
    locale: i18n.language === 'es' ? es : undefined,
  });

  return (
    <Link
      to={`/events/${id}`}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative"
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={imageUrl || 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-gray-100"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3';
          }}
        />
        {price === 'free' && (
          <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-sm font-medium">
            {t('events.free')}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            {formattedDate}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-2" />
            {location}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            {participants}/{maxParticipants} {t('events.participants')}
          </div>
          
          {rating && (
            <div className="flex items-center text-sm text-gray-500">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}