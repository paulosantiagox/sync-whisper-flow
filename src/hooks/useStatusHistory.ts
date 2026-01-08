import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StatusHistory, StatusChangeNotification, QualityRating } from '@/types';
import { toast } from 'sonner';

export function useStatusHistory(phoneNumberId?: string) {
  return useQuery({
    queryKey: ['status-history', phoneNumberId],
    queryFn: async () => {
      if (!phoneNumberId) return [];
      
      const { data, error } = await supabase
        .from('status_history')
        .select('*')
        .eq('phone_number_id', phoneNumberId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      
      return data.map((sh): StatusHistory => ({
        id: sh.id,
        phoneNumberId: sh.phone_number_id,
        qualityRating: sh.quality_rating as QualityRating,
        messagingLimitTier: sh.messaging_limit_tier,
        previousQuality: sh.previous_quality as QualityRating | undefined,
        changedAt: sh.changed_at,
        expectedRecovery: sh.expected_recovery || undefined,
        observation: sh.observation || undefined,
        isError: sh.is_error || undefined,
        errorMessage: sh.error_message || undefined,
      }));
    },
    enabled: !!phoneNumberId,
  });
}

export function useCreateStatusHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (history: Omit<StatusHistory, 'id'>) => {
      const { data, error } = await supabase
        .from('status_history')
        .insert({
          phone_number_id: history.phoneNumberId,
          quality_rating: history.qualityRating,
          messaging_limit_tier: history.messagingLimitTier,
          previous_quality: history.previousQuality,
          changed_at: history.changedAt,
          expected_recovery: history.expectedRecovery,
          observation: history.observation,
          is_error: history.isError,
          error_message: history.errorMessage,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['status-history', variables.phoneNumberId] });
      console.log('[STATUS_HISTORY] Histórico criado com sucesso');
    },
    onError: (error) => {
      console.error('[STATUS_HISTORY] Erro ao inserir histórico:', error);
      toast.error('Erro ao salvar histórico de status');
    },
  });
}

// Atualiza apenas o timestamp do último registro de histórico (quando não há mudanças)
export function useUpdateLastStatusHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phoneNumberId, newTimestamp }: { phoneNumberId: string; newTimestamp: string }) => {
      // Busca o último registro do número
      const { data: lastRecord, error: selectError } = await supabase
        .from('status_history')
        .select('id')
        .eq('phone_number_id', phoneNumberId)
        .order('changed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selectError) throw selectError;
      if (!lastRecord) return null;

      // Atualiza o timestamp
      const { error: updateError } = await supabase
        .from('status_history')
        .update({ changed_at: newTimestamp })
        .eq('id', lastRecord.id);

      if (updateError) throw updateError;
      return lastRecord.id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['status-history', variables.phoneNumberId] });
      console.log('[STATUS_HISTORY] Timestamp atualizado com sucesso');
    },
    onError: (error) => {
      console.error('[STATUS_HISTORY] Erro ao atualizar timestamp:', error);
    },
  });
}

// ===================== STATUS CHANGE NOTIFICATIONS =====================

export function useStatusChangeNotifications(phoneNumberId?: string) {
  return useQuery({
    queryKey: ['status-notifications', phoneNumberId],
    queryFn: async () => {
      if (!phoneNumberId) return [];
      
      const { data, error } = await supabase
        .from('status_change_notifications')
        .select('*')
        .eq('phone_number_id', phoneNumberId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      
      return data.map((n): StatusChangeNotification => ({
        id: n.id,
        phoneNumberId: n.phone_number_id,
        projectId: n.project_id,
        previousQuality: n.previous_quality as QualityRating,
        newQuality: n.new_quality as QualityRating,
        direction: n.direction as 'up' | 'down',
        changedAt: n.changed_at,
        read: n.read || undefined,
      }));
    },
    enabled: !!phoneNumberId,
  });
}

export function useAllStatusChangeNotifications(projectId?: string) {
  return useQuery({
    queryKey: ['status-notifications-all', projectId],
    queryFn: async () => {
      let query = supabase
        .from('status_change_notifications')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(50);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data.map((n): StatusChangeNotification => ({
        id: n.id,
        phoneNumberId: n.phone_number_id,
        projectId: n.project_id,
        previousQuality: n.previous_quality as QualityRating,
        newQuality: n.new_quality as QualityRating,
        direction: n.direction as 'up' | 'down',
        changedAt: n.changed_at,
        read: n.read || undefined,
      }));
    },
  });
}

export function useCreateStatusChangeNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: Omit<StatusChangeNotification, 'id'>) => {
      const { data, error } = await supabase
        .from('status_change_notifications')
        .insert({
          phone_number_id: notification.phoneNumberId,
          project_id: notification.projectId,
          previous_quality: notification.previousQuality,
          new_quality: notification.newQuality,
          direction: notification.direction,
          changed_at: notification.changedAt,
          read: notification.read,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['status-notifications', variables.phoneNumberId] });
      queryClient.invalidateQueries({ queryKey: ['status-notifications-all'] });
    },
  });
}

export function useClearNumberNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phoneNumberId: string) => {
      const { error } = await supabase
        .from('status_change_notifications')
        .delete()
        .eq('phone_number_id', phoneNumberId);

      if (error) throw error;
    },
    onSuccess: (_, phoneNumberId) => {
      queryClient.invalidateQueries({ queryKey: ['status-notifications', phoneNumberId] });
      queryClient.invalidateQueries({ queryKey: ['status-notifications-all'] });
      toast.success('Notificações limpas!');
    },
  });
}
