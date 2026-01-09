import { Button } from '@/components/ui/button';
import { Pin, PinOff, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SortableControlsProps {
  isPinned: boolean;
  onTogglePin: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  showDragHandle?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function SortableControls({
  isPinned,
  onTogglePin,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  showDragHandle = false,
  size = 'sm',
  className,
}: SortableControlsProps) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-0.5', className)}>
        {showDragHandle && (
          <div className={cn('cursor-grab active:cursor-grabbing text-muted-foreground', buttonSize, 'flex items-center justify-center')}>
            <GripVertical className={iconSize} />
          </div>
        )}

        {onMoveUp && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={buttonSize}
                onClick={onMoveUp}
                disabled={!canMoveUp}
              >
                <ChevronUp className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mover para cima</TooltipContent>
          </Tooltip>
        )}

        {onMoveDown && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={buttonSize}
                onClick={onMoveDown}
                disabled={!canMoveDown}
              >
                <ChevronDown className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mover para baixo</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(buttonSize, isPinned && 'text-primary')}
              onClick={onTogglePin}
            >
              {isPinned ? <Pin className={iconSize} /> : <PinOff className={iconSize} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isPinned ? 'Desfixar' : 'Fixar no topo'}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
