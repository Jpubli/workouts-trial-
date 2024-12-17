import { supabase } from '../lib/supabase';
import type { Event, EventRegistration, ActivityType, DifficultyLevel } from '../types/database';
import { logger } from '../utils/logger';

interface EventFilters {
  search?: string;
  activityType?: ActivityType;
  difficulty?: DifficultyLevel;
  priceRange?: string;
  dateRange?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // en kilómetros
  };
}

export async function getEvents({
  search,
  activityType,
  difficulty,
  priceRange,
  dateRange,
  location,
}: {
  search?: string;
  activityType?: ActivityType;
  difficulty?: DifficultyLevel;
  priceRange?: string;
  dateRange?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
} = {}) {
  logger.info('Fetching events with filters', {
    search,
    activityType,
    difficulty,
    priceRange,
    dateRange,
    location,
  });

  let query = supabase
    .from('events')
    .select(`
      *,
      registrations:event_registrations!event_id(id)
    `);

  if (search) {
    const searchTerms = search.toLowerCase().split(' ');
    searchTerms.forEach(term => {
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
    });
  }

  if (activityType) {
    query = query.eq('activity_type', activityType);
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  if (priceRange) {
    switch (priceRange) {
      case 'free':
        query = query.is('price', null);
        break;
      case '0-10':
        query = query.gt('price', 0).lte('price', 10);
        break;
      case '10-20':
        query = query.gt('price', 10).lte('price', 20);
        break;
      case '20+':
        query = query.gt('price', 20);
        break;
    }
  }

  if (dateRange) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    switch (dateRange) {
      case 'today':
        query = query.gte('date', now.toISOString()).lt('date', tomorrow.toISOString());
        break;
      case 'tomorrow':
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        query = query.gte('date', tomorrow.toISOString()).lt('date', dayAfterTomorrow.toISOString());
        break;
      case 'week':
        query = query.gte('date', now.toISOString()).lt('date', nextWeek.toISOString());
        break;
      case 'month':
        query = query.gte('date', now.toISOString()).lt('date', nextMonth.toISOString());
        break;
    }
  }

  if (location) {
    const { latitude, longitude, radius } = location;
    const latDiff = radius / 111;
    const lonDiff = radius / (111 * Math.cos(latitude * Math.PI / 180));
    
    query = query
      .gte('latitude', latitude - latDiff)
      .lte('latitude', latitude + latDiff)
      .gte('longitude', longitude - lonDiff)
      .lte('longitude', longitude + lonDiff);
  }

  // Ordenar por fecha y mostrar solo eventos futuros
  query = query
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  let { data, error } = await query;

  if (error) {
    logger.error('Error fetching events', { error });
    throw error;
  }

  // Transformar los datos para el formato esperado
  data = data?.map(event => ({
    ...event,
    imageUrl: event.image_url,
    participants: event.registrations?.length || 0,
    maxParticipants: event.max_participants
  }));
  logger.info('Events fetched successfully', { count: data?.length });
  return data;
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      instructor:profiles!instructor_id(
        name,
        rating,
        total_events,
        bio,
        experience_years,
        certifications
      ),
      registrations:event_registrations(
        user_id,
        status
      ),
      ratings(
        rating,
        comment,
        user:profiles!user_id(name)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function validateEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) {
  // Validar campos requeridos
  const requiredFields = [
    'title', 'description', 'activity_type', 'difficulty',
    'date', 'duration', 'location', 'latitude', 'longitude',
    'max_participants'
  ];

  for (const field of requiredFields) {
    if (!event[field]) {
      return { isValid: false, error: `El campo ${field} es requerido` };
    }
  }

  // Validar fecha futura
  const eventDate = new Date(event.date);
  if (eventDate < new Date()) {
    return { isValid: false, error: 'La fecha del evento debe ser futura' };
  }

  // Validar coordenadas
  if (
    event.latitude < -90 || event.latitude > 90 ||
    event.longitude < -180 || event.longitude > 180
  ) {
    return { isValid: false, error: 'Coordenadas inválidas' };
  }

  // Validar precio
  if (event.price && event.price < 0) {
    return { isValid: false, error: 'El precio no puede ser negativo' };
  }

  // Validar participantes
  if (event.max_participants < 1) {
    return { isValid: false, error: 'Debe haber al menos un participante' };
  }

  return { isValid: true };
}

export async function createEvent(eventData: any) {
  logger.info('Creating new event', { eventData });

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Usuario no autenticado');
  }

  const event = {
    instructor_id: user.user.id,
    title: eventData.title,
    description: eventData.description,
    activity_type: eventData.activity_type,
    difficulty: eventData.difficulty,
    date: eventData.date,
    duration: eventData.duration,
    location: eventData.location,
    latitude: eventData.latitude,
    longitude: eventData.longitude,
    price: eventData.price,
    max_participants: eventData.max_participants,
    requirements: eventData.requirements,
    image_url: eventData.image_url,
    created_at: new Date().toISOString(),
  };

  // Si el evento es recurrente, crear múltiples eventos
  if (eventData.recurrence && eventData.recurrence.type !== 'none') {
    const events = generateRecurringEvents(event, eventData.recurrence);
    const { data, error } = await supabase
      .from('events')
      .insert(events)
      .select();

    if (error) {
      logger.error('Error creating recurring events', { error });
      throw error;
    }

    return data;
  }

  // Si no es recurrente, crear un solo evento
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();

  if (error) {
    logger.error('Error creating event in database', { error });
    throw error;
  }

  logger.info('Event created successfully', { eventId: data.id });
  return data;
}

