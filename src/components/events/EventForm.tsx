import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Clock, Users, Info } from 'lucide-react';
import { EventMap } from '../map/EventMap';
import type { ActivityType, DifficultyLevel } from '../../types/database';
import { logger } from '../../utils/logger';

interface EventFormData {
  title: string;
  description: string;
  recurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    endDate?: string;
  };
  activity_type: ActivityType;
  difficulty: DifficultyLevel;
  date: string;
  time: string;
  duration: number;
  location: string;
  latitude: number;
  longitude: number;
  price: number | null;
  max_participants: number;
  requirements: string[];
  image_url?: string;
}

interface EventFormProps {
  onSubmit: (data: EventFormData) => void;
  isLoading?: boolean;
}

export function EventForm({ onSubmit, isLoading }: EventFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<EventFormData>({
    defaultValues: {
      recurrence: {
        type: 'none'
      }
    }
  });
  const [selectedLocation, setSelectedLocation] = React.useState<{lat: number; lng: number} | null>(null);
  const [requirements, setRequirements] = React.useState<string[]>([]);
  const [newRequirement, setNewRequirement] = React.useState('');

  const handleLocationSelect = (location: {lat: number; lng: number}) => {
    logger.info('Location selected', location);
    setSelectedLocation(location);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: EventFormData) => {
    // Combinar fecha y hora
    const dateTime = new Date(`${data.date}T${data.time}`);
    
    onSubmit({
      ...data,
      latitude: selectedLocation?.lat || 0,
      longitude: selectedLocation?.lng || 0,
      date: dateTime.toISOString(),
      requirements,
      price: data.price || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Nombre del evento
            </label>
            <input
              type="text"
              id="title"
              {...register('title', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{t('common.required')}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción del evento
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="activity_type" className="block text-sm font-medium text-gray-700">
                Tipo de actividad
              </label>
              <select
                id="activity_type"
                {...register('activity_type', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="running">Running</option>
                <option value="cycling">Ciclismo</option>
                <option value="swimming">Natación</option>
                <option value="yoga">Yoga</option>
                <option value="fitness">Fitness</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                Nivel de dificultad
              </label>
              <select
                id="difficulty"
                {...register('difficulty', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                <Calendar className="inline-block w-4 h-4 mr-1" />
                Fecha de inicio
              </label>
              <input
                type="date"
                id="date"
                {...register('date', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                <Clock className="inline-block w-4 h-4 mr-1" />
                Hora
              </label>
              <input
                type="time"
                id="time"
                {...register('time', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              <Clock className="inline-block w-4 h-4 mr-1" />
              Duración (minutos)
            </label>
            <input
              type="number"
              id="duration"
              min="1"
              {...register('duration', { required: true, min: 1 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="inline-block w-4 h-4 mr-1" />
              Periodicidad
            </label>
            <select
              {...register('recurrence.type')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="none">No repetir</option>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensualmente</option>
            </select>

            {watch('recurrence.type') !== 'none' && (
              <div>
                <label htmlFor="recurrence.endDate" className="block text-sm font-medium text-gray-700">
                  Fecha de finalización
                </label>
                <input
                  type="date"
                  {...register('recurrence.endDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline-block w-4 h-4 mr-1" />
              Ubicación
            </label>
            <div className="mb-4">
              <EventMap
                events={[]}
                onLocationSelect={handleLocationSelect}
                center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
                zoom={13}
              />
            </div>
            <input
              type="text"
              id="location"
              {...register('location', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Nombre o dirección del lugar"
            />
            {selectedLocation && (
              <p className="mt-2 text-sm text-gray-600">
                Ubicación seleccionada: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Precio (€)
          </label>
          <input
            type="number"
            id="price"
            min="0"
            step="0.01"
            {...register('price', { min: 0 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">Deja en blanco si es gratuito</p>
        </div>

        <div>
          <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700">
            <Users className="inline-block w-4 h-4 mr-1" />
            Número máximo de participantes
          </label>
          <input
            type="number"
            id="max_participants"
            min="1"
            {...register('max_participants', { required: true, min: 1 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          <Info className="inline-block w-4 h-4 mr-1" />
          Requisitos
        </label>
        <div className="mt-1 flex space-x-2">
          <input
            type="text"
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Añadir requisito..."
          />
          <button
            type="button"
            onClick={addRequirement}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Añadir
          </button>
        </div>
        {requirements.length > 0 && (
          <ul className="mt-2 space-y-1">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-center justify-between text-sm text-gray-600">
                <span>{req}</span>
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
          URL de la imagen
        </label>
        <input
          type="url"
          id="image_url"
          {...register('image_url')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="https://..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('events.form.create')}
        </button>
      </div>
    </form>
  );
}