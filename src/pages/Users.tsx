import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useUsers, useUserStats, useUpdateUserStatus } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { useAllWhatsAppNumbers } from '@/hooks/useWhatsAppNumbers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserPlus, Check, X, Eye, Edit2, Trash2, Users as UsersIcon, FolderKanban, Phone, Activity, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: users = [], isLoading } = useUsers();
  const { data: stats } = useUserStats();
  const { data: projects = [] } = useProjects();
  const { data: numbers = [] } = useAllWhatsAppNumbers();
  const updateStatus = useUpdateUserStatus();

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus && u.role !== 'master';
  });

  const getUserStats = (userId: string) => {
    const userProjects = projects.filter(p => p.userId === userId);
    const projectIds = userProjects.map(p => p.id);
    const userNumbers = numbers.filter(n => projectIds.includes(n.projectId));
    return { projects: userProjects.length, numbers: userNumbers.length };
  };

  if (isLoading) {
    return <DashboardLayout><div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
        <p className="text-muted-foreground">Gerencie os usuários da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><UsersIcon className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats?.total || 0}</p><p className="text-xs text-muted-foreground">Total de Usuários</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Check className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">{stats?.active || 0}</p><p className="text-xs text-muted-foreground">Ativos</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Activity className="w-5 h-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats?.pending || 0}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><X className="w-5 h-5 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{stats?.inactive || 0}</p><p className="text-xs text-muted-foreground">Inativos</p></div></div></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar usuários..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="pending">Pendentes</SelectItem><SelectItem value="inactive">Inativos</SelectItem></SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Projetos</TableHead>
              <TableHead className="text-center">Números</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const userStats = getUserStats(user.id);
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div><p className="font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : user.status === 'pending' ? 'secondary' : 'outline'} className={user.status === 'active' ? 'bg-success' : user.status === 'pending' ? 'bg-warning text-warning-foreground' : ''}>
                      {user.status === 'active' ? 'Ativo' : user.status === 'pending' ? 'Pendente' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center"><span className="flex items-center justify-center gap-1"><FolderKanban className="w-4 h-4 text-muted-foreground" />{userStats.projects}</span></TableCell>
                  <TableCell className="text-center"><span className="flex items-center justify-center gap-1"><Phone className="w-4 h-4 text-muted-foreground" />{userStats.numbers}</span></TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {user.status === 'pending' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success hover:bg-success/10" onClick={() => updateStatus.mutate({ userId: user.id, status: 'active' })}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </DashboardLayout>
  );
};

export default UsersPage;
