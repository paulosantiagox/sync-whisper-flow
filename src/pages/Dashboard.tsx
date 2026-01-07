import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { users, projects, whatsappNumbers, broadcasts, activityLogs } from '@/data/mockData';
import { Users, FolderKanban, Phone, Megaphone, Activity, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MasterDashboard = () => {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingUsers = users.filter(u => u.status === 'pending').length;
  const totalProjects = projects.length;
  const totalNumbers = whatsappNumbers.length;

  const recentLogs = activityLogs.slice(0, 5);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Usuários Ativos"
          value={activeUsers}
          subtitle={`${pendingUsers} aguardando aprovação`}
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Total de Projetos"
          value={totalProjects}
          icon={FolderKanban}
        />
        <StatsCard
          title="Números Monitorados"
          value={totalNumbers}
          icon={Phone}
        />
        <StatsCard
          title="Disparos Realizados"
          value={broadcasts.length}
          icon={Megaphone}
        />
      </div>

      {/* Recent Activity */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLogs.map((log) => {
              const user = users.find(u => u.id === log.userId);
              return (
                <div 
                  key={log.id} 
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(log.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const UserDashboard = () => {
  const { user } = useAuth();
  
  const userProjects = projects.filter(p => p.userId === user?.id);
  const userNumbers = whatsappNumbers.filter(n => 
    userProjects.some(p => p.id === n.projectId)
  );
  const userBroadcasts = broadcasts.filter(b => 
    userProjects.some(p => p.id === b.campaignId) // This is simplified
  );

  const statusCounts = {
    high: userNumbers.filter(n => n.qualityRating === 'HIGH').length,
    medium: userNumbers.filter(n => n.qualityRating === 'MEDIUM').length,
    low: userNumbers.filter(n => n.qualityRating === 'LOW').length,
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Meus Projetos"
          value={userProjects.length}
          icon={FolderKanban}
          variant="primary"
        />
        <StatsCard
          title="Números Monitorados"
          value={userNumbers.length}
          icon={Phone}
        />
        <StatsCard
          title="Campanhas Ativas"
          value={userBroadcasts.length}
          icon={Megaphone}
        />
        <StatsCard
          title="Status dos Números"
          value={`${statusCounts.high}/${statusCounts.medium}/${statusCounts.low}`}
          subtitle="Alta / Média / Baixa"
          icon={Activity}
        />
      </div>

      {/* Projects Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Meus Projetos</h2>
          <Badge variant="secondary">{userProjects.length} projetos</Badge>
        </div>

        {userProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map((project, index) => (
              <div key={project.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <ProjectCard 
                  project={project} 
                  numbers={whatsappNumbers.filter(n => n.projectId === project.id)}
                />
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
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {isMaster 
            ? 'Visão geral do sistema e gestão de usuários'
            : 'Monitore seus projetos e números WhatsApp'
          }
        </p>
      </div>

      {isMaster ? <MasterDashboard /> : <UserDashboard />}
    </DashboardLayout>
  );
};

export default Dashboard;
