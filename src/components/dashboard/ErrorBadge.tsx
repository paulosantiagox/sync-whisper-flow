import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NumberErrorState } from '@/types';

interface ErrorBadgeProps {
  errorState?: NumberErrorState;
}

const ErrorBadge = ({ errorState }: ErrorBadgeProps) => {
  if (!errorState || errorState.errorCount === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative inline-flex">
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
            {errorState.errorCount > 9 ? '9+' : errorState.errorCount}
          </div>
          <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-destructive" />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold text-destructive">Erro na atualização</p>
          <p className="text-xs text-muted-foreground">{errorState.lastError}</p>
          <p className="text-xs text-muted-foreground">
            {errorState.errorCount} tentativa(s) com erro
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default ErrorBadge;