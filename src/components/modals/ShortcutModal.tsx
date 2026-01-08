import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CampaignShortcut } from '@/types';

interface ShortcutModalProps {
  shortcut: CampaignShortcut | null;
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (shortcut: CampaignShortcut) => void;
}

const ShortcutModal = ({ shortcut, campaignId, open, onOpenChange, onSave }: ShortcutModalProps) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isMultiline, setIsMultiline] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shortcut) {
      setName(shortcut.name);
      setContent(shortcut.content);
      setIsMultiline(shortcut.isMultiline);
    } else {
      setName('');
      setContent('');
      setIsMultiline(false);
    }
    setError('');
  }, [shortcut, open]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    if (!content.trim()) {
      setError('Conteúdo é obrigatório');
      return;
    }

    onSave({
      id: shortcut?.id || `sc${Date.now()}`,
      campaignId,
      name: name.trim(),
      content: content.trim(),
      isMultiline,
      createdAt: shortcut?.createdAt || new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{shortcut ? 'Editar Atalho' : 'Novo Atalho Rápido'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="shortcut-name">Nome do Atalho</Label>
            <Input
              id="shortcut-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tag Principal, Link Grupo..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="multiline"
              checked={isMultiline}
              onCheckedChange={(checked) => setIsMultiline(checked === true)}
            />
            <Label htmlFor="multiline" className="text-sm text-muted-foreground cursor-pointer">
              Conteúdo com várias linhas
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortcut-content">Conteúdo</Label>
            {isMultiline ? (
              <Textarea
                id="shortcut-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o conteúdo aqui..."
                rows={5}
              />
            ) : (
              <Input
                id="shortcut-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o conteúdo aqui..."
              />
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gradient-primary">
            {shortcut ? 'Salvar' : 'Criar Atalho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutModal;
