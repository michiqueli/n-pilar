import React from 'react';
import { Search, SlidersHorizontal, ArrowDownUp, LayoutGrid, Rows, List, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const ClientFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy, 
  filterBy, 
  setFilterBy, 
  clients,
  viewMode,
  setViewMode,
  isMobile
}) => {

  const filterOptions = [
    { key: 'all', label: 'Todos', color: 'bg-muted', textColor: 'text-muted-foreground' },
    { key: 'active', label: 'Activos', color: 'bg-primary/20', textColor: 'text-primary' },
    { key: 'frequent', label: 'Frecuentes', color: 'bg-green-500/20', textColor: 'text-green-500' },
    { key: 'regular', label: 'Regulares', color: 'bg-blue-500/20', textColor: 'text-blue-500' },
    { key: 'dormant', label: 'Sin actividad', color: 'bg-yellow-500/20', textColor: 'text-yellow-500' },
    { key: 'inactive', label: 'Desactivados', color: 'bg-red-500/20', textColor: 'text-red-500' }
  ];

  const sortOptions = [
    { key: 'lastVisit', label: 'Última visita' },
    { key: 'name', label: 'Nombre (A-Z)' },
    { key: 'totalSpent', label: 'Mayor Gasto' },
    { key: 'oldestVisit', label: 'Más antiguos' }
  ];

  const getFilterCount = (filter) => {
    switch (filter) {
      case 'all':
        return clients.length;
      case 'active':
        return clients.filter(c => c.active !== false).length;
      case 'frequent':
        return clients.filter(c => c.active !== false && (c.total_visits || 0) >= 10).length;
      case 'regular':
        return clients.filter(c => c.active !== false && (c.total_visits || 0) >= 3 && (c.total_visits || 0) < 10).length;
      case 'dormant':
        return clients.filter(c => c.active !== false && (!c.last_visit_at || (new Date() - new Date(c.last_visit_at)) > 90 * 24 * 60 * 60 * 1000)).length;
      case 'inactive':
        return clients.filter(c => c.active === false).length;
      default:
        return 0;
    }
  };
  
  const viewOptions = [
    { key: 'grid', label: 'Cuadrícula', icon: LayoutGrid },
    { key: 'compact', label: 'Compacta', icon: Rows },
    { key: 'list', label: 'Lista', icon: List }
  ];

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 text-base h-12"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-12 flex-1">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar ({filterOptions.find(f => f.key === filterBy)?.label})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filtrar por tipo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filterOptions.map(option => (
                <DropdownMenuItem key={option.key} onClick={() => setFilterBy(option.key)} className={cn(filterBy === option.key && 'bg-accent')}>
                  {option.label}
                  <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{getFilterCount(option.key)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-12 w-auto">
                  <ArrowDownUp className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map(option => (
                <DropdownMenuItem key={option.key} onClick={() => setSortBy(option.key)} className={cn(sortBy === option.key && 'bg-accent')}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-grow max-w-lg">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 text-base h-12"
          />
        </div>
        <div className="flex items-center gap-2">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-12 w-full md:w-auto">
                    <ArrowDownUp className="w-4 h-4 mr-2" />
                    Ordenar por
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sortOptions.map(option => (
                    <DropdownMenuItem key={option.key} onClick={() => setSortBy(option.key)}>{option.label}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center bg-muted p-1 rounded-lg">
              {viewOptions.map(option => (
                <Tooltip key={option.key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === option.key ? 'primary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode(option.key)}
                      className="h-10 w-10"
                    >
                      <option.icon className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Vista {option.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground mr-2">Filtrar:</span>
        {filterOptions.map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterBy(filter.key)}
            className={cn(
              `px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 border`,
              filterBy === filter.key
                ? `${filter.color} ${filter.textColor} border-current/30`
                : 'bg-card text-muted-foreground hover:bg-accent border-border'
            )}
          >
            <span>{filter.label}</span>
            <span className={cn(
              `text-xs px-2 py-0.5 rounded-full`,
               filterBy === filter.key ? 'bg-black/10 dark:bg-white/10' : 'bg-muted'
            )}>
              {getFilterCount(filter.key)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClientFilters;