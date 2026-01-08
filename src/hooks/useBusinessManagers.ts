import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BusinessManager } from '@/types';
import { toast } from 'sonner';

export function useBusinessManagers(projectId?: string) {
  return useQuery({
    queryKey: ['business-managers', projectId],
    queryFn: async () => {
      let query = supabase
        .from('business_managers')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data.map((bm): BusinessManager => ({
        id: bm.id,
        projectId: bm.project_id,
        mainBmName: bm.main_bm_name,
        mainBmId: bm.main_bm_id,
        subBmName: bm.sub_bm_name || undefined,
        subBmId: bm.sub_bm_id || undefined,
        cardName: bm.card_name || undefined,
        cardLast4: bm.card_last4 || undefined,
        accessToken: bm.access_token,
        createdAt: bm.created_at,
      }));
    },
    enabled: projectId !== undefined,
  });
}

export function useCreateBusinessManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bm: Omit<BusinessManager, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('business_managers')
        .insert({
          project_id: bm.projectId,
          main_bm_name: bm.mainBmName,
          main_bm_id: bm.mainBmId,
          sub_bm_name: bm.subBmName,
          sub_bm_id: bm.subBmId,
          card_name: bm.cardName,
          card_last4: bm.cardLast4,
          access_token: bm.accessToken,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-managers', variables.projectId] });
      toast.success('Business Manager cadastrada!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar BM');
      console.error(error);
    },
  });
}

export function useUpdateBusinessManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<BusinessManager> & { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('business_managers')
        .update({
          main_bm_name: updates.mainBmName,
          main_bm_id: updates.mainBmId,
          sub_bm_name: updates.subBmName,
          sub_bm_id: updates.subBmId,
          card_name: updates.cardName,
          card_last4: updates.cardLast4,
          access_token: updates.accessToken,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-managers', variables.projectId] });
      toast.success('BM atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar BM');
      console.error(error);
    },
  });
}

export function useDeleteBusinessManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('business_managers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-managers', variables.projectId] });
      toast.success('BM removida!');
    },
    onError: (error) => {
      toast.error('Erro ao remover BM');
      console.error(error);
    },
  });
}
