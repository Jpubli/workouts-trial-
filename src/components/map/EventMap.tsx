import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Users, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logger } from '../../utils/logger';

interface EventLocation {
  id: string;
  title: string;
  date: string;
  latitude: number;
  longitude: number;
  price: number | 'free';
  participants: number;
  maxParticipants: number;
  rating?: number;
}

interface EventMapProps {
  events: EventLocation[];
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  interactive?: boolean;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (location: { lat: number; lng: number }) => void }) {
  const map = useMap();

  React.useEffect(() => {
    if (!onLocationSelect) return;

    const handleClick = (e: any) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lng });
      logger.info('Map location selected', { lat, lng });
    };

    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, onLocationSelect]);

  return null;
}

export function EventMap({ 
  events, 
  center = [40.4168, -3.7038], // Madrid por defecto
  zoom = 13,
  onLocationSelect,
  interactive = true,
}: EventMapProps) {
  const { t, i18n } = useTranslation();
  const mapRef = React.useRef<any>(null);

  const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const handleMarkerClick = (event: EventLocation) => {
    if (mapRef.current) {
      mapRef.current.setView([event.latitude, event.longitude], 15);
    }
  };

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-md relative">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        ref={mapRef}
        dragging={interactive} 
        style={{ zIndex: 1 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => handleMarkerClick(event)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <div className="space-y-2 mt-2">
                  <p className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(event.date), 'PPP', {
                      locale: i18n.language === 'es' ? es : undefined,
                    })}
                  </p>
                  <p className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {event.price === 'free' ? t('events.free') : `${event.price}€`}
                  </p>
                  <p className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    {event.participants}/{event.maxParticipants}
                  </p>
                  {event.rating && (
                    <p className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      {event.rating.toFixed(1)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => window.location.href = `/events/${event.id}`}
                  className="mt-3 w-full px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                >
                  {t('events.details')}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapClickHandler onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}