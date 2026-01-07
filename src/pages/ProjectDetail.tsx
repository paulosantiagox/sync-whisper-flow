import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EditNumberModal from '@/components/modals/EditNumberModal';
import StatusHistoryModal from '@/components/modals/StatusHistoryModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import QualityBadge from '@/components/dashboard/QualityBadge';
import { projects, whatsappNumbers, updateWhatsAppNumber } from '@/data/mockData';
import { WhatsAppNumber } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Plus, Search, Phone, Activity, MessageCircle, 
  RefreshCw, Eye, EyeOff, Loader2, History, Edit2, Trash2, ArrowUpDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type SortOption = 'quality-asc' | 'quality-desc' | 'date-asc' | 'date-desc';

const qualityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('quality-asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Modal states
  const [editNumber, setEditNumber] = useState<WhatsAppNumber | null>(null);
  const [historyNumber, setHistoryNumber] = useState<WhatsAppNumber | null>(null);
  const [deleteNumber, setDeleteNumber] = useState<WhatsAppNumber | null>(null);
  
  // Force re-render
  const [, forceUpdate] = useState({});

  const project = projects.find(p => p.id === id);
  const numbers = whatsappNumbers.filter(n => n.projectId === id);

  const { activeNumbers, inactiveNumbers } = useMemo(() => {
    const filtered = numbers.filter(n => {
      const matchesSearch = 
        n.displayPhoneNumber.includes(searchQuery) ||
        n.verifiedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.customName?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || n.qualityRating === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const sortFn = (a: WhatsAppNumber, b: WhatsAppNumber) => {
      switch (sortBy) {
        case 'quality-asc':
          return qualityOrder[a.qualityRating] - qualityOrder[b.qualityRating];
        case 'quality-desc':
          return qualityOrder[b.qualityRating] - qualityOrder[a.qualityRating];
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    };

    const active = filtered.filter(n => n.isVisible).sort(sortFn);
    const inactive = filtered.filter(n => !n.isVisible).sort(sortFn);

    return { activeNumbers: active, inactiveNumbers: inactive };
  }, [numbers, searchQuery, statusFilter, sortBy]);

  const statusCounts = {
    high: numbers.filter(n => n.qualityRating === 'HIGH').length,
    medium: numbers.filter(n => n.qualityRating === 'MEDIUM').length,
    low: numbers.filter(n => n.qualityRating === 'LOW').length,
  };

  const totalLimit = numbers.reduce((acc, n) => {
    const limit = parseInt(n.messagingLimitTier) || 0;
    return acc + limit;
  }, 0);

  const handleUpdateAllStatus = async () => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    numbers.forEach(n => {
      updateWhatsAppNumber(n.id, { lastChecked: new Date().toISOString() });
    });
    
    setIsUpdating(false);
    forceUpdate({});
    toast({
      title: "Status atualizado!",
      description: `${numbers.length} números foram verificados com sucesso.`,
    });
  };

  const handleSaveNumber = (id: string, data: Partial<WhatsAppNumber>) => {
    updateWhatsAppNumber(id, data);
    forceUpdate({});
    toast({ title: "Número atualizado!", description: "Alterações salvas com sucesso." });
  };

  const handleToggleVisibility = (num: WhatsAppNumber, visible: boolean) => {
    updateWhatsAppNumber(num.id, { isVisible: visible });
    forceUpdate({});
    toast({ 
      title: visible ? "Número ativado" : "Número desativado",
      description: visible ? "O número agora está visível na lista principal." : "O número foi movido para a seção de desativados."
    });
  };

  const handleDeleteNumber = () => {
    toast({ title: "Número removido", description: "O número foi removido do projeto." });
    setDeleteNumber(null);
  };

  const renderNumberRow = (number: WhatsAppNumber, isInactive = false) => (
    <TableRow key={number.id} className={isInactive ? 'opacity-60' : ''}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {number.photo ? (
              <img src={number.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <Phone className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            {number.customName && (
              <p className="font-medium text-sm">{number.customName}</p>
            )}
            <p className={`${number.customName ? 'text-xs text-muted-foreground' : 'font-medium text-sm'}`}>
              {number.verifiedName}
            </p>
            <p className="text-xs text-muted-foreground">{number.displayPhoneNumber}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <QualityBadge rating={number.qualityRating} />
      </TableCell>
      <TableCell>
        <span className="text-sm">{number.messagingLimitTier}/dia</span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground font-mono">{number.phoneNumberId}</span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {format(new Date(number.lastChecked), "dd/MM/yy HH:mm", { locale: ptBR })}
        </span>
      </TableCell>
      <TableCell>
        <Switch
          checked={number.isVisible}
          onCheckedChange={(checked) => handleToggleVisibility(number, checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistoryNumber(number)}>
            <History className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditNumber(number)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteNumber(number)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  if (!project) {
    return (
      <DashboardLayout>
        <Card className="p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Projeto não encontrado</h2>
          <p className="text-muted-foreground mb-4">O projeto solicitado não existe ou foi removido.</p>
          <Link to="/projects">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Projetos
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleUpdateAllStatus} disabled={isUpdating || numbers.length === 0}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {isUpdating ? 'Atualizando...' : 'Atualizar Status'}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary"><Plus className="w-4 h-4 mr-2" />Adicionar Número</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Adicionar Número WhatsApp</DialogTitle></DialogHeader>
                <form className="space-y-4 mt-4">
                  <div className="space-y-2"><Label htmlFor="token">Token de Acesso</Label><Input id="token" placeholder="EAAxxxxxxx..." type="password" /></div>
                  <div className="space-y-2"><Label htmlFor="bmId">Business Manager ID</Label><Input id="bmId" placeholder="123456789" /></div>
                  <div className="space-y-2"><Label htmlFor="wabaId">WABA ID</Label><Input id="wabaId" placeholder="987654321" /></div>
                  <div className="space-y-2"><Label htmlFor="customName">Nome Personalizado (opcional)</Label><Input id="customName" placeholder="Ex: Conta API 1" /></div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" className="gradient-primary">Buscar Números</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <Card className="mb-8 overflow-hidden">
        <div className="gradient-primary p-6">
          <h2 className="text-lg font-semibold text-primary-foreground mb-4">Resumo do Projeto</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1"><Phone className="w-4 h-4" />Total de Números</div><p className="text-3xl font-bold text-primary-foreground">{numbers.length}</p></div>
            <div><div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1"><Activity className="w-4 h-4" />Status</div><div className="flex items-center gap-2 text-primary-foreground"><span className="text-lg font-semibold">🟢 {statusCounts.high}</span><span className="text-lg font-semibold">🟡 {statusCounts.medium}</span><span className="text-lg font-semibold">🔴 {statusCounts.low}</span></div></div>
            <div><div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1"><MessageCircle className="w-4 h-4" />Limite Total</div><p className="text-3xl font-bold text-primary-foreground">{totalLimit.toLocaleString()}/dia</p></div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar números..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="HIGH">🟢 Alta Qualidade</SelectItem>
            <SelectItem value="MEDIUM">🟡 Média Qualidade</SelectItem>
            <SelectItem value="LOW">🔴 Baixa Qualidade</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[200px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quality-asc">Qualidade: Alta → Baixa</SelectItem>
            <SelectItem value="quality-desc">Qualidade: Baixa → Alta</SelectItem>
            <SelectItem value="date-desc">Data: Mais Recente</SelectItem>
            <SelectItem value="date-asc">Data: Mais Antigo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Numbers List - Active */}
      {activeNumbers.length > 0 ? (
        <Card className="mb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Qualidade</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Phone ID</TableHead>
                  <TableHead>Última Verificação</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeNumbers.map((number) => renderNumberRow(number))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : numbers.length === 0 ? (
        <Card className="p-12 text-center animate-fade-in">
          <Phone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">Nenhum número cadastrado</h3>
          <p className="text-muted-foreground mb-4">Adicione seus números WhatsApp Business para começar o monitoramento.</p>
          <Button className="gradient-primary" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Adicionar Primeiro Número</Button>
        </Card>
      ) : activeNumbers.length === 0 && inactiveNumbers.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-muted-foreground">Nenhum número encontrado com os filtros selecionados</p></Card>
      ) : null}

      {/* Numbers List - Inactive */}
      {inactiveNumbers.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <EyeOff className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-muted-foreground">Desativados ({inactiveNumbers.length})</h3>
          </div>
          <Card className="border-dashed">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Qualidade</TableHead>
                    <TableHead>Limite</TableHead>
                    <TableHead>Phone ID</TableHead>
                    <TableHead>Última Verificação</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveNumbers.map((number) => renderNumberRow(number, true))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <EditNumberModal number={editNumber} open={!!editNumber} onOpenChange={(open) => !open && setEditNumber(null)} onSave={handleSaveNumber} />
      <StatusHistoryModal number={historyNumber} open={!!historyNumber} onOpenChange={(open) => !open && setHistoryNumber(null)} />
      <ConfirmDialog open={!!deleteNumber} onOpenChange={(open) => !open && setDeleteNumber(null)} title="Remover Número" description={`Tem certeza que deseja remover o número ${deleteNumber?.displayPhoneNumber}? Esta ação não pode ser desfeita.`} confirmText="Remover" onConfirm={handleDeleteNumber} variant="destructive" />
    </DashboardLayout>
  );
};

export default ProjectDetail;