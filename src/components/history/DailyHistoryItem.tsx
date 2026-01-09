import { useState } from 'react';
import { StatusHistory, QualityRating } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, Calendar } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DailyHistoryGroup {
  date: string; // "2026-01-08"
  displayDate: string; // "08/01/2026"
  finalStatus: QualityRating; // Status no final do dia
  initialStatus: QualityRating; // Status no início do dia  
  hasStatusChange: boolean; // Se houve mudança de status no dia
  previousDayStatus?: QualityRating; // Status do dia anterior
  verificationCount: number; // Quantidade de verificações
  entries: StatusHistory[]; // Todas as verificações do dia
}

interface DailyHistoryItemProps {
  dayGroup: DailyHistoryGroup;
}

const getStatusBadge = (rating: QualityRating) => {
  switch (rating) {
    case 'HIGH':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">🟢 Alta</span>;
    case 'MEDIUM':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning">🟡 Média</span>;
    case 'LOW':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">🔴 Baixa</span>;
    default:
      return <span className="text-muted-foreground">-</span>;
  }
};

const getStatusChangeIndicator = (dayGroup: DailyHistoryGroup) => {
  const { hasStatusChange, previousDayStatus, finalStatus, initialStatus } = dayGroup;
  
  // Se houve mudança interna no dia
  if (hasStatusChange) {
    const qualityValue: Record<QualityRating, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const diff = qualityValue[finalStatus] - qualityValue[initialStatus];
    
    if (diff > 0) {
      return (
        <div className="flex items-center gap-1 text-success text-xs">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Subiu de {initialStatus === 'MEDIUM' ? 'Média' : 'Baixa'}</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center gap-1 text-destructive text-xs">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Desceu de {initialStatus === 'HIGH' ? 'Alta' : 'Média'}</span>
        </div>
      );
    }
  }
  
  // Se mudou em relação ao dia anterior
  if (previousDayStatus && previousDayStatus !== finalStatus) {
    const qualityValue: Record<QualityRating, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const diff = qualityValue[finalStatus] - qualityValue[previousDayStatus];
    
    if (diff > 0) {
      return (
        <div className="flex items-center gap-1 text-success text-xs">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Subiu</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-destructive text-xs">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Desceu</span>
        </div>
      );
    }
  }
  
  return (
    <div className="flex items-center gap-1 text-muted-foreground text-xs">
      <Minus className="w-3.5 h-3.5" />
      <span>Estável</span>
    </div>
  );
};

const getDateLabel = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  
  if (isToday(date)) {
    return 'Hoje';
  }
  if (isYesterday(date)) {
    return 'Ontem';
  }
  return format(date, "EEEE", { locale: ptBR });
};

const DailyHistoryItem = ({ dayGroup }: DailyHistoryItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const dateLabel = getDateLabel(dayGroup.date);
  const dateFormatted = format(new Date(dayGroup.date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });

  return (
    <Card className="overflow-hidden">
      {/* Header - Resumo do Dia */}
      <button 
        className="w-full p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Ícone de expansão */}
          <div className="text-muted-foreground">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          
          {/* Data */}
          <div className="flex items-center gap-2 min-w-[140px]">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{dateFormatted}</p>
              <p className="text-xs text-muted-foreground capitalize">{dateLabel}</p>
            </div>
          </div>
          
          {/* Status Final */}
          <div className="flex items-center gap-2">
            {getStatusBadge(dayGroup.finalStatus)}
          </div>
          
          {/* Indicador de Mudança */}
          <div className="hidden sm:flex">
            {getStatusChangeIndicator(dayGroup)}
          </div>
        </div>
        
        {/* Contagem de Verificações */}
        <div className="flex items-center gap-2 text-muted-foreground text-xs shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>{dayGroup.verificationCount} {dayGroup.verificationCount === 1 ? 'verificação' : 'verificações'}</span>
        </div>
      </button>
      
      {/* Lista de Verificações Expandida */}
      {isExpanded && (
        <div className="border-t bg-muted/30">
          <div className="divide-y divide-border">
            {dayGroup.entries.map((entry, index) => (
              <div key={entry.id} className="px-4 py-3 flex items-center gap-4 pl-12">
                {/* Horário */}
                <div className="w-16 text-sm font-medium text-muted-foreground">
                  {format(new Date(entry.changedAt), "HH:mm", { locale: ptBR })}
                </div>
                
                {/* Status */}
                <div className="w-24">
                  {getStatusBadge(entry.qualityRating)}
                </div>
                
                {/* Status Anterior (se mudou) */}
                {entry.previousQuality && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">de</span>
                    {getStatusBadge(entry.previousQuality)}
                  </div>
                )}
                
                {/* Limite */}
                <div className="text-sm text-muted-foreground">
                  Limite: {entry.messagingLimitTier}
                </div>
                
                {/* Observação */}
                {entry.observation && (
                  <div className="flex-1 text-xs text-muted-foreground truncate" title={entry.observation}>
                    {entry.observation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default DailyHistoryItem;
