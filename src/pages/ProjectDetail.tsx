import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import NumberCard from '@/components/dashboard/NumberCard';
import { projects, whatsappNumbers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Plus, Search, Phone, Activity, MessageCircle, 
  Filter, SlidersHorizontal 
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const project = projects.find(p => p.id === id);
  const numbers = whatsappNumbers.filter(n => n.projectId === id);

  const filteredNumbers = numbers.filter(n => {
    const matchesSearch = 
      n.displayPhoneNumber.includes(searchQuery) ||
      n.verifiedName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || n.qualityRating === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    high: numbers.filter(n => n.qualityRating === 'HIGH').length,
    medium: numbers.filter(n => n.qualityRating === 'MEDIUM').length,
    low: numbers.filter(n => n.qualityRating === 'LOW').length,
  };

  const totalLimit = numbers.reduce((acc, n) => {
    const limit = parseInt(n.messagingLimitTier) || 0;
    return acc + limit;
  }, 0);

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
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/projects" 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Projetos
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Número
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Adicionar Número WhatsApp</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Token de Acesso</Label>
                  <Input id="token" placeholder="EAAxxxxxxx..." type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bmId">Business Manager ID</Label>
                  <Input id="bmId" placeholder="123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wabaId">WABA ID</Label>
                  <Input id="wabaId" placeholder="987654321" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    Buscar Números
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Summary */}
      <Card className="mb-8 overflow-hidden">
        <div className="gradient-primary p-6">
          <h2 className="text-lg font-semibold text-primary-foreground mb-4">
            Resumo do Projeto
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1">
                <Phone className="w-4 h-4" />
                Total de Números
              </div>
              <p className="text-3xl font-bold text-primary-foreground">{numbers.length}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1">
                <Activity className="w-4 h-4" />
                Status
              </div>
              <div className="flex items-center gap-2 text-primary-foreground">
                <span className="text-lg font-semibold">🟢 {statusCounts.high}</span>
                <span className="text-lg font-semibold">🟡 {statusCounts.medium}</span>
                <span className="text-lg font-semibold">🔴 {statusCounts.low}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1">
                <MessageCircle className="w-4 h-4" />
                Limite Total
              </div>
              <p className="text-3xl font-bold text-primary-foreground">{totalLimit.toLocaleString()}/dia</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar números..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="HIGH">🟢 Alta Qualidade</SelectItem>
            <SelectItem value="MEDIUM">🟡 Média Qualidade</SelectItem>
            <SelectItem value="LOW">🔴 Baixa Qualidade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Numbers Grid */}
      {filteredNumbers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNumbers.map((number, index) => (
            <div key={number.id} style={{ animationDelay: `${index * 0.1}s` }}>
              <NumberCard 
                number={number}
                onViewHistory={() => console.log('View history:', number.id)}
                onEdit={() => console.log('Edit:', number.id)}
                onDelete={() => console.log('Delete:', number.id)}
              />
            </div>
          ))}
        </div>
      ) : numbers.length === 0 ? (
        <Card className="p-12 text-center animate-fade-in">
          <Phone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">Nenhum número cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Adicione seus números WhatsApp Business para começar o monitoramento.
          </p>
          <Button className="gradient-primary" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Número
          </Button>
        </Card>
      ) : (
        <Card className="p-8 text-center animate-fade-in">
          <SlidersHorizontal className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Nenhum número encontrado com os filtros selecionados
          </p>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default ProjectDetail;
