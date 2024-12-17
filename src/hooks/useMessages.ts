import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as messageService from '../services/messages';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

export function useUserMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userMessages', user?.id],
    queryFn: () => messageService.getUserMessages(user!.id),
    enabled: !!user?.id,
  });
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messageService.markMessageAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMessages'] });
    },
  });
}

export function useReplyToMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ message, reply }: { message: any; reply: string }) =>
      messageService.replyToMessage(message, reply, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMessages'] });
    },
  });
}