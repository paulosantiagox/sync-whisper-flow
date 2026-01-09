import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function BrasiliaClockWidget({ collapsed = false }: { collapsed?: boolean }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatar data completa em português - Brasília
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Formatar hora com segundos - Brasília
  const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = dateFormatter.format(now);
  const formattedTime = timeFormatter.format(now);

  // Capitalizar primeira letra do dia da semana
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-2 px-1">
        <Clock className="w-4 h-4 text-sidebar-foreground/60 mb-1" />
        <span className="text-xs font-mono font-semibold text-sidebar-foreground">
          {formattedTime.slice(0, 5)}
        </span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 mb-2 rounded-lg bg-sidebar-accent/50">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-3.5 h-3.5 text-sidebar-foreground/60" />
        <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wide">
          Horário de Brasília
        </span>
      </div>
      <p className="text-xs text-sidebar-foreground/80 capitalize leading-tight">
        {capitalizedDate}
      </p>
      <p className="text-lg font-mono font-bold text-sidebar-foreground tabular-nums">
        {formattedTime}
      </p>
    </div>
  );
}