function generateRecurringEvents(baseEvent: any, recurrence: { type: string; endDate?: string }) {
  const events = [];
  const startDate = new Date(baseEvent.date);
  const endDate = recurrence.endDate ? new Date(recurrence.endDate) : null;
  let currentDate = new Date(startDate);

  while (!endDate || currentDate <= endDate) {
    events.push({
      ...baseEvent,
      date: currentDate.toISOString(),
    });

    // Calcular siguiente fecha según el tipo de recurrencia
    switch (recurrence.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        return events;
    }
  }

  return events;
}

export async function registerForEvent(eventId: string): Promise<EventRegistration> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error('Debes iniciar sesión para inscribirte en un evento');
  }

  // Verificar disponibilidad
  const { data: event } = await supabase
    .from('events')
    .select('max_participants, registrations:event_registrations(count)')
    .eq('id', eventId)
    .single();

  if (!event) {
    throw new Error('El evento no existe');
  }

  const currentParticipants = event.registrations?.[0]?.count || 0;
  if (currentParticipants >= event.max_participants) {
    throw new Error('El evento está completo');
  }

  // Verificar registro existente
  const { data: existingReg, error: checkError } = await supabase
    .from('event_registrations')
    .select()
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    logger.error('Error checking registration', { error: checkError });
    throw checkError;
  }

  if (existingReg) {
    throw new Error('Ya estás registrado en este evento');
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .insert([
      { 
        event_id: eventId,
        user_id: user.id,
        status: 'confirmed'
      }
    ])
    .select()
    .single();

  if (error) {
    logger.error('Error registering for event', { error });
    throw error;
  }

  logger.info('Successfully registered for event', { eventId });
  return data;
}

export async function cancelRegistration(eventId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    logger.error('Attempted to cancel registration without authentication');
    throw new Error('Usuario no autenticado');
  }

  logger.info('Iniciando cancelación de registro', { eventId });

  const { data, error } = await supabase
    .from('event_registrations')
    .delete()
    .match({
      event_id: eventId,
      user_id: user.id
    })
    .select();

  if (error) {
    logger.error('Error al cancelar registro', { error, eventId, userId: user.id });
    throw new Error('Error al cancelar la inscripción');
  }

  if (!data || data.length === 0) {
    logger.error('No registration found to cancel', { eventId, userId: user.id });
    throw new Error('No se encontró la inscripción para cancelar');
  }
  logger.info('Registro cancelado exitosamente', { eventId });
  return true;
}