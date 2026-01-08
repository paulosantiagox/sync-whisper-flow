import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchPhoneNumbers, 
  fetchPhoneNumberDetail, 
  MetaPhoneNumber, 
  MetaPhoneNumberDetail,
  mapMetaQuality,
  mapMessagingLimit 
} from '@/services/metaApi';
import { BusinessManager, WhatsAppNumber } from '@/types';
import { Building2, Phone, Loader2, CheckCircle, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import QualityBadge from '@/components/dashboard/QualityBadge';

interface AddNumberFromMetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  businessManagers: BusinessManager[];
  onAddNumber: (number: Omit<WhatsAppNumber, 'id' | 'createdAt' | 'lastChecked'>) => void;
}

type Step = 'select-bm' | 'loading-numbers' | 'select-number' | 'loading-details' | 'confirm';

const AddNumberFromMetaModal = ({ 
  open, 
  onOpenChange, 
  projectId,
  businessManagers,
  onAddNumber 
}: AddNumberFromMetaModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('select-bm');
  const [selectedBMId, setSelectedBMId] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<MetaPhoneNumber[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<MetaPhoneNumber | null>(null);
  const [phoneDetail, setPhoneDetail] = useState<MetaPhoneNumberDetail | null>(null);
  const [customName, setCustomName] = useState('');
  const [observation, setObservation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedBM = businessManagers.find(bm => bm.id === selectedBMId);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('select-bm');
      setSelectedBMId('');
      setPhoneNumbers([]);
      setSelectedPhone(null);
      setPhoneDetail(null);
      setCustomName('');
      setObservation('');
      setError('');
      setIsLoading(false);
    }
  }, [open]);

  const handleFetchNumbers = async () => {
    if (!selectedBM) return;
    
    setStep('loading-numbers');
    setError('');
    setIsLoading(true);

    try {
      // Use subBmId (WABA ID) if available, otherwise mainBmId
      const wabaId = selectedBM.subBmId || selectedBM.mainBmId;
      const numbers = await fetchPhoneNumbers(wabaId, selectedBM.accessToken);
      
      if (numbers.length === 0) {
        setError('Nenhum número encontrado nesta WABA');
        setStep('select-bm');
      } else {
        setPhoneNumbers(numbers);
        setStep('select-number');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar números');
      setStep('select-bm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectNumber = async (phone: MetaPhoneNumber) => {
    if (!selectedBM) return;

    setSelectedPhone(phone);
    setStep('loading-details');
    setError('');
    setIsLoading(true);

    try {
      const detail = await fetchPhoneNumberDetail(phone.id, selectedBM.accessToken);
      setPhoneDetail(detail);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar detalhes');
      setStep('select-number');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!phoneDetail || !selectedBM) return;

    const newNumber: Omit<WhatsAppNumber, 'id' | 'createdAt' | 'lastChecked'> = {
      projectId,
      businessManagerId: selectedBM.id,
      phoneNumberId: phoneDetail.id,
      displayPhoneNumber: phoneDetail.display_phone_number,
      verifiedName: phoneDetail.verified_name,
      customName: customName.trim() || undefined,
      qualityRating: mapMetaQuality(phoneDetail.quality_rating),
      messagingLimitTier: mapMessagingLimit(phoneDetail.messaging_limit_tier),
      wabaId: selectedBM.subBmId || selectedBM.mainBmId,
      isVisible: true,
      observation: observation.trim() || undefined,
    };

    onAddNumber(newNumber);
    onOpenChange(false);
    toast({
      title: 'Número adicionado!',
      description: `${phoneDetail.display_phone_number} foi adicionado com sucesso.`,
    });
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'GREEN':
        return 'text-success';
      case 'YELLOW':
        return 'text-warning';
      case 'RED':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'GREEN':
        return '🟢 Alta';
      case 'YELLOW':
        return '🟡 Média';
      case 'RED':
        return '🔴 Baixa';
      default:
        return quality;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Adicionar Número via Meta API
          </DialogTitle>
        </DialogHeader>

        {/* Step: Select BM */}
        {step === 'select-bm' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecionar Business Manager *</Label>
              <Select value={selectedBMId} onValueChange={setSelectedBMId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma BM cadastrada" />
                </SelectTrigger>
                <SelectContent>
                  {businessManagers.length > 0 ? (
                    businessManagers.map(bm => (
                      <SelectItem key={bm.id} value={bm.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {bm.mainBmName}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Nenhuma BM cadastrada</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedBM && (
              <Card className="p-4 bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Dados da BM selecionada:</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Nome:</strong> {selectedBM.mainBmName}</p>
                  <p><strong>ID BM:</strong> {selectedBM.mainBmId}</p>
                  {selectedBM.subBmName && (
                    <p><strong>Sub BM (WABA):</strong> {selectedBM.subBmName} - {selectedBM.subBmId}</p>
                  )}
                  <p><strong>Token:</strong> ****{selectedBM.accessToken.slice(-8)}</p>
                </div>
              </Card>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {businessManagers.length === 0 && (
              <div className="text-center py-4">
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Cadastre uma BM primeiro</p>
              </div>
            )}
          </div>
        )}

        {/* Step: Loading Numbers */}
        {step === 'loading-numbers' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Buscando números da API do Meta...</p>
          </div>
        )}

        {/* Step: Select Number */}
        {step === 'select-number' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {phoneNumbers.length} número(s) encontrado(s)
              </p>
              <Button variant="ghost" size="sm" onClick={handleFetchNumbers}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Atualizar
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {phoneNumbers.map(phone => (
                <Card 
                  key={phone.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectNumber(phone)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{phone.display_phone_number}</p>
                      <p className="text-sm text-muted-foreground">{phone.verified_name}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={getQualityColor(phone.quality_rating)}>
                          {getQualityLabel(phone.quality_rating)}
                        </span>
                        <span className="text-muted-foreground">
                          Limite: {mapMessagingLimit(phone.messaging_limit_tier)}/dia
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setStep('select-bm')}
            >
              Voltar
            </Button>
          </div>
        )}

        {/* Step: Loading Details */}
        {step === 'loading-details' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Buscando detalhes do número...</p>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && phoneDetail && (
          <div className="space-y-4 py-4">
            <Card className="p-4 bg-muted/50">
              <h4 className="text-sm font-medium mb-3">Detalhes do Número</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{phoneDetail.display_phone_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nome Verificado:</span>
                  <p className="font-medium">{phoneDetail.verified_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone ID:</span>
                  <p className="font-mono text-xs">{phoneDetail.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Qualidade:</span>
                  <p className={`font-medium ${getQualityColor(phoneDetail.quality_rating)}`}>
                    {getQualityLabel(phoneDetail.quality_rating)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Limite:</span>
                  <p className="font-medium">{mapMessagingLimit(phoneDetail.messaging_limit_tier)}/dia</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Modo:</span>
                  <p className="font-medium">{phoneDetail.account_mode || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Verificação:</span>
                  <p className="font-medium">{phoneDetail.code_verification_status || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Throughput:</span>
                  <p className="font-medium">{phoneDetail.throughput?.level || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Conta Oficial:</span>
                  <p className="font-medium">
                    {phoneDetail.is_official_business_account ? '✓ Sim' : '✗ Não'}
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customName">Nome Personalizado (opcional)</Label>
                <Input 
                  id="customName"
                  placeholder="Ex: Conta API 1, Suporte, Vendas..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observation">Observação (opcional)</Label>
                <Input 
                  id="observation"
                  placeholder="Anotações sobre este número..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setSelectedPhone(null);
                  setPhoneDetail(null);
                  setStep('select-number');
                }}
              >
                Voltar
              </Button>
              <Button 
                className="flex-1 gradient-primary"
                onClick={handleConfirmAdd}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Adicionar Número
              </Button>
            </div>
          </div>
        )}

        {/* Footer for Select BM step */}
        {step === 'select-bm' && businessManagers.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              className="gradient-primary" 
              onClick={handleFetchNumbers}
              disabled={!selectedBMId || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Phone className="w-4 h-4 mr-2" />
              )}
              Buscar Números
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddNumberFromMetaModal;
