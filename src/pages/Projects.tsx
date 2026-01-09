import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useAllWhatsAppNumbers } from '@/hooks/useWhatsAppNumbers';
import { useSortableItems } from '@/hooks/useSortableItems';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderKanban, Plus, Search, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Projects = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const { data: projects = [], isLoading } = useProjects();
  const { data: allNumbers = [] } = useAllWhatsAppNumbers();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  // Hook de ordenação e fixação
  const { sortedItems, isPinned, togglePin, moveUp, moveDown } = useSortableItems<Project>({
    storageKey: 'projects-order',
    items: projects,
  });

  const handleEditProject = (project: any, data: { name: string; description?: string }) => {
    updateProject.mutate({ id: project.id, ...data });
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject.mutate(projectId);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const result = await createProject.mutateAsync({
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
    });

    setProjectName('');
    setProjectDescription('');
    setIsDialogOpen(false);
    navigate(`/projects/${result.id}`);
  };

  // Filtra mantendo a ordem
  const filteredProjects = sortedItems.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Meus Projetos</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary"><Plus className="w-4 h-4 mr-2" />Novo Projeto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Novo Projeto</DialogTitle></DialogHeader>
              <form className="space-y-4 mt-4" onSubmit={handleCreateProject}>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Projeto</Label>
                  <Input id="name" placeholder="Ex: E-commerce Principal" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea id="description" placeholder="Descreva o propósito deste projeto..." value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="gradient-primary" disabled={createProject.isPending}>
                    {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Criar Projeto
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">Gerencie seus projetos de monitoramento WhatsApp</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar projetos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 max-w-md" />
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <div key={project.id} style={{ animationDelay: `${index * 0.1}s` }}>
              <ProjectCard 
                project={project} 
                numbers={allNumbers.filter(n => n.projectId === project.id)} 
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                isPinned={isPinned(project.id)}
                onTogglePin={() => togglePin(project.id)}
                onMoveUp={() => moveUp(project.id)}
                onMoveDown={() => moveDown(project.id)}
                canMoveUp={index > 0}
                canMoveDown={index < filteredProjects.length - 1}
              />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center animate-fade-in">
          <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">Nenhum projeto ainda</h3>
          <p className="text-muted-foreground mb-4">Crie seu primeiro projeto para começar a monitorar seus números WhatsApp.</p>
          <Button className="gradient-primary" onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Criar Primeiro Projeto</Button>
        </Card>
      ) : (
        <Card className="p-8 text-center animate-fade-in">
          <Search className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhum projeto encontrado para "{searchQuery}"</p>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default Projects;
