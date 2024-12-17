import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { Event, EventMessage, EventChange } from '../types/database';

export async function getInstructorEvents(instructorId: string) {
  logger.info('Fetching instructor events', { instructorId });
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      registrations:event_registrations(
        id,
        user_id,
        status,
        created_at,
        user:profiles(
          id,
          name
        )
      )
    `)
    .eq('instructor_id', instructorId)
    .order('date', { ascending: true });

  if (error) {
    logger.error('Error fetching instructor events', { error });
    throw error;
  }

  return data;
}

export async function updateEvent(eventId: string, changes: Partial<Event>) {
  logger.info('Updating event', { eventId, changes });

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('No autorizado');

  // Crear registro de cambios
  const { data: eventChange, error: changeError } = await supabase
    .from('event_changes')
    .insert([{
      event_id: eventId,
      instructor_id: user.user.id,
      changes,
      status: 'pending'
    }])
    .select()
    .single();

  if (changeError) {
    logger.error('Error creating event change', { error: changeError });
    throw changeError;
  }

  // Actualizar el evento
  const { data, error } = await supabase
    .from('events')
    .update(changes)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating event', { error });
    throw error;
  }

  return { event: data, change: eventChange };
}

export async function sendEventMessage(
  eventId: string,
  message: string,
  type: 'general' | 'change_notification' | 'private' = 'general',
  toUserId?: string
) {
  logger.info('Sending event message', { eventId, type });

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('No autorizado');

  const { data, error } = await supabase
    .from('event_messages')
    .insert([{
      event_id: eventId,
      from_id: user.user.id,
      to_id: toUserId,
      instructor_id: user.user.id,
      message,
      type
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error sending message', { error });
    throw error;
  }

  return data;
}

export async function getEventMessages(eventId: string) {
  const { data, error } = await supabase
    .from('event_messages')
    .select(`
      *,
      instructor:profiles!instructor_id(
        name
      )
    `)
    .eq('event_id', eventId)
    .order('sent_at', { ascending: false });

  if (error) {
    logger.error('Error fetching event messages', { error });
    throw error;
  }

  return data;
}

export async function cancelEvent(eventId: string, message: string) {
  logger.info('Cancelling event', { eventId });

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('No autorizado');

  // Iniciar transacción
  const { error: messageError } = await supabase
    .from('event_messages')
    .insert([{
      event_id: eventId,
      instructor_id: user.user.id,
      message,
      type: 'cancellation'
    }]);

  if (messageError) {
    logger.error('Error sending cancellation message', { error: messageError });
    throw messageError;
  }

  // Cancelar todas las inscripciones
  const { error: registrationError } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId);

  if (registrationError) {
    logger.error('Error cancelling registrations', { error: registrationError });
    throw registrationError;
  }

  // Marcar evento como cancelado
  const { error: eventError } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (eventError) {
    logger.error('Error deleting event', { error: eventError });
    throw eventError;
  }

  return true;
}