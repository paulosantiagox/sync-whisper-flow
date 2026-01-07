import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EditNumberModal from '@/components/modals/EditNumberModal';
import StatusHistoryModal from '@/components/modals/StatusHistoryModal';
import BMModal from '@/components/modals/BMModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import QualityBadge from '@/components/dashboard/QualityBadge';
import { projects, whatsappNumbers, businessManagers, updateWhatsAppNumber, addBusinessManager, updateBusinessManager, deleteBusinessManager } from '@/data/mockData';
import { WhatsAppNumber, BusinessManager } from '@/types';
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
  RefreshCw, EyeOff, Loader2, History, Edit2, Trash2, ArrowUpDown, Building2, FileText
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
  const [bmFilter, setBmFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('quality-asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBMListOpen, setIsBMListOpen] = useState(false);
  
  // Modal states
  const [editNumber, setEditNumber] = useState<WhatsAppNumber | null>(null);
  const [historyNumber, setHistoryNumber] = useState<WhatsAppNumber | null>(null);
  const [deleteNumber, setDeleteNumber] = useState<WhatsAppNumber | null>(null);
  const [editBM, setEditBM] = useState<BusinessManager | null>(null);
  const [isNewBMOpen, setIsNewBMOpen] = useState(false);
  const [deleteBM, setDeleteBM] = useState<BusinessManager | null>(null);
  
  // Add number form
  const [selectedBMId, setSelectedBMId] = useState('');
  const [newCustomName, setNewCustomName] = useState('');
  
  // Force re-render
  const [, forceUpdate] = useState({});

  const project = projects.find(p => p.id === id);
  const numbers = whatsappNumbers.filter(n => n.projectId === id);
  const projectBMs = businessManagers.filter(bm => bm.projectId === id);

  const { activeNumbers, inactiveNumbers } = useMemo(() => {
    const filtered = numbers.filter(n => {
      const matchesSearch = 
        n.displayPhoneNumber.includes(searchQuery) ||
        n.verifiedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.customName?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || n.qualityRating === statusFilter;
      const matchesBM = bmFilter === 'all' || n.businessManagerId === bmFilter;
      return matchesSearch && matchesStatus && matchesBM;
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
  }, [numbers, searchQuery, statusFilter, bmFilter, sortBy]);

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

  const handleSaveBM = (bm: BusinessManager) => {
    if (editBM) {
      updateBusinessManager(bm.id, bm);
      toast({ title: "BM atualizada!", description: "Alterações salvas com sucesso." });
    } else {
      addBusinessManager(bm);
      toast({ title: "BM cadastrada!", description: "Nova Business Manager adicionada." });
    }
    setEditBM(null);
    forceUpdate({});
  };

  const handleDeleteBM = () => {
    if (deleteBM) {
      deleteBusinessManager(deleteBM.id);
      toast({ title: "BM removida", description: "Business Manager removida do projeto." });
      setDeleteBM(null);
      forceUpdate({});
    }
  };

  const getBMName = (bmId?: string) => {
    if (!bmId) return '-';
    const bm = businessManagers.find(b => b.id === bmId);
    return bm?.mainBmName || '-';
  };

  const renderNumberRow = (number: WhatsAppNumber, isInactive = false) => {
    const bm = businessManagers.find(b => b.id === number.businessManagerId);
    return (
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
          {bm ? (
            <div className="text-xs">
              <p className="font-medium text-foreground">{bm.mainBmName}</p>
              <p className="text-muted-foreground">ID: {bm.mainBmId}</p>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          {number.observation ? (
            <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">{number.observation}</span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
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
  };

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

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleUpdateAllStatus} disabled={isUpdating || numbers.length === 0}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {isUpdating ? 'Atualizando...' : 'Atualizar Status'}
            </Button>
            
            {/* BM List Modal */}
            <Dialog open={isBMListOpen} onOpenChange={setIsBMListOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Building2 className="w-4 h-4 mr-2" />
                  Cadastrar BM
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Business Managers
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => { setEditBM(null); setIsNewBMOpen(true); setIsBMListOpen(false); }}>
                      <Plus className="w-4 h-4 mr-1" />
                      Nova BM
                    </Button>
                  </div>
                  {projectBMs.length > 0 ? (
                    <div className="space-y-2">
                      {projectBMs.map((bm) => (
                        <div key={bm.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{bm.mainBmName}</p>
                              <p className="text-xs text-muted-foreground">ID: {bm.mainBmId}</p>
                              {bm.subBmName && (
                                <p className="text-xs text-muted-foreground">Sub: {bm.subBmName} ({bm.subBmId})</p>
                              )}
                              {bm.cardName && (
                                <p className="text-xs text-muted-foreground">Cartão: {bm.cardName}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => { setEditBM(bm); setIsNewBMOpen(true); setIsBMListOpen(false); }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => { setDeleteBM(bm); setIsBMListOpen(false); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building2 className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma BM cadastrada</p>
                      <p className="text-xs text-muted-foreground">Cadastre sua primeira Business Manager</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Number Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary"><Plus className="w-4 h-4 mr-2" />Adicionar Número</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Adicionar Número WhatsApp</DialogTitle></DialogHeader>
                <form className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="bmSelect">Selecionar BM *</Label>
                    <Select value={selectedBMId} onValueChange={setSelectedBMId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma BM cadastrada" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectBMs.length > 0 ? (
                          projectBMs.map(bm => (
                            <SelectItem key={bm.id} value={bm.id}>
                              {bm.mainBmName} - {bm.mainBmId}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>Nenhuma BM cadastrada</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {projectBMs.length === 0 && (
                      <p className="text-xs text-destructive">Cadastre uma BM primeiro antes de adicionar números</p>
                    )}
                  </div>
                  
                  {selectedBMId && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium mb-1">Dados da BM selecionada:</p>
                      {(() => {
                        const selectedBM = projectBMs.find(b => b.id === selectedBMId);
                        return selectedBM ? (
                          <div className="text-muted-foreground text-xs space-y-1">
                            <p>Nome: {selectedBM.mainBmName}</p>
                            <p>ID: {selectedBM.mainBmId}</p>
                            {selectedBM.subBmName && <p>Sub BM: {selectedBM.subBmName}</p>}
                            <p>Token: ****{selectedBM.accessToken.slice(-4)}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="wabaId">WABA ID</Label>
                    <Input id="wabaId" placeholder="987654321" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customName">Nome Personalizado (opcional)</Label>
                    <Input 
                      id="customName" 
                      placeholder="Ex: Conta API 1" 
                      value={newCustomName}
                      onChange={(e) => setNewCustomName(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" className="gradient-primary" disabled={!selectedBMId}>Buscar Números</Button>
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
            <div><div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1"><Building2 className="w-4 h-4" />BMs Cadastradas</div><p className="text-3xl font-bold text-primary-foreground">{projectBMs.length}</p></div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 flex-wrap">
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
        <Select value={bmFilter} onValueChange={setBmFilter}>
          <SelectTrigger className="w-[180px]">
            <Building2 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por BM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as BMs</SelectItem>
            {projectBMs.map(bm => (
              <SelectItem key={bm.id} value={bm.id}>{bm.mainBmName}</SelectItem>
            ))}
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
                  <TableHead>BM</TableHead>
                  <TableHead>Observação</TableHead>
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
                    <TableHead>BM</TableHead>
                    <TableHead>Observação</TableHead>
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
      <BMModal bm={editBM} projectId={id || ''} open={isNewBMOpen} onOpenChange={setIsNewBMOpen} onSave={handleSaveBM} />
      <ConfirmDialog open={!!deleteNumber} onOpenChange={(open) => !open && setDeleteNumber(null)} title="Remover Número" description={`Tem certeza que deseja remover o número ${deleteNumber?.displayPhoneNumber}? Esta ação não pode ser desfeita.`} confirmText="Remover" onConfirm={handleDeleteNumber} variant="destructive" />
      <ConfirmDialog open={!!deleteBM} onOpenChange={(open) => !open && setDeleteBM(null)} title="Remover BM" description={`Tem certeza que deseja remover a BM "${deleteBM?.mainBmName}"? Esta ação não pode ser desfeita.`} confirmText="Remover" onConfirm={handleDeleteBM} variant="destructive" />
    </DashboardLayout>
  );
};

export default ProjectDetail;
