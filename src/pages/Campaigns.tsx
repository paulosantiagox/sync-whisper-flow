import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { campaigns, actionTypes, broadcasts, whatsappNumbers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus, Megaphone, Send, Calendar, Search, 
  ChevronRight, Users, MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Campaigns = () => {
  const { user } = useAuth();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);

  const userCampaigns = campaigns.filter(c => c.userId === user?.id);
  const activeCampaign = selectedCampaign 
    ? campaigns.find(c => c.id === selectedCampaign) 
    : userCampaigns[0];
  
  const campaignBroadcasts = broadcasts.filter(b => b.campaignId === activeCampaign?.id);
  const campaignActionTypes = actionTypes.filter(at => at.campaignId === activeCampaign?.id);

  const getTotalContacts = () => {
    return campaignBroadcasts.reduce((acc, b) => acc + b.contactCount, 0);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Campanhas de Disparo</h1>
          <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Campanha</Label>
                  <Input id="name" placeholder="Ex: Lançamento Janeiro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" placeholder="Descreva o objetivo da campanha" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsNewCampaignOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    Criar Campanha
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          Gerencie suas campanhas e registre seus disparos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Campaigns Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Minhas Campanhas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {userCampaigns.length > 0 ? (
                userCampaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      activeCampaign?.id === campaign.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{campaign.name}</p>
                        <p className={`text-xs ${
                          activeCampaign?.id === campaign.id ? 'opacity-80' : 'text-muted-foreground'
                        }`}>
                          {broadcasts.filter(b => b.campaignId === campaign.id).length} disparos
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6">
                  <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma campanha</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Content */}
        <div className="lg:col-span-3">
          {activeCampaign ? (
            <div className="space-y-6">
              {/* Campaign Stats */}
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Disparos</CardTitle>
                  <Dialog open={isNewBroadcastOpen} onOpenChange={setIsNewBroadcastOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Registrar Disparo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Registrar Novo Disparo</DialogTitle>
                      </DialogHeader>
                      <form className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input id="date" type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="time">Hora</Label>
                            <Input id="time" type="time" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="actionType">Tipo de Ação</Label>
                          <Input id="actionType" placeholder="Ex: Lançamento, Convite..." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="list">Lista Utilizada</Label>
                          <Input id="list" placeholder="Nome da lista" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="template">Template</Label>
                          <Input id="template" placeholder="Nome do template" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contacts">Quantidade de Contatos</Label>
                          <Input id="contacts" type="number" placeholder="500" />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setIsNewBroadcastOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" className="gradient-primary">
                            Registrar
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {campaignBroadcasts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Lista</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead className="text-right">Contatos</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignBroadcasts.map((broadcast) => {
                          const actionType = actionTypes.find(at => at.id === broadcast.actionTypeId);
                          return (
                            <TableRow key={broadcast.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span>{format(new Date(broadcast.date), "dd/MM", { locale: ptBR })} {broadcast.time}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge style={{ backgroundColor: actionType?.color }}>
                                  {actionType?.name || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{broadcast.listName}</TableCell>
                              <TableCell className="text-muted-foreground">{broadcast.templateUsed}</TableCell>
                              <TableCell className="text-right font-medium">
                                {broadcast.contactCount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  broadcast.status === 'completed' ? 'default' :
                                  broadcast.status === 'scheduled' ? 'secondary' : 'destructive'
                                } className={broadcast.status === 'completed' ? 'bg-success' : ''}>
                                  {broadcast.status === 'completed' ? 'Concluído' :
                                   broadcast.status === 'scheduled' ? 'Agendado' : 'Falhou'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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
              <p className="text-muted-foreground mb-4">
                Crie sua primeira campanha para começar a registrar seus disparos.
              </p>
              <Button className="gradient-primary" onClick={() => setIsNewCampaignOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Campaigns;
