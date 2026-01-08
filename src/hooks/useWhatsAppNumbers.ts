import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { WhatsAppNumber, QualityRating } from '@/types';
import { toast } from 'sonner';

export function useWhatsAppNumbers(projectId?: string) {
  return useQuery({
    queryKey: ['whatsapp-numbers', projectId],
    queryFn: async () => {
      let query = supabase
        .from('whatsapp_numbers')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data.map((n): WhatsAppNumber => ({
        id: n.id,
        projectId: n.project_id,
        businessManagerId: n.business_manager_id || undefined,
        phoneNumberId: n.phone_number_id,
        displayPhoneNumber: n.display_phone_number,
        verifiedName: n.verified_name,
        customName: n.custom_name || undefined,
        qualityRating: n.quality_rating as QualityRating,
        messagingLimitTier: n.messaging_limit_tier,
        photo: n.photo || undefined,
        wabaId: n.waba_id,
        isVisible: n.is_visible,
        observation: n.observation || undefined,
        createdAt: n.created_at,
        lastChecked: n.last_checked,
      }));
    },
    enabled: projectId !== undefined,
  });
}

export function useAllWhatsAppNumbers() {
  return useQuery({
    queryKey: ['whatsapp-numbers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map((n): WhatsAppNumber => ({
        id: n.id,
        projectId: n.project_id,
        businessManagerId: n.business_manager_id || undefined,
        phoneNumberId: n.phone_number_id,
        displayPhoneNumber: n.display_phone_number,
        verifiedName: n.verified_name,
        customName: n.custom_name || undefined,
        qualityRating: n.quality_rating as QualityRating,
        messagingLimitTier: n.messaging_limit_tier,
        photo: n.photo || undefined,
        wabaId: n.waba_id,
        isVisible: n.is_visible,
        observation: n.observation || undefined,
        createdAt: n.created_at,
        lastChecked: n.last_checked,
      }));
    },
  });
}

export function useCreateWhatsAppNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (number: Omit<WhatsAppNumber, 'id' | 'createdAt' | 'lastChecked'>) => {
      const { data, error } = await supabase
        .from('whatsapp_numbers')
        .insert({
          project_id: number.projectId,
          business_manager_id: number.businessManagerId,
          phone_number_id: number.phoneNumberId,
          display_phone_number: number.displayPhoneNumber,
          verified_name: number.verifiedName,
          custom_name: number.customName,
          quality_rating: number.qualityRating,
          messaging_limit_tier: number.messagingLimitTier,
          photo: number.photo,
          waba_id: number.wabaId,
          is_visible: number.isVisible,
          observation: number.observation,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers-all'] });
      toast.success('Número adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar número');
      console.error(error);
    },
  });
}

export function useUpdateWhatsAppNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<WhatsAppNumber> & { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('whatsapp_numbers')
        .update({
          business_manager_id: updates.businessManagerId,
          custom_name: updates.customName,
          quality_rating: updates.qualityRating,
          messaging_limit_tier: updates.messagingLimitTier,
          photo: updates.photo,
          is_visible: updates.isVisible,
          observation: updates.observation,
          verified_name: updates.verifiedName,
          display_phone_number: updates.displayPhoneNumber,
          last_checked: updates.lastChecked || new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers-all'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar número');
      console.error(error);
    },
  });
}

export function useDeleteWhatsAppNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('whatsapp_numbers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers-all'] });
      toast.success('Número removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover número');
      console.error(error);
    },
  });
}
