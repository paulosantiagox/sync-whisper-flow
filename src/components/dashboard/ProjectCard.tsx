import { Project, WhatsAppNumber } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, Phone, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectCardProps {
  project: Project;
  numbers: WhatsAppNumber[];
}

const ProjectCard = ({ project, numbers }: ProjectCardProps) => {
  const statusCounts = {
    high: numbers.filter(n => n.qualityRating === 'HIGH').length,
    medium: numbers.filter(n => n.qualityRating === 'MEDIUM').length,
    low: numbers.filter(n => n.qualityRating === 'LOW').length,
  };

  return (
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
              <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
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
  );
};

export default ProjectCard;
