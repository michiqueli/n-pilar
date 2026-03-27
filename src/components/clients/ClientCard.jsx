import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Star, Eye, Edit, Calendar, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';


const ClientCard = ({ client, index, onViewProfile, onEdit, onScheduleAppointment, onDelete, onSendConsent, viewMode }) => {
  const getClientAvatar = (name) => {
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-primary',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500'
    ];
    const colorIndex = name.length % colors.length;
    return { initials, color: colors[colorIndex] };
  };

  const getLastVisitText = (lastVisit) => {
    if (!lastVisit) return 'Primera visita';
    try {
      return formatDistanceToNow(new Date(lastVisit), { addSuffix: true, locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getClientType = (client) => {
    if (!client.lastVisit) return 'new';
    if (client.visits >= 10) return 'frequent';
    if (new Date() - new Date(client.lastVisit) > 30 * 24 * 60 * 60 * 1000) return 'inactive';
    return 'regular';
  };

  const isNewClient = (createdAt) => {
    const daysSinceCreated = (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
    return daysSinceCreated <= 7;
  };

  const getClientTypeStyles = (type) => {
    switch (type) {
      case 'frequent':
        return 'border-l-4 border-l-success bg-success/5';
      case 'inactive':
        return 'border-l-4 border-l-muted-foreground bg-muted/20';
      case 'new':
        return 'border-l-4 border-l-blue-400 bg-blue-400/5';
      default:
        return 'border-l-4 border-l-primary bg-primary/5';
    }
  };

  const avatar = getClientAvatar(client?.name);
  const clientType = getClientType(client);
  const typeStyles = getClientTypeStyles(clientType);
  
  const isCompact = viewMode === 'compact';

  if (viewMode === 'mobile') {
     return (
        <motion.div
            className={cn("premium-card p-4 flex items-center gap-4 w-full", typeStyles)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onViewProfile(client)}
        >
            <div className={cn(
                `rounded-full ${avatar.color} flex items-center justify-center text-primary-foreground font-bold shadow-lg flex-shrink-0 w-12 h-12 text-base`
            )}>
                {avatar.initials}
            </div>
            <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-foreground truncate">{client?.name}</h3>
                <p className="text-muted-foreground text-sm truncate">{client?.phone}</p>
                 <p className="text-muted-foreground text-xs truncate">{getLastVisitText(client.lastVisit)}</p>
            </div>
            <Button size="lg" variant="primary" className="h-12 w-auto" onClick={(e) => { e.stopPropagation(); onScheduleAppointment(client); }}>
                <Calendar className="w-4 h-4" />
                <span className="sr-only">Agendar</span>
            </Button>
        </motion.div>
     )
  }

  return (
    <motion.div
      className={cn(
        "premium-card hover:border-primary/50 transition-all duration-300 group relative", 
        typeStyles,
        isCompact ? 'p-4' : 'p-6'
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px hsl(var(--primary) / 0.1), 0 8px 10px -6px hsl(var(--primary) / 0.1)" }}
    >
      {isNewClient(client.createdAt) && !isCompact && (
        <div className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-400/30 font-semibold">
          NUEVO
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={cn(
            `rounded-full ${avatar.color} flex items-center justify-center text-primary-foreground font-bold shadow-lg`,
            isCompact ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-lg'
            )}>
            {avatar.initials}
          </div>
          <div className="flex-1">
            <h3 className={cn(
              "font-bold text-foreground group-hover:text-primary transition-colors",
              isCompact ? 'text-base' : 'text-lg'
            )}>
              {client?.name}
            </h3>
          </div>
        </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary opacity-50 group-hover:opacity-100 transition-all duration-200"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewProfile(client)}>
                <Eye className="w-4 h-4 mr-2" /> Ver Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(client)}>
                <Edit className="w-4 h-4 mr-2" /> Editar Cliente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onScheduleAppointment(client)}>
                <Calendar className="w-4 h-4 mr-2" /> Agendar Cita
              </DropdownMenuItem>
              {!client.consent_status === 'accepted' && client.email && onSendConsent && (
                <DropdownMenuItem onClick={() => onSendConsent(client)}>
                  <ShieldAlert className="w-4 h-4 mr-2" /> Enviar Consentimiento
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(client.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
      
      {!isCompact && (
        <>
          <div className="space-y-3 mb-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Phone className="w-4 h-4 mr-3 text-primary" />
              <span>{client?.phone}</span>
            </div>
            
            {client.email && (
              <div className="flex items-center text-muted-foreground">
                <Mail className="w-4 h-4 mr-3 text-primary" />
                <span>{client.email}</span>
              </div>
            )}

            <div className="flex items-center text-muted-foreground">
              <Calendar className="w-4 h-4 mr-3 text-primary" />
              <span>Fecha última visita: {client.lastVisit ? format(new Date(client.lastVisit), 'dd/MM/yyyy') : 'Nunca'}</span>
            </div>

            <div className="flex items-center text-muted-foreground">
              <Star className="w-4 h-4 mr-3 text-primary" />
              <span>Servicio habitual: {client.preferred_service?.name || 'Sin definir'}</span>
            </div>

            <div className="flex items-center text-muted-foreground">
              {client.consent_status === 'accepted' ? (
                <>
                  <ShieldCheck className="w-4 h-4 mr-3 text-green-500" />
                  <span className="text-green-600">Consentimiento firmado</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 mr-3 text-amber-500" />
                  <span className="text-amber-600">Consentimiento pendiente</span>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={() => onScheduleAppointment(client)}
              className="w-full"
              variant="primary"
              size="lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendar nueva cita
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ClientCard;