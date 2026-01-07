import { WhatsAppNumber } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QualityBadge from './QualityBadge';
import { Phone, History, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NumberCardProps {
  number: WhatsAppNumber;
  onViewHistory?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const NumberCard = ({ number, onViewHistory, onEdit, onDelete }: NumberCardProps) => {
  const getRecoveryDate = () => {
    if (number.qualityRating === 'HIGH') return null;
    const recoveryDate = addDays(new Date(number.lastChecked), 7);
    return format(recoveryDate, "dd/MM/yyyy", { locale: ptBR });
  };

  const recoveryDate = getRecoveryDate();

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-elevated animate-slide-up",
      !number.isVisible && "opacity-50 grayscale"
    )}>
      {/* Status indicator bar */}
      <div className={cn(
        "h-1",
        number.qualityRating === 'HIGH' && "gradient-success",
        number.qualityRating === 'MEDIUM' && "gradient-warning",
        number.qualityRating === 'LOW' && "gradient-danger"
      )} />
      
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar/Photo */}
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {number.photo ? (
              <img 
                src={number.photo} 
                alt={number.verifiedName} 
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Phone className="w-6 h-6 text-primary" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">
                {number.displayPhoneNumber}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {number.verifiedName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <QualityBadge rating={number.qualityRating} size="sm" />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {number.messagingLimitTier}
              </span>
            </div>

            {recoveryDate && (
              <p className="text-xs text-warning flex items-center gap-1">
                ⏱️ Previsão recuperação: {recoveryDate}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              ID: {number.phoneNumberId}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onViewHistory}
          >
            <History className="w-4 h-4 mr-1" />
            Histórico
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NumberCard;
