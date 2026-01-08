import { useState, useEffect } from 'react';
import { BusinessManager } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { fetchBusinessManagerName, fetchWABAName } from '@/services/metaApi';

interface BMModalProps {
  bm: BusinessManager | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (bm: BusinessManager) => void;
  existingBMs: BusinessManager[];
}

type Step = 'input' | 'loading' | 'confirm';

const BMModal = ({ bm, projectId, open, onOpenChange, onSave, existingBMs }: BMModalProps) => {
  const [step, setStep] = useState<Step>('input');
  const [mainBmId, setMainBmId] = useState('');
  const [subBmId, setSubBmId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [accessToken, setAccessToken] = useState('');
  
  // Fetched data
  const [mainBmName, setMainBmName] = useState('');
  const [subBmName, setSubBmName] = useState('');
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');

  useEffect(() => {
    if (bm) {
      setMainBmId(bm.mainBmId);
      setSubBmId(bm.subBmId || '');
      setCardName(bm.cardName || '');
      setCardLast4(bm.cardLast4 || '');
      setAccessToken(bm.accessToken);
      setMainBmName(bm.mainBmName);
      setSubBmName(bm.subBmName || '');
      setStep('confirm');
    } else {
      resetForm();
    }
  }, [bm, open]);

  const resetForm = () => {
    setStep('input');
    setMainBmId('');
    setSubBmId('');
    setCardName('');
    setCardLast4('');
    setAccessToken('');
    setMainBmName('');
    setSubBmName('');
    setError('');
    setDuplicateWarning('');
  };

  const checkDuplicate = (wabaId: string): boolean => {
    const existing = existingBMs.find(
      existingBm => existingBm.subBmId === wabaId && existingBm.id !== bm?.id
    );
    if (existing) {
      setDuplicateWarning(`Esta Sub BM (WABA) já está cadastrada como "${existing.subBmName}"`);
      return true;
    }
    setDuplicateWarning('');
    return false;
  };

  const handleFetchData = async () => {
    if (!mainBmId.trim() || !subBmId.trim() || !accessToken.trim()) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    // Check for duplicate before fetching
    if (checkDuplicate(subBmId.trim())) {
      return;
    }

    setStep('loading');
    setError('');

    try {
      // Fetch both names in parallel
      const [bmData, wabaData] = await Promise.all([
        fetchBusinessManagerName(mainBmId.trim(), accessToken.trim()),
        fetchWABAName(subBmId.trim(), accessToken.trim()),
      ]);

      setMainBmName(bmData.name);
      setSubBmName(wabaData.name);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados da API');
      setStep('input');
    }
  };

  const handleSave = () => {
    const bmData: BusinessManager = {
      id: bm?.id || `bm_${Date.now()}`,
      projectId,
      mainBmName: mainBmName.trim(),
      mainBmId: mainBmId.trim(),
      subBmName: subBmName.trim(),
      subBmId: subBmId.trim(),
      cardName: cardName.trim() || undefined,
      cardLast4: cardLast4.trim() || undefined,
      accessToken: accessToken.trim(),
      createdAt: bm?.createdAt || new Date().toISOString(),
    };

    onSave(bmData);
    onOpenChange(false);
    resetForm();
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{bm ? 'Editar BM' : 'Cadastrar Nova BM'}</DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {duplicateWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{duplicateWarning}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="mainBmId">ID da BM Principal *</Label>
              <Input
                id="mainBmId"
                value={mainBmId}
                onChange={(e) => setMainBmId(e.target.value)}
                placeholder="Ex: 917659149754317"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subBmId">ID da Sub BM (WABA) *</Label>
              <Input
                id="subBmId"
                value={subBmId}
                onChange={(e) => {
                  setSubBmId(e.target.value);
                  setDuplicateWarning('');
                }}
                placeholder="Ex: 1338898483886191"
              />
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

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleFetchData} 
                disabled={!mainBmId.trim() || !subBmId.trim() || !accessToken.trim()}
                className="gradient-primary"
              >
                Buscar Dados
              </Button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Buscando dados da API do Meta...</p>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4 mt-4">
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Dados encontrados com sucesso!
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">BM Principal</p>
                <p className="font-medium">{mainBmName}</p>
                <p className="text-xs text-muted-foreground">ID: {mainBmId}</p>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground">Sub BM (WABA)</p>
                <p className="font-medium">{subBmName}</p>
                <p className="text-xs text-muted-foreground">ID: {subBmId}</p>
              </div>

              {(cardName || cardLast4) && (
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground">Cartão</p>
                  <p className="font-medium">
                    {cardName || 'Não informado'} 
                    {cardLast4 && ` (****${cardLast4})`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('input')}>
                Voltar
              </Button>
              <Button onClick={handleSave} className="gradient-primary">
                {bm ? 'Salvar Alterações' : 'Confirmar e Cadastrar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BMModal;
