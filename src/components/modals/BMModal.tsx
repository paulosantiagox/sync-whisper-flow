import { useState, useEffect } from 'react';
import { BusinessManager } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BMModalProps {
  bm: BusinessManager | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (bm: BusinessManager) => void;
}

const BMModal = ({ bm, projectId, open, onOpenChange, onSave }: BMModalProps) => {
  const [mainBmName, setMainBmName] = useState('');
  const [mainBmId, setMainBmId] = useState('');
  const [subBmName, setSubBmName] = useState('');
  const [subBmId, setSubBmId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (bm) {
      setMainBmName(bm.mainBmName);
      setMainBmId(bm.mainBmId);
      setSubBmName(bm.subBmName || '');
      setSubBmId(bm.subBmId || '');
      setCardName(bm.cardName || '');
      setCardLast4(bm.cardLast4 || '');
      setAccessToken(bm.accessToken);
    } else {
      setMainBmName('');
      setMainBmId('');
      setSubBmName('');
      setSubBmId('');
      setCardName('');
      setCardLast4('');
      setAccessToken('');
    }
  }, [bm, open]);

  const handleSave = () => {
    if (!mainBmName.trim() || !mainBmId.trim() || !accessToken.trim()) return;

    const bmData: BusinessManager = {
      id: bm?.id || `bm_${Date.now()}`,
      projectId,
      mainBmName: mainBmName.trim(),
      mainBmId: mainBmId.trim(),
      subBmName: subBmName.trim() || undefined,
      subBmId: subBmId.trim() || undefined,
      cardName: cardName.trim() || undefined,
      cardLast4: cardLast4.trim() || undefined,
      accessToken: accessToken.trim(),
      createdAt: bm?.createdAt || new Date().toISOString(),
    };

    onSave(bmData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{bm ? 'Editar BM' : 'Cadastrar Nova BM'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mainBmName">Nome BM Principal *</Label>
              <Input
                id="mainBmName"
                value={mainBmName}
                onChange={(e) => setMainBmName(e.target.value)}
                placeholder="Ex: BM Principal Loja"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mainBmId">ID BM Principal *</Label>
              <Input
                id="mainBmId"
                value={mainBmId}
                onChange={(e) => setMainBmId(e.target.value)}
                placeholder="Ex: 111222333444"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subBmName">Nome Sub BM (opcional)</Label>
              <Input
                id="subBmName"
                value={subBmName}
                onChange={(e) => setSubBmName(e.target.value)}
                placeholder="Ex: Sub BM Vendas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subBmId">ID Sub BM (opcional)</Label>
              <Input
                id="subBmId"
                value={subBmId}
                onChange={(e) => setSubBmId(e.target.value)}
                placeholder="Ex: 555666777888"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cardName">Nome do Cartão (opcional)</Label>
              <Input
                id="cardName"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Ex: Visa Final 4242"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardLast4">Últimos 4 dígitos (opcional)</Label>
              <Input
                id="cardLast4"
                value={cardLast4}
                onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Ex: 4242"
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessToken">Token de Acesso *</Label>
            <Input
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAxxxxxxxxxxxxxxx..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!mainBmName.trim() || !mainBmId.trim() || !accessToken.trim()}
              className="gradient-primary"
            >
              {bm ? 'Salvar Alterações' : 'Cadastrar BM'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BMModal;
