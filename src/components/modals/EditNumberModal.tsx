import { useState, useEffect } from 'react';
import { WhatsAppNumber } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Phone, Tag, Eye, MessageSquare, Loader2, CheckCircle } from 'lucide-react';

interface EditNumberModalProps {
  number: WhatsAppNumber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<WhatsAppNumber>) => void;
}

const EditNumberModal = ({ number, open, onOpenChange, onSave }: EditNumberModalProps) => {
  const [customName, setCustomName] = useState('');
  const [observation, setObservation] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when number changes
  useEffect(() => {
    if (number) {
      setCustomName(number.customName || '');
      setObservation(number.observation || '');
      setIsVisible(number.isVisible);
    }
  }, [number]);

  const handleSave = async () => {
    if (!number) return;
    
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSave(number.id, {
      customName: customName.trim() || undefined,
      observation: observation.trim() || undefined,
      isVisible,
    });
    
    setIsSaving(false);
    onOpenChange(false);
  };

  if (!number) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Editar Número
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Read-only info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Informações do WhatsApp (não editáveis)</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nome Verificado:</span>
                <p className="font-medium">{number.verifiedName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Telefone:</span>
                <p className="font-medium">{number.displayPhoneNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone ID:</span>
                <p className="font-medium font-mono text-xs">{number.phoneNumberId}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Quality:</span>
                <p className={`font-medium ${
                  number.qualityRating === 'HIGH' ? 'text-success' :
                  number.qualityRating === 'MEDIUM' ? 'text-warning' : 'text-destructive'
                }`}>
                  {number.qualityRating === 'HIGH' ? '🟢 Alta' :
                   number.qualityRating === 'MEDIUM' ? '🟡 Média' : '🔴 Baixa'}
                </p>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customName" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Nome Personalizado
              </Label>
              <Input
                id="customName"
                placeholder="Ex: Conta API 1, Conta API 2..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Este nome é para seu controle interno e aparecerá em destaque no card.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observation" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Observações
              </Label>
              <Textarea
                id="observation"
                placeholder="Anotações sobre este número..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="visibility" className="cursor-pointer">Visibilidade</Label>
                  <p className="text-xs text-muted-foreground">
                    Quando desativado, o card fica com destaque reduzido
                  </p>
                </div>
              </div>
              <Switch
                id="visibility"
                checked={isVisible}
                onCheckedChange={setIsVisible}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditNumberModal;
