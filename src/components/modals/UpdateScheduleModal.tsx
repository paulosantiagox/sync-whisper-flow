import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjectSchedules, useCreateProjectSchedule, useUpdateProjectSchedule, useDeleteProjectSchedule } from '@/hooks/useProjectSchedules';
import { Clock, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UpdateScheduleModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_SCHEDULES = 7;
const RECOMMENDED_SCHEDULES = 3;

export default function UpdateScheduleModal({ projectId, open, onOpenChange }: UpdateScheduleModalProps) {
  const { data: schedules = [], isLoading } = useProjectSchedules(projectId);
  const createSchedule = useCreateProjectSchedule();
  const updateSchedule = useUpdateProjectSchedule();
  const deleteSchedule = useDeleteProjectSchedule();

  const [newTime, setNewTime] = useState('12:00');

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
              {schedules.map((schedule, index) => (
                <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <span className="text-sm font-medium text-muted-foreground w-24">
                    Atualização {index + 1}
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
              ))}

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

          <p className="text-xs text-muted-foreground text-center pt-2">
            Máximo de {MAX_SCHEDULES} atualizações por dia • Recomendado: {RECOMMENDED_SCHEDULES}x
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
