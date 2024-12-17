import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as instructorService from '../services/instructor';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

export function useInstructorEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['instructorEvents', user?.id],
    queryFn: () => instructorService.getInstructorEvents(user!.id),
    enabled: !!user?.id,
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, changes }: { eventId: string; changes: any }) =>
      instructorService.updateEvent(eventId, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['instructorEvents'] });
    },
  });
}

export function useSendEventMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, message, type }: { eventId: string; message: string; type?: 'general' | 'change_notification' }) =>
      instructorService.sendEventMessage(eventId, message, type),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventMessages', variables.eventId] });
    },
  });
}

export function useEventMessages(eventId: string) {
  return useQuery({
    queryKey: ['eventMessages', eventId],
    queryFn: () => instructorService.getEventMessages(eventId),
  });
}

export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, message }: { eventId: string; message: string }) =>
      instructorService.cancelEvent(eventId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['instructorEvents'] });
    },
  });
}