import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { useProjects } from '@/hooks/useProjects';
import { useAllWhatsAppNumbers } from '@/hooks/useWhatsAppNumbers';
import { useUsers } from '@/hooks/useUsers';
import { Users, FolderKanban, Phone, Megaphone, Activity, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const MasterDashboard = () => {
  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useProjects();
  const { data: numbers = [] } = useAllWhatsAppNumbers();

  const activeUsers = users.filter(u => u.status === 'active' && u.role !== 'master').length;
  const pendingUsers = users.filter(u => u.status === 'pending').length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Usuários Ativos" value={activeUsers} subtitle={`${pendingUsers} aguardando aprovação`} icon={Users} variant="primary" />
        <StatsCard title="Total de Projetos" value={projects.length} icon={FolderKanban} />
        <StatsCard title="Números Monitorados" value={numbers.length} icon={Phone} />
        <StatsCard title="Disparos Realizados" value={0} icon={Megaphone} />
      </div>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Visão Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bem-vindo ao painel de administração. Use o menu lateral para navegar.</p>
        </CardContent>
      </Card>
    </>
  );
};

const UserDashboard = () => {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useProjects();
  const { data: allNumbers = [] } = useAllWhatsAppNumbers();

  const userNumbers = allNumbers.filter(n => projects.some(p => p.id === n.projectId));

  const statusCounts = {
    high: userNumbers.filter(n => n.qualityRating === 'HIGH').length,
    medium: userNumbers.filter(n => n.qualityRating === 'MEDIUM').length,
    low: userNumbers.filter(n => n.qualityRating === 'LOW').length,
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Meus Projetos" value={projects.length} icon={FolderKanban} variant="primary" />
        <StatsCard title="Números Monitorados" value={userNumbers.length} icon={Phone} />
        <StatsCard title="Campanhas Ativas" value={0} icon={Megaphone} />
        <StatsCard title="Status dos Números" value={`${statusCounts.high}/${statusCounts.medium}/${statusCounts.low}`} subtitle="Alta / Média / Baixa" icon={Activity} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Meus Projetos</h2>
          <Badge variant="secondary">{projects.length} projetos</Badge>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <div key={project.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <ProjectCard project={project} numbers={allNumbers.filter(n => n.projectId === project.id)} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-2">Nenhum projeto ainda</h3>
            <p className="text-muted-foreground">Crie seu primeiro projeto para começar a monitorar seus números WhatsApp.</p>
          </Card>
        )}
      </div>
    </>
  );
};

const Dashboard = () => {
  const { user, isMaster } = useAuth();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">
          {isMaster ? 'Visão geral do sistema e gestão de usuários' : 'Monitore seus projetos e números WhatsApp'}
        </p>
      </div>
      {isMaster ? <MasterDashboard /> : <UserDashboard />}
    </DashboardLayout>
  );
};

export default Dashboard;
