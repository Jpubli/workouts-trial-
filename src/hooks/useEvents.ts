import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as eventService from '../services/events';
import { useEventFilters } from './useEventFilters';
import { logger } from '../utils/logger';

export function useEvents() {
  const filters = useEventFilters();
  
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventService.getEvents(filters),
    onError: (error) => {
      logger.error('Error fetching events', { error });
    }
  });
}

export function useEventValidation() {
  return useMutation({
    mutationFn: eventService.validateEvent,
    onError: (error) => {
      logger.error('Event validation failed', { error });
    }
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventService.getEventById(id),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventService.createEvent,
    onSuccess: () => {
      logger.info('Event created successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      logger.error('Error creating event', { error });
    },
  });
}

export function useEventRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventService.registerForEvent,
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventService.cancelRegistration,
    onSuccess: async (_, eventId) => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.invalidateQueries({ queryKey: ['registeredEvents'] });
      await queryClient.invalidateQueries({ queryKey: ['events', eventId] });
    },
  });
}