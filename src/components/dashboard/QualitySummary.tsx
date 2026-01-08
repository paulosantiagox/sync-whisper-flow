import { useMemo, useState } from 'react';
import { WhatsAppNumber, QualityRating, Project } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualitySummaryProps {
  numbers: WhatsAppNumber[];
  projects: Project[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
}

type SortField = 'name' | 'quality';
type SortOrder = 'asc' | 'desc';

const qualityOrder: Record<QualityRating, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const QualitySummary = ({ numbers, projects, selectedProjectId, onProjectChange }: QualitySummaryProps) => {
  const [qualityFilter, setQualityFilter] = useState<QualityRating | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('quality');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const projectNumbers = useMemo(() => {
    let filtered = numbers.filter(n => n.projectId === selectedProjectId && n.isVisible);
    
    if (qualityFilter !== 'all') {
      filtered = filtered.filter(n => n.qualityRating === qualityFilter);
    }

    return filtered.sort((a, b) => {
      if (sortField === 'quality') {
        const diff = qualityOrder[a.qualityRating] - qualityOrder[b.qualityRating];
        return sortOrder === 'desc' ? -diff : diff;
      } else {
        const nameA = (a.customName || a.verifiedName).toLowerCase();
        const nameB = (b.customName || b.verifiedName).toLowerCase();
        return sortOrder === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
      }
    });
  }, [numbers, selectedProjectId, qualityFilter, sortField, sortOrder]);

  const stats = useMemo(() => {
    const all = numbers.filter(n => n.projectId === selectedProjectId && n.isVisible);
    return {
      high: all.filter(n => n.qualityRating === 'HIGH').length,
      medium: all.filter(n => n.qualityRating === 'MEDIUM').length,
      low: all.filter(n => n.qualityRating === 'LOW').length,
      total: all.length,
    };
  }, [numbers, selectedProjectId]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Status das Contas</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedProjectId} onValueChange={onProjectChange}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Selecione o projeto" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={qualityFilter} onValueChange={(v) => setQualityFilter(v as QualityRating | 'all')}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Qualidade" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="HIGH">🟢 Alta</SelectItem>
              <SelectItem value="MEDIUM">🟡 Média</SelectItem>
              <SelectItem value="LOW">🔴 Baixa</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => toggleSort('name')}
          >
            Nome
            {sortField === 'name' && <SortIcon className="w-3 h-3 ml-1" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => toggleSort('quality')}
          >
            Qualidade
            {sortField === 'quality' && <SortIcon className="w-3 h-3 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center gap-6 mb-4">
        <button
          onClick={() => setQualityFilter(qualityFilter === 'HIGH' ? 'all' : 'HIGH')}
          className={cn(
            "flex items-center gap-2 text-xs transition-opacity",
            qualityFilter !== 'all' && qualityFilter !== 'HIGH' && "opacity-50"
          )}
        >
          <RadarIcon color="hsl(var(--success))" />
          <span className="font-medium">{stats.high}</span>
          <span className="text-muted-foreground">Alta</span>
        </button>
        <button
          onClick={() => setQualityFilter(qualityFilter === 'MEDIUM' ? 'all' : 'MEDIUM')}
          className={cn(
            "flex items-center gap-2 text-xs transition-opacity",
            qualityFilter !== 'all' && qualityFilter !== 'MEDIUM' && "opacity-50"
          )}
        >
          <RadarIcon color="hsl(var(--warning))" />
          <span className="font-medium">{stats.medium}</span>
          <span className="text-muted-foreground">Média</span>
        </button>
        <button
          onClick={() => setQualityFilter(qualityFilter === 'LOW' ? 'all' : 'LOW')}
          className={cn(
            "flex items-center gap-2 text-xs transition-opacity",
            qualityFilter !== 'all' && qualityFilter !== 'LOW' && "opacity-50"
          )}
        >
          <RadarIcon color="hsl(var(--destructive))" />
          <span className="font-medium">{stats.low}</span>
          <span className="text-muted-foreground">Baixa</span>
        </button>
      </div>

      {/* Numbers List */}
      {projectNumbers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {projectNumbers.map((num) => (
            <div
              key={num.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-xs"
            >
              <RadarIcon 
                color={
                  num.qualityRating === 'HIGH' ? 'hsl(var(--success))' : 
                  num.qualityRating === 'MEDIUM' ? 'hsl(var(--warning))' : 
                  'hsl(var(--destructive))'
                } 
                size="sm"
              />
              <span className="font-medium truncate max-w-[100px]">
                {num.customName || num.verifiedName}
              </span>
              <span className="text-muted-foreground">
                •{num.displayPhoneNumber.slice(-4)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Nenhum número encontrado
        </p>
      )}
    </div>
  );
};

// Animated Radar Icon Component
const RadarIcon = ({ color, size = 'md' }: { color: string; size?: 'sm' | 'md' }) => {
  const dimensions = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className={cn("relative flex items-center justify-center", dimensions)}>
      {/* Core dot */}
      <div 
        className="absolute w-2 h-2 rounded-full z-10"
        style={{ backgroundColor: color }}
      />
      {/* Radar waves */}
      <div 
        className="absolute w-full h-full rounded-full animate-radar-wave opacity-60"
        style={{ borderColor: color, borderWidth: '1.5px' }}
      />
      <div 
        className="absolute w-full h-full rounded-full animate-radar-wave opacity-40"
        style={{ borderColor: color, borderWidth: '1px', animationDelay: '0.5s' }}
      />
      <div 
        className="absolute w-full h-full rounded-full animate-radar-wave opacity-20"
        style={{ borderColor: color, borderWidth: '0.5px', animationDelay: '1s' }}
      />
    </div>
  );
};

export default QualitySummary;
