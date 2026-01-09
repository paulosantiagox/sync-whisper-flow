import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/sounds';

export function useAutoUpdateNotifications(projectId: string | undefined) {
  const lastUpdateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`auto-updates-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_numbers',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          // Evita múltiplos toasts para a mesma atualização
          const updateId = `${payload.new?.id}-${payload.new?.last_checked}`;
          if (lastUpdateRef.current === updateId) return;
          lastUpdateRef.current = updateId;

          // Verifica se foi uma atualização automática (vindo da Edge Function)
          // Comparando o timestamp para ver se é recente
          const lastChecked = payload.new?.last_checked;
          if (lastChecked) {
            const checkedTime = new Date(lastChecked).getTime();
            const now = Date.now();
            const diff = now - checkedTime;
            
            // Se a atualização foi feita nos últimos 5 segundos, mostra notificação
            if (diff < 5000) {
              const phoneNumber = payload.new?.display_phone_number || 'Número';
              const newQuality = payload.new?.quality_rating;
              const oldQuality = payload.old?.quality_rating;

              if (newQuality !== oldQuality) {
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
              } else {
                // Verificação sem mudança - notifica apenas se for a primeira do batch
                toast.info('🔄 Verificação automática realizada', {
                  description: `${phoneNumber} verificado`,
                });
                playNotificationSound('info');
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);
}

function getQualityDirection(oldQuality: string, newQuality: string): 'up' | 'down' {
  const qualityValue: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return qualityValue[newQuality] > qualityValue[oldQuality] ? 'up' : 'down';
}
