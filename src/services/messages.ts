import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { EventMessage } from '../types/database';

export async function getUserMessages(userId: string) {
  logger.info('Fetching user messages', { userId });

  const { data, error } = await supabase
    .from('event_messages')
    .select(`
      *,
      event:events(
        id,
        title
      ),
      instructor:profiles!instructor_id(
        id,
        name
      )
    `)
    .or(`to_id.eq.${userId},and(type.eq.general,event_id.in(${
      supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
    }))`)
    .order('sent_at', { ascending: false });

  if (error) {
    logger.error('Error fetching user messages', { error });
    throw error;
  }

  return data;
}

export async function markMessageAsRead(messageId: string) {
  logger.info('Marking message as read', { messageId });

  const { error } = await supabase
    .from('event_messages')
    .update({ status: 'read' })
    .eq('id', messageId);

  if (error) {
    logger.error('Error marking message as read', { error });
    throw error;
  }
}

export async function replyToMessage(
  originalMessage: EventMessage,
  reply: string,
  userId: string
) {
  logger.info('Replying to message', { messageId: originalMessage.id });

  const { data, error } = await supabase
    .from('event_messages')
    .insert([{
      event_id: originalMessage.event_id,
      from_id: userId,
      to_id: originalMessage.from_id,
      instructor_id: originalMessage.instructor_id,
      message: reply,
      type: 'private',
      parent_id: originalMessage.id
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error sending reply', { error });
    throw error;
  }

  return data;
}