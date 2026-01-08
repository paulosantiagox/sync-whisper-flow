import { useState } from 'react';
import { Project, WhatsAppNumber } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, Phone, ChevronRight, Calendar, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

interface ProjectCardProps {
  project: Project;
  numbers: WhatsAppNumber[];
  onEdit?: (project: Project, data: { name: string; description?: string }) => void;
  onDelete?: (projectId: string) => void;
}

const ProjectCard = ({ project, numbers, onEdit, onDelete }: ProjectCardProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description || '');

  const statusCounts = {
    high: numbers.filter(n => n.qualityRating === 'HIGH').length,
    medium: numbers.filter(n => n.qualityRating === 'MEDIUM').length,
    low: numbers.filter(n => n.qualityRating === 'LOW').length,
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onEdit?.(project, { name: editName.trim(), description: editDescription.trim() || undefined });
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    onDelete?.(project.id);
    setIsDeleteOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-slide-up group">
        <CardContent className="p-0">
          {/* Header with icon */}
          <div className="p-5 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                {project.icon ? (
                  <img 
                    src={project.icon} 
                    alt={project.name} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <FolderKanban className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                  {(onEdit || onDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onEdit && onDelete && <DropdownMenuSeparator />}
                        {onDelete && (
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setIsDeleteOpen(true)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 pb-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {numbers.length} números
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(project.updatedAt), "dd/MM", { locale: ptBR })}
              </span>
            </div>

            {/* Status pills */}
            {numbers.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {statusCounts.high > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                    🟢 {statusCounts.high}
                  </span>
                )}
                {statusCounts.medium > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning font-medium">
                    🟡 {statusCounts.medium}
                  </span>
                )}
                {statusCounts.low > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-medium">
                    🔴 {statusCounts.low}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action */}
          <div className="px-5 pb-5">
            <Link to={`/projects/${project.id}`}>
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Ver Detalhes
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 mt-4" onSubmit={handleEdit}>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Projeto</Label>
              <Input 
                id="edit-name" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição (opcional)</Label>
              <Textarea 
                id="edit-description" 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary">
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Excluir Projeto"
        description={`Tem certeza que deseja excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
};

export default ProjectCard;