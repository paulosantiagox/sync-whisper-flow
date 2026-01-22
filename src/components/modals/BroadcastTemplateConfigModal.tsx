import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Settings, RotateCcw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'broadcast-copy-template';

const DEFAULT_TEMPLATE = `🚀 *DISPARO REALIZADO*

📅 *Data:* {data}
⏰ *Horário:* {hora}

📱 *CONTA:* {conta}
📞 *Número:* {numero}
🔵 *Qualidade:* {qualidade}

📋 *Lista:* {lista}
📝 *Template:* {template}
👥 *Contatos:* {contatos}

🏷️ *Tipo:* {tipo}
📊 *Status:* {status}

{observacoes}`;

export const getBroadcastTemplate = (): string => {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_TEMPLATE;
};

export const saveBroadcastTemplate = (template: string): void => {
  localStorage.setItem(STORAGE_KEY, template);
};

interface BroadcastTemplateConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BroadcastTemplateConfigModal = ({ open, onOpenChange }: BroadcastTemplateConfigModalProps) => {
  const [template, setTemplate] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setTemplate(getBroadcastTemplate());
    }
  }, [open]);

  const handleSave = () => {
    saveBroadcastTemplate(template);
    toast.success('Template salvo com sucesso!');
    onOpenChange(false);
  };

  const handleReset = () => {
    setTemplate(DEFAULT_TEMPLATE);
  };

  const handleCopyVariables = async () => {
    const variables = `Variáveis disponíveis:
{data} - Data do disparo
{hora} - Horário do disparo
{conta} - Nome da conta WhatsApp
{numero} - Número de telefone completo
{qualidade} - Qualidade da conta (🟢 Alta / 🟡 Média / 🔴 Baixa)
{lista} - Nome da lista
{template} - Template utilizado
{contatos} - Quantidade de contatos
{tipo} - Tipo de ação
{status} - Status do disparo
{observacoes} - Observações (se houver)`;
    
    await navigator.clipboard.writeText(variables);
    setCopied(true);
    toast.success('Variáveis copiadas!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurar Template de Cópia
          </DialogTitle>
          <DialogDescription>
            Configure a estrutura padrão da mensagem que será copiada ao clicar no botão de copiar disparo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <Label>Template da Mensagem</Label>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleCopyVariables}
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                Variáveis
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restaurar Padrão
              </Button>
            </div>
          </div>

          <Textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="Configure o template..."
            className="min-h-[300px] font-mono text-sm"
          />

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground font-medium mb-2">Variáveis disponíveis:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <span><code className="bg-muted px-1 rounded">{'{data}'}</code> Data do disparo</span>
              <span><code className="bg-muted px-1 rounded">{'{hora}'}</code> Horário</span>
              <span><code className="bg-muted px-1 rounded">{'{conta}'}</code> Nome da conta</span>
              <span><code className="bg-muted px-1 rounded">{'{numero}'}</code> Número completo</span>
              <span><code className="bg-muted px-1 rounded">{'{qualidade}'}</code> Qualidade</span>
              <span><code className="bg-muted px-1 rounded">{'{lista}'}</code> Nome da lista</span>
              <span><code className="bg-muted px-1 rounded">{'{template}'}</code> Template usado</span>
              <span><code className="bg-muted px-1 rounded">{'{contatos}'}</code> Qtd. contatos</span>
              <span><code className="bg-muted px-1 rounded">{'{tipo}'}</code> Tipo de ação</span>
              <span><code className="bg-muted px-1 rounded">{'{status}'}</code> Status</span>
              <span><code className="bg-muted px-1 rounded">{'{observacoes}'}</code> Observações</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              Salvar Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastTemplateConfigModal;
