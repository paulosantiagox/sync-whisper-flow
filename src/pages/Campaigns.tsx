import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BroadcastModal from '@/components/modals/BroadcastModal';
import ActionTypeModal from '@/components/modals/ActionTypeModal';
import ShortcutModal from '@/components/modals/ShortcutModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import QualityBadge from '@/components/dashboard/QualityBadge';
import { 
  campaigns, actionTypes, broadcasts, whatsappNumbers, projects, 
  addBroadcast, updateBroadcast, deleteBroadcast, 
  addActionType, updateActionType, deleteActionType,
  campaignShortcuts, addCampaignShortcut, updateCampaignShortcut, deleteCampaignShortcut,
  addCampaign
} from '@/data/mockData';
import { Broadcast, ActionType, BroadcastStatus, CampaignShortcut, Campaign } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Megaphone, Send, Calendar, ChevronRight, ChevronDown, Users, MessageCircle, 
  Edit2, Trash2, Tag, Filter, Copy, Zap, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusOptions: { value: BroadcastStatus; label: string; color: string }[] = [
  { value: 'preparing', label: 'Em preparação', color: 'bg-muted text-muted-foreground' },
  { value: 'scheduled', label: 'Agendado', color: 'bg-yellow-500 text-white' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-destructive text-destructive-foreground' },
  { value: 'sent', label: 'Enviado', color: 'bg-success text-success-foreground' },
];

const Campaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isActionTypesOpen, setIsActionTypesOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [updateKey, setUpdateKey] = useState(0);

  // Collapsible states
  const [campaignsOpen, setCampaignsOpen] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [editBroadcast, setEditBroadcast] = useState<Broadcast | null>(null);
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [editActionType, setEditActionType] = useState<ActionType | null>(null);
  const [isNewActionTypeOpen, setIsNewActionTypeOpen] = useState(false);
  const [editShortcut, setEditShortcut] = useState<CampaignShortcut | null>(null);
  const [isNewShortcutOpen, setIsNewShortcutOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: 'broadcast' | 'actionType' | 'shortcut'; item: any } | null>(null);

  // New campaign form state
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');

  const userCampaigns = campaigns.filter(c => c.userId === user?.id);
  const activeCampaign = selectedCampaign ? campaigns.find(c => c.id === selectedCampaign) : userCampaigns[0];
  
  const campaignBroadcasts = useMemo(() => {
    let result = broadcasts.filter(b => b.campaignId === activeCampaign?.id);
    if (typeFilter !== 'all') result = result.filter(b => b.actionTypeId === typeFilter);
    if (accountFilter !== 'all') result = result.filter(b => b.phoneNumberId === accountFilter);
    return result.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
  }, [activeCampaign?.id, typeFilter, accountFilter, updateKey]);

  const campaignActionTypes = useMemo(() => 
    actionTypes.filter(at => at.campaignId === activeCampaign?.id),
    [activeCampaign?.id, updateKey]
  );
  const shortcuts = useMemo(() => 
    campaignShortcuts.filter(s => s.campaignId === activeCampaign?.id),
    [activeCampaign?.id, updateKey]
  );
  
  // Get all WhatsApp numbers from user's projects
  const userProjects = projects.filter(p => p.userId === user?.id);
  const userNumbers = whatsappNumbers.filter(n => userProjects.some(p => p.id === n.projectId));

  const getTotalContacts = () => campaignBroadcasts.reduce((acc, b) => acc + b.contactCount, 0);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) {
      toast({ title: "Erro", description: "Nome da campanha é obrigatório", variant: "destructive" });
      return;
    }
    
    const newCampaign: Campaign = {
      id: `c${Date.now()}`,
      userId: user?.id || '',
      name: newCampaignName.trim(),
      description: newCampaignDescription.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    addCampaign(newCampaign);
    setSelectedCampaign(newCampaign.id);
    setNewCampaignName('');
    setNewCampaignDescription('');
    setIsNewCampaignOpen(false);
    setUpdateKey(k => k + 1);
    toast({ title: "Campanha criada!", description: `"${newCampaign.name}" foi criada com sucesso.` });
  };

  const handleSaveBroadcast = (broadcast: Broadcast) => {
    if (editBroadcast) {
      updateBroadcast(broadcast.id, broadcast);
      toast({ title: "Disparo atualizado!" });
    } else {
      addBroadcast(broadcast);
      toast({ title: "Disparo registrado!" });
    }
    setUpdateKey(k => k + 1);
  };

  const handleSaveActionType = (at: ActionType) => {
    if (editActionType) {
      updateActionType(at.id, at);
      toast({ title: "Tipo de ação atualizado!" });
    } else {
      addActionType(at);
      toast({ title: "Tipo de ação criado!" });
    }
    setUpdateKey(k => k + 1);
  };

  const handleSaveShortcut = (shortcut: CampaignShortcut) => {
    if (editShortcut) {
      updateCampaignShortcut(shortcut.id, shortcut);
      toast({ title: "Atalho atualizado!" });
    } else {
      addCampaignShortcut(shortcut);
      toast({ title: "Atalho criado!" });
    }
    setUpdateKey(k => k + 1);
  };

  const handleDelete = () => {
    if (deleteItem?.type === 'broadcast') {
      deleteBroadcast(deleteItem.item.id);
      toast({ title: "Disparo removido!" });
    } else if (deleteItem?.type === 'actionType') {
      deleteActionType(deleteItem.item.id);
      toast({ title: "Tipo de ação removido!" });
    } else if (deleteItem?.type === 'shortcut') {
      deleteCampaignShortcut(deleteItem.item.id);
      toast({ title: "Atalho removido!" });
    }
    setDeleteItem(null);
    setUpdateKey(k => k + 1);
  };

  const handleStatusChange = (broadcastId: string, newStatus: BroadcastStatus) => {
    updateBroadcast(broadcastId, { status: newStatus });
    setUpdateKey(k => k + 1);
    toast({ title: "Status atualizado!" });
  };

  const handleCopyContent = async (shortcut: CampaignShortcut) => {
    try {
      await navigator.clipboard.writeText(shortcut.content);
      setCopiedId(shortcut.id);
      toast({ title: "Copiado!", description: `"${shortcut.name}" copiado para a área de transferência.` });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const getStatusOption = (status: BroadcastStatus) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Campanhas de Disparo</h1>
          <div className="flex items-center gap-2">
            <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Campanha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Nova Campanha</DialogTitle></DialogHeader>
                <form className="space-y-4 mt-4" onSubmit={handleCreateCampaign}>
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Nome da Campanha</Label>
                    <Input 
                      id="campaign-name" 
                      placeholder="Ex: Lançamento Janeiro" 
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign-description">Descrição</Label>
                    <Input 
                      id="campaign-description" 
                      placeholder="Descreva o objetivo da campanha" 
                      value={newCampaignDescription}
                      onChange={(e) => setNewCampaignDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsNewCampaignOpen(false)}>Cancelar</Button>
                    <Button type="submit" className="gradient-primary">Criar Campanha</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p className="text-muted-foreground">Gerencie suas campanhas e registre seus disparos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Campaigns Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Minhas Campanhas - Collapsible Dropdown */}
          <Card>
            <Collapsible open={campaignsOpen} onOpenChange={setCampaignsOpen}>
              <CardHeader className="pb-2">
                <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    Minhas Campanhas
                  </CardTitle>
                  <ChevronDown className={`w-4 h-4 transition-transform ${campaignsOpen ? '' : '-rotate-90'}`} />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-2 pt-0">
                  {userCampaigns.length > 0 ? userCampaigns.map((campaign) => (
                    <button 
                      key={campaign.id} 
                      onClick={() => setSelectedCampaign(campaign.id)} 
                      className={`w-full p-3 rounded-lg text-left transition-all ${activeCampaign?.id === campaign.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{campaign.name}</p>
                          <p className={`text-xs ${activeCampaign?.id === campaign.id ? 'opacity-80' : 'text-muted-foreground'}`}>
                            {broadcasts.filter(b => b.campaignId === campaign.id).length} disparos
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  )) : (
                    <div className="text-center py-6">
                      <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma campanha</p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Atalhos Rápidos - Collapsible */}
          {activeCampaign && (
            <Card>
              <Collapsible open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
                <CardHeader className="pb-2">
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Atalhos Rápidos
                    </CardTitle>
                    <ChevronDown className={`w-4 h-4 transition-transform ${shortcutsOpen ? '' : '-rotate-90'}`} />
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-2 pt-0">
                    {shortcuts.length > 0 ? (
                      <>
                        {shortcuts.map((shortcut) => (
                          <div 
                            key={shortcut.id} 
                            className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground">{shortcut.name}</p>
                                <p className={`text-xs text-muted-foreground mt-1 ${shortcut.isMultiline ? 'whitespace-pre-wrap' : 'truncate'}`}>
                                  {shortcut.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleCopyContent(shortcut)}
                                >
                                  {copiedId === shortcut.id ? (
                                    <Check className="w-3.5 h-3.5 text-success" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-popover">
                                    <DropdownMenuItem onClick={() => { setEditShortcut(shortcut); setIsNewShortcutOpen(true); }}>
                                      <Edit2 className="w-4 h-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteItem({ type: 'shortcut', item: shortcut })}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Zap className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">Nenhum atalho</p>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => { setEditShortcut(null); setIsNewShortcutOpen(true); }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Novo Atalho
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}
        </div>

        {/* Campaign Content */}
        <div className="lg:col-span-3">
          {activeCampaign ? (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{campaignBroadcasts.length}</p>
                      <p className="text-xs text-muted-foreground">Disparos Realizados</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gradient-success flex items-center justify-center">
                      <Users className="w-5 h-5 text-success-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{getTotalContacts().toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Contatos Impactados</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{campaignActionTypes.length}</p>
                      <p className="text-xs text-muted-foreground">Tipos de Ação</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Broadcasts Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle>Disparos</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[150px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {campaignActionTypes.map(at => (
                          <SelectItem key={at.id} value={at.id}>{at.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={accountFilter} onValueChange={setAccountFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Conta" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">Todas as contas</SelectItem>
                        {userNumbers.map(n => (
                          <SelectItem key={n.id} value={n.id}>{n.customName || n.verifiedName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isActionTypesOpen} onOpenChange={setIsActionTypesOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Tag className="w-4 h-4 mr-1" />
                          Tipos de Ação
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Tipos de Ação
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <div className="flex justify-end">
                            <Button size="sm" onClick={() => { setEditActionType(null); setIsNewActionTypeOpen(true); setIsActionTypesOpen(false); }}>
                              <Plus className="w-4 h-4 mr-1" />
                              Novo Tipo
                            </Button>
                          </div>
                          {campaignActionTypes.length > 0 ? (
                            <div className="space-y-2">
                              {campaignActionTypes.map((at) => (
                                <div key={at.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                  <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: at.color }} />
                                    <span className="font-medium">{at.name}</span>
                                    {at.description && (
                                      <span className="text-sm text-muted-foreground">- {at.description}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => { setEditActionType(at); setIsNewActionTypeOpen(true); setIsActionTypesOpen(false); }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => { setDeleteItem({ type: 'actionType', item: at }); setIsActionTypesOpen(false); }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Tag className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                              <p className="text-sm text-muted-foreground">Nenhum tipo cadastrado</p>
                              <p className="text-xs text-muted-foreground">Crie seu primeiro tipo de ação</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" onClick={() => { setEditBroadcast(null); setIsNewBroadcastOpen(true); }}>
                      <Plus className="w-4 h-4 mr-1" />
                      Registrar Disparo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {campaignBroadcasts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Conta</TableHead>
                            <TableHead>Lista</TableHead>
                            <TableHead>Template</TableHead>
                            <TableHead>Observação</TableHead>
                            <TableHead className="text-right">Contatos</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {campaignBroadcasts.map((broadcast) => {
                            const actionType = actionTypes.find(at => at.id === broadcast.actionTypeId);
                            const phoneNum = whatsappNumbers.find(n => n.id === broadcast.phoneNumberId);
                            const currentStatus = getStatusOption(broadcast.status);
                            return (
                              <TableRow key={broadcast.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{format(new Date(broadcast.date), "dd/MM/yyyy", { locale: ptBR })} {broadcast.time}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge style={{ backgroundColor: actionType?.color }}>{actionType?.name || 'N/A'}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5 text-xs">
                                    {phoneNum && <QualityBadge rating={phoneNum.qualityRating} showLabel={false} size="sm" />}
                                    <span className="font-medium truncate max-w-[100px]">
                                      {phoneNum?.customName || phoneNum?.verifiedName || 'N/A'}
                                    </span>
                                    {phoneNum?.displayPhoneNumber && (
                                      <span className="text-muted-foreground">
                                        •{phoneNum.displayPhoneNumber.slice(-4)}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{broadcast.listName}</TableCell>
                                <TableCell className="text-muted-foreground">{broadcast.templateUsed}</TableCell>
                                <TableCell>
                                  <TooltipProvider>
                                    {broadcast.observations ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-xs text-muted-foreground truncate block max-w-[80px] cursor-help">
                                            {broadcast.observations}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[300px] bg-popover text-popover-foreground">
                                          <p className="whitespace-pre-wrap text-sm">{broadcast.observations}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-right font-medium">{broadcast.contactCount.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Select 
                                    value={broadcast.status} 
                                    onValueChange={(value) => handleStatusChange(broadcast.id, value as BroadcastStatus)}
                                  >
                                    <SelectTrigger className={`w-[140px] h-8 text-xs ${currentStatus.color}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover">
                                      {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8" 
                                      onClick={() => { setEditBroadcast(broadcast); setIsNewBroadcastOpen(true); }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-destructive" 
                                      onClick={() => setDeleteItem({ type: 'broadcast', item: broadcast })}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Send className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">Nenhum disparo registrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">Nenhuma campanha selecionada</h3>
              <p className="text-muted-foreground mb-4">Crie sua primeira campanha para começar a registrar seus disparos.</p>
              <Button className="gradient-primary" onClick={() => setIsNewCampaignOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <BroadcastModal 
        broadcast={editBroadcast} 
        campaignId={activeCampaign?.id || ''} 
        actionTypes={campaignActionTypes} 
        whatsappNumbers={userNumbers} 
        open={isNewBroadcastOpen} 
        onOpenChange={setIsNewBroadcastOpen} 
        onSave={handleSaveBroadcast} 
      />
      <ActionTypeModal 
        actionType={editActionType} 
        campaignId={activeCampaign?.id || ''} 
        open={isNewActionTypeOpen} 
        onOpenChange={setIsNewActionTypeOpen} 
        onSave={handleSaveActionType} 
      />
      <ShortcutModal
        shortcut={editShortcut}
        campaignId={activeCampaign?.id || ''}
        open={isNewShortcutOpen}
        onOpenChange={setIsNewShortcutOpen}
        onSave={handleSaveShortcut}
      />
      <ConfirmDialog 
        open={!!deleteItem} 
        onOpenChange={(open) => !open && setDeleteItem(null)} 
        title={
          deleteItem?.type === 'broadcast' ? 'Remover Disparo' : 
          deleteItem?.type === 'actionType' ? 'Remover Tipo de Ação' : 
          'Remover Atalho'
        } 
        description={
          deleteItem?.type === 'broadcast' ? 'Tem certeza que deseja remover este disparo?' : 
          deleteItem?.type === 'actionType' ? 'Tem certeza que deseja remover este tipo de ação?' :
          'Tem certeza que deseja remover este atalho?'
        } 
        confirmText="Remover" 
        onConfirm={handleDelete} 
        variant="destructive" 
      />
    </DashboardLayout>
  );
};

export default Campaigns;
