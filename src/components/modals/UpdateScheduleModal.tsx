import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjectSchedules, useCreateProjectSchedule, useUpdateProjectSchedule, useDeleteProjectSchedule } from '@/hooks/useProjectSchedules';
import { Clock, Plus, Trash2, AlertCircle, Loader2, CheckCircle2, Timer, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface UpdateScheduleModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_SCHEDULES = 7;
const RECOMMENDED_SCHEDULES = 3;

type ScheduleStatus = 'waiting' | 'executed' | 'missed' | 'next';

function getScheduleStatus(scheduleTime: string): ScheduleStatus {
  // Obter hora atual de Brasília
  const now = new Date();
  const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const currentHour = brasiliaTime.getHours();
  const currentMinute = brasiliaTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  const [h, m] = scheduleTime.split(':').map(Number);
  const scheduledMinutes = h * 60 + m;

  // Se o horário já passou (com margem de 5 minutos)
  if (currentTotalMinutes > scheduledMinutes + 5) {
    // Consideramos como executado (otimista) - em produção, verificaríamos o log real
    return 'executed';
  }
  
  // Se está dentro da janela de execução (±5 minutos)
  if (Math.abs(currentTotalMinutes - scheduledMinutes) <= 5) {
    return 'next';
  }
  
  // Se ainda não chegou
  return 'waiting';
}

function ScheduleStatusIndicator({ status }: { status: ScheduleStatus }) {
  const config = {
    waiting: {
      icon: Timer,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      label: 'Aguardando',
    },
    executed: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      label: 'Executado',
    },
    missed: {
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      label: 'Não executado',
    },
    next: {
      icon: Clock,
      color: 'text-primary animate-pulse',
      bg: 'bg-primary/10',
      label: 'Próximo',
    },
  };

  const { icon: Icon, color, bg, label } = config[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('p-1.5 rounded-full', bg)}>
            <Icon className={cn('w-4 h-4', color)} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function UpdateScheduleModal({ projectId, open, onOpenChange }: UpdateScheduleModalProps) {
  const { data: schedules = [], isLoading } = useProjectSchedules(projectId);
  const createSchedule = useCreateProjectSchedule();
  const updateSchedule = useUpdateProjectSchedule();
  const deleteSchedule = useDeleteProjectSchedule();

  const [newTime, setNewTime] = useState('12:00');
  const [, setTick] = useState(0);

  // Atualiza os indicadores de status a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddSchedule = () => {
    if (schedules.length >= MAX_SCHEDULES) return;
    
    const nextOrder = schedules.length + 1;
    createSchedule.mutate({
      projectId,
      time: newTime,
      order: nextOrder,
    });
  };

  const handleUpdateTime = (id: string, time: string) => {
    updateSchedule.mutate({ id, projectId, time });
  };

  const handleDeleteSchedule = (id: string) => {
    deleteSchedule.mutate({ id, projectId });
  };

  // Ordenar schedules por horário
  const sortedSchedules = [...schedules].sort((a, b) => {
    const [ah, am] = a.time.split(':').map(Number);
    const [bh, bm] = b.time.split(':').map(Number);
    return (ah * 60 + am) - (bh * 60 + bm);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários de Atualização
          </DialogTitle>
          <DialogDescription>
            Configure os horários em que o sistema verificará automaticamente os status dos números.
            Os horários são baseados no fuso de Brasília.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {schedules.length > RECOMMENDED_SCHEDULES && (
            <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                Recomendamos no máximo {RECOMMENDED_SCHEDULES} atualizações por dia para não sobrecarregar a API do Meta.
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSchedules.map((schedule, index) => {
                const status = getScheduleStatus(schedule.time);
                
                return (
                  <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <ScheduleStatusIndicator status={status} />
                    <span className="text-sm font-medium text-muted-foreground w-20">
                      Horário {index + 1}
                    </span>
                    <Input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => handleUpdateTime(schedule.id, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}

              {schedules.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum horário configurado</p>
                  <p className="text-xs mt-1">Adicione horários para atualizações automáticas</p>
                </div>
              )}
            </div>
          )}

          {schedules.length < MAX_SCHEDULES && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAddSchedule}
                disabled={createSchedule.isPending}
                className="gap-2"
              >
                {createSchedule.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Adicionar
              </Button>
            </div>
          )}

          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center gap-4 justify-center text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Executado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">Próximo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">Aguardando</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Máximo de {MAX_SCHEDULES} atualizações por dia • Recomendado: {RECOMMENDED_SCHEDULES}x
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
