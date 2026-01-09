import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Plus, Trash2, AlertCircle, CheckCircle, Loader2, Circle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useProjectSchedules, 
  useCreateProjectSchedule, 
  useDeleteProjectSchedule,
  useUpdateProjectSchedule,
} from '@/hooks/useProjectSchedules';
import { useProjectScheduleExecutions, useLastProjectExecution } from '@/hooks/useProjectScheduleExecutions';

interface UpdateScheduleModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_SCHEDULES = 6;
const RECOMMENDED_SCHEDULES = 4;

// Formata string de tempo para HH:MM
function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    const hours = digits.slice(0, 2);
    const minutes = digits.slice(2);
    return `${hours}:${minutes}`;
  }
  const hours = digits.slice(0, 2);
  const minutes = digits.slice(2, 4);
  return `${hours}:${minutes}`;
}

// Valida se o horário é válido (HH:MM, 00-23:00-59)
function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [h, m] = time.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

// Componente de input de horário com forwardRef
const TimeInput = forwardRef<HTMLInputElement, { 
  value: string; 
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}>(({ value, onChange, onBlur, placeholder = "HH:MM", className = "" }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    onChange(formatted);
  };

  const isValid = value === '' || isValidTime(value);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        maxLength={5}
        className={`${className} ${!isValid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
      />
      {!isValid && value !== '' && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-destructive">
          <AlertCircle className="h-4 w-4" />
        </span>
      )}
    </div>
  );
});

TimeInput.displayName = 'TimeInput';

type ScheduleStatus = 'waiting' | 'executed' | 'missed' | 'next';

// Obtém hora atual de Brasília
function getCurrentBrasiliaTime(): { hours: number; minutes: number; formatted: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const formatted = formatter.format(now);
  const [hours, minutes] = formatted.split(':').map(Number);
  return { hours, minutes, formatted };
}

// Determina o status do schedule baseado na hora atual e execuções reais
function getScheduleStatus(
  scheduleTime: string, 
  executedTimes: Set<string>
): ScheduleStatus {
  const { hours: currentH, minutes: currentM } = getCurrentBrasiliaTime();
  const [schedH, schedM] = scheduleTime.split(':').map(Number);
  
  const currentMinutes = currentH * 60 + currentM;
  const schedMinutes = schedH * 60 + schedM;
  const diff = schedMinutes - currentMinutes; // positivo = futuro, negativo = passado

  // Verifica se foi executado hoje
  if (executedTimes.has(scheduleTime)) {
    return 'executed';
  }

  // Se está no futuro próximo (0 a 2 min), é o próximo
  if (diff >= 0 && diff <= 2) {
    return 'next';
  }

  // Se está no futuro (mais de 2 min), aguardando
  if (diff > 2) {
    return 'waiting';
  }

  // Se já passou e não foi executado, não executado (missed)
  return 'missed';
}

function ScheduleStatusIndicator({ status }: { status: ScheduleStatus }) {
  const config = {
    waiting: { 
      icon: Circle, 
      color: 'text-muted-foreground', 
      animate: '',
      tooltip: 'Aguardando'
    },
    executed: { 
      icon: CheckCircle, 
      color: 'text-green-500', 
      animate: '',
      tooltip: 'Executado'
    },
    missed: { 
      icon: AlertCircle, 
      color: 'text-orange-500', 
      animate: '',
      tooltip: 'Não executado'
    },
    next: { 
      icon: Loader2, 
      color: 'text-blue-500', 
      animate: 'animate-spin',
      tooltip: 'Próximo'
    },
  }[status];

  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 ${config.color}`} title={config.tooltip}>
      <Icon className={`h-3 w-3 ${config.animate}`} />
      <span className="text-xs">{config.tooltip}</span>
    </span>
  );
}

export default function UpdateScheduleModal({ projectId, open, onOpenChange }: UpdateScheduleModalProps) {
  const { data: schedules = [], isLoading } = useProjectSchedules(projectId);
  const { data: executions = [] } = useProjectScheduleExecutions(projectId);
  const { data: lastExecution } = useLastProjectExecution(projectId);
  const createSchedule = useCreateProjectSchedule();
  const updateSchedule = useUpdateProjectSchedule();
  const deleteSchedule = useDeleteProjectSchedule();

  const [newTime, setNewTime] = useState('12:00');
  const [editingTimes, setEditingTimes] = useState<Record<string, string>>({});
  const [, setTick] = useState(0);

  // Set de horários executados hoje
  const executedTimes = new Set(executions.map(e => e.scheduleTime));

  // Atualiza os indicadores de status a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sincroniza horários editados quando schedules mudam
  useEffect(() => {
    const times: Record<string, string> = {};
    schedules.forEach(s => {
      times[s.id] = s.time;
    });
    setEditingTimes(times);
  }, [schedules]);

  const handleAddSchedule = useCallback(() => {
    if (schedules.length >= MAX_SCHEDULES) return;
    if (!isValidTime(newTime)) {
      toast.error('Horário inválido. Use o formato HH:MM');
      return;
    }
    
    const nextOrder = schedules.length + 1;
    createSchedule.mutate({
      projectId,
      time: newTime,
      order: nextOrder,
    }, {
      onSuccess: () => {
        toast.success('Horário adicionado!');
      }
    });
  }, [schedules.length, newTime, createSchedule, projectId]);

  const handleTimeChange = useCallback((id: string, value: string) => {
    setEditingTimes(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleTimeBlur = useCallback((id: string) => {
    const time = editingTimes[id];
    if (time && isValidTime(time)) {
      const currentSchedule = schedules.find(s => s.id === id);
      if (currentSchedule && currentSchedule.time !== time) {
        updateSchedule.mutate({ id, projectId, time }, {
          onSuccess: () => {
            toast.success('Horário atualizado!');
          }
        });
      }
    }
  }, [editingTimes, schedules, updateSchedule, projectId]);

  const handleDeleteSchedule = useCallback((id: string) => {
    deleteSchedule.mutate({ id, projectId });
  }, [deleteSchedule, projectId]);

  // Ordenar schedules por horário
  const sortedSchedules = [...schedules].sort((a, b) => {
    const [ah, am] = a.time.split(':').map(Number);
    const [bh, bm] = b.time.split(':').map(Number);
    return (ah * 60 + am) - (bh * 60 + bm);
  });

  const isNewTimeValid = isValidTime(newTime);

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
          {/* Última execução */}
          {lastExecution && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Última verificação: {formatDistanceToNow(new Date(lastExecution.executedAt), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                  {lastExecution.brasiliaTime && (
                    <span className="ml-1">({lastExecution.brasiliaTime})</span>
                  )}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {lastExecution.numbersUpdated} números
              </span>
            </div>
          )}

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
                const status = getScheduleStatus(schedule.time, executedTimes);
                
                return (
                  <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <ScheduleStatusIndicator status={status} />
                    <span className="text-sm font-medium text-muted-foreground w-20">
                      Horário {index + 1}
                    </span>
                    <TimeInput
                      value={editingTimes[schedule.id] || schedule.time}
                      onChange={(value) => handleTimeChange(schedule.id, value)}
                      onBlur={() => handleTimeBlur(schedule.id)}
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
              <TimeInput
                value={newTime}
                onChange={setNewTime}
                placeholder="HH:MM"
                className="flex-1"
              />
              <Button
                onClick={handleAddSchedule}
                disabled={createSchedule.isPending || !isNewTimeValid}
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
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-muted-foreground">Próximo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">Não executado</span>
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
