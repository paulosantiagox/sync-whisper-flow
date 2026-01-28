import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/sounds';
import { useQueryClient } from '@tanstack/react-query';

export function useAutoUpdateNotifications(projectId: string | undefined) {
  const lastUpdateRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`auto-updates-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waba_whatsapp_numbers',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newQuality = payload.new?.quality_rating;
          const oldQuality = payload.old?.quality_rating;

          // SÓ notifica se houve MUDANÇA de status
          // Ignora atualizações de last_checked sem mudança de qualidade
          if (newQuality === oldQuality) {
            // Apenas atualiza a query sem notificar
            queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers', projectId] });
            return;
          }

          // Evita múltiplos toasts para a mesma atualização
          const updateId = `${payload.new?.id}-${newQuality}-${payload.new?.last_checked}`;
          if (lastUpdateRef.current === updateId) return;
          lastUpdateRef.current = updateId;

          const phoneNumber = payload.new?.display_phone_number || 'Número';
          
          // Mudança de status
          const direction = getQualityDirection(oldQuality, newQuality);
          if (direction === 'up') {
            toast.success(`📈 ${phoneNumber} subiu para ${newQuality}`, {
              description: 'Atualização automática',
            });
            playNotificationSound('success');
          } else {
            toast.error(`📉 ${phoneNumber} caiu para ${newQuality}`, {
              description: 'Atualização automática',
            });
            playNotificationSound('error');
          }

          // Atualiza queries
          queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}

function getQualityDirection(oldQuality: string, newQuality: string): 'up' | 'down' {
  const qualityValue: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return qualityValue[newQuality] > qualityValue[oldQuality] ? 'up' : 'down';
}
