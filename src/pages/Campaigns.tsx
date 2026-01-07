import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BroadcastModal from '@/components/modals/BroadcastModal';
import ActionTypeModal from '@/components/modals/ActionTypeModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { campaigns, actionTypes, broadcasts, whatsappNumbers, projects, addBroadcast, updateBroadcast, deleteBroadcast, addActionType, updateActionType, deleteActionType } from '@/data/mockData';
import { Broadcast, ActionType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Megaphone, Send, Calendar, Search, ChevronRight, Users, MessageCircle, Edit2, Trash2, Tag, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Campaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [, forceUpdate] = useState({});

  // Modal states
  const [editBroadcast, setEditBroadcast] = useState<Broadcast | null>(null);
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [editActionType, setEditActionType] = useState<ActionType | null>(null);
  const [isNewActionTypeOpen, setIsNewActionTypeOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: 'broadcast' | 'actionType'; item: any } | null>(null);

  const userCampaigns = campaigns.filter(c => c.userId === user?.id);
  const activeCampaign = selectedCampaign ? campaigns.find(c => c.id === selectedCampaign) : userCampaigns[0];
  
  const campaignBroadcasts = useMemo(() => {
    let result = broadcasts.filter(b => b.campaignId === activeCampaign?.id);
    if (typeFilter !== 'all') result = result.filter(b => b.actionTypeId === typeFilter);
    if (accountFilter !== 'all') result = result.filter(b => b.phoneNumberId === accountFilter);
    return result.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
  }, [activeCampaign?.id, typeFilter, accountFilter]);

  const campaignActionTypes = actionTypes.filter(at => at.campaignId === activeCampaign?.id);
  
  // Get all WhatsApp numbers from user's projects
  const userProjects = projects.filter(p => p.userId === user?.id);
  const userNumbers = whatsappNumbers.filter(n => userProjects.some(p => p.id === n.projectId));

  const getTotalContacts = () => campaignBroadcasts.reduce((acc, b) => acc + b.contactCount, 0);

  const handleSaveBroadcast = (broadcast: Broadcast) => {
    if (editBroadcast) {
      updateBroadcast(broadcast.id, broadcast);
      toast({ title: "Disparo atualizado!" });
    } else {
      addBroadcast(broadcast);
      toast({ title: "Disparo registrado!" });
    }
    forceUpdate({});
  };

  const handleSaveActionType = (at: ActionType) => {
    if (editActionType) {
      updateActionType(at.id, at);
      toast({ title: "Tipo de ação atualizado!" });
    } else {
      addActionType(at);
      toast({ title: "Tipo de ação criado!" });
    }
    forceUpdate({});
  };

  const handleDelete = () => {
    if (deleteItem?.type === 'broadcast') {
      deleteBroadcast(deleteItem.item.id);
      toast({ title: "Disparo removido!" });
    } else if (deleteItem?.type === 'actionType') {
      deleteActionType(deleteItem.item.id);
      toast({ title: "Tipo de ação removido!" });
    }
    setDeleteItem(null);
    forceUpdate({});
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Campanhas de Disparo</h1>
          <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
            <DialogTrigger asChild><Button className="gradient-primary"><Plus className="w-4 h-4 mr-2" />Nova Campanha</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Nova Campanha</DialogTitle></DialogHeader>
              <form className="space-y-4 mt-4">
                <div className="space-y-2"><Label htmlFor="name">Nome da Campanha</Label><Input id="name" placeholder="Ex: Lançamento Janeiro" /></div>
                <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Input id="description" placeholder="Descreva o objetivo da campanha" /></div>
                <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsNewCampaignOpen(false)}>Cancelar</Button><Button type="submit" className="gradient-primary">Criar Campanha</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">Gerencie suas campanhas e registre seus disparos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Campaigns Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Minhas Campanhas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {userCampaigns.length > 0 ? userCampaigns.map((campaign) => (
                <button key={campaign.id} onClick={() => setSelectedCampaign(campaign.id)} className={`w-full p-3 rounded-lg text-left transition-all ${activeCampaign?.id === campaign.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                  <div className="flex items-center justify-between"><div><p className="font-medium text-sm">{campaign.name}</p><p className={`text-xs ${activeCampaign?.id === campaign.id ? 'opacity-80' : 'text-muted-foreground'}`}>{broadcasts.filter(b => b.campaignId === campaign.id).length} disparos</p></div><ChevronRight className="w-4 h-4" /></div>
                </button>
              )) : <div className="text-center py-6"><Megaphone className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" /><p className="text-sm text-muted-foreground">Nenhuma campanha</p></div>}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Content */}
        <div className="lg:col-span-3">
          {activeCampaign ? (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center"><Send className="w-5 h-5 text-primary-foreground" /></div><div><p className="text-2xl font-bold">{campaignBroadcasts.length}</p><p className="text-xs text-muted-foreground">Disparos Realizados</p></div></div></Card>
                <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg gradient-success flex items-center justify-center"><Users className="w-5 h-5 text-success-foreground" /></div><div><p className="text-2xl font-bold">{getTotalContacts().toLocaleString()}</p><p className="text-xs text-muted-foreground">Contatos Impactados</p></div></div></Card>
                <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-accent" /></div><div><p className="text-2xl font-bold">{campaignActionTypes.length}</p><p className="text-xs text-muted-foreground">Tipos de Ação</p></div></div></Card>
              </div>

              {/* Action Types */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" />Tipos de Ação</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => { setEditActionType(null); setIsNewActionTypeOpen(true); }}><Plus className="w-4 h-4 mr-1" />Novo Tipo</Button>
                </CardHeader>
                <CardContent>
                  {campaignActionTypes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {campaignActionTypes.map((at) => (
                        <div key={at.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white group" style={{ backgroundColor: at.color }}>
                          {at.name}
                          <button onClick={() => { setEditActionType(at); setIsNewActionTypeOpen(true); }} className="ml-1 opacity-70 hover:opacity-100"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => setDeleteItem({ type: 'actionType', item: at })} className="opacity-70 hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">Nenhum tipo cadastrado. Crie seu primeiro tipo de ação.</p>}
                </CardContent>
              </Card>

              {/* Broadcasts Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle>Disparos</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[150px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos os tipos</SelectItem>{campaignActionTypes.map(at => <SelectItem key={at.id} value={at.id}>{at.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={accountFilter} onValueChange={setAccountFilter}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Conta" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todas as contas</SelectItem>{userNumbers.map(n => <SelectItem key={n.id} value={n.id}>{n.customName || n.verifiedName}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => { setEditBroadcast(null); setIsNewBroadcastOpen(true); }}><Plus className="w-4 h-4 mr-1" />Registrar Disparo</Button>
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
                            <TableHead className="text-right">Contatos</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {campaignBroadcasts.map((broadcast) => {
                            const actionType = actionTypes.find(at => at.id === broadcast.actionTypeId);
                            const phoneNum = whatsappNumbers.find(n => n.id === broadcast.phoneNumberId);
                            return (
                              <TableRow key={broadcast.id}>
                                <TableCell><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>{format(new Date(broadcast.date), "dd/MM", { locale: ptBR })} {broadcast.time}</span></div></TableCell>
                                <TableCell><Badge style={{ backgroundColor: actionType?.color }}>{actionType?.name || 'N/A'}</Badge></TableCell>
                                <TableCell className="text-muted-foreground text-sm">{phoneNum?.customName || phoneNum?.displayPhoneNumber || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground">{broadcast.listName}</TableCell>
                                <TableCell className="text-muted-foreground">{broadcast.templateUsed}</TableCell>
                                <TableCell className="text-right font-medium">{broadcast.contactCount.toLocaleString()}</TableCell>
                                <TableCell><Badge variant={broadcast.status === 'completed' ? 'default' : broadcast.status === 'scheduled' ? 'secondary' : 'destructive'} className={broadcast.status === 'completed' ? 'bg-success' : ''}>{broadcast.status === 'completed' ? 'Concluído' : broadcast.status === 'scheduled' ? 'Agendado' : 'Falhou'}</Badge></TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditBroadcast(broadcast); setIsNewBroadcastOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteItem({ type: 'broadcast', item: broadcast })}><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : <div className="text-center py-8"><Send className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" /><p className="text-muted-foreground">Nenhum disparo registrado</p></div>}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">Nenhuma campanha selecionada</h3>
              <p className="text-muted-foreground mb-4">Crie sua primeira campanha para começar a registrar seus disparos.</p>
              <Button className="gradient-primary" onClick={() => setIsNewCampaignOpen(true)}><Plus className="w-4 h-4 mr-2" />Criar Primeira Campanha</Button>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <BroadcastModal broadcast={editBroadcast} campaignId={activeCampaign?.id || ''} actionTypes={campaignActionTypes} whatsappNumbers={userNumbers} open={isNewBroadcastOpen} onOpenChange={setIsNewBroadcastOpen} onSave={handleSaveBroadcast} />
      <ActionTypeModal actionType={editActionType} campaignId={activeCampaign?.id || ''} open={isNewActionTypeOpen} onOpenChange={setIsNewActionTypeOpen} onSave={handleSaveActionType} />
      <ConfirmDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)} title={deleteItem?.type === 'broadcast' ? 'Remover Disparo' : 'Remover Tipo de Ação'} description={deleteItem?.type === 'broadcast' ? 'Tem certeza que deseja remover este disparo?' : 'Tem certeza que deseja remover este tipo de ação?'} confirmText="Remover" onConfirm={handleDelete} variant="destructive" />
    </DashboardLayout>
  );
};

export default Campaigns;
