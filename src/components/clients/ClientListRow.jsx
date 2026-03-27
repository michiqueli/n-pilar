import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Eye, Edit, Calendar, Trash2, MoreVertical, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const ClientListRow = ({ client, onViewProfile, onEdit, onScheduleAppointment, onDelete }) => {
  const getClientAvatar = (name) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-red-500'
    ];
    const colorIndex = name.length % colors.length;
    return { initials, color: colors[colorIndex] };
  };

  const getLastVisitText = (lastVisit) => {
    if (!lastVisit) return 'Sin visitas';
    try {
      return formatDistanceToNow(new Date(lastVisit), { addSuffix: true, locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const avatar = getClientAvatar(client?.name);

  return (
    <motion.div
      className="premium-card p-4 flex items-center gap-4 hover:border-primary/50 transition-all duration-300 group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2, boxShadow: "0 4px 15px -2px hsl(var(--primary) / 0.1)" }}
    >
      <div className={`w-10 h-10 rounded-full ${avatar.color} flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0`}>
        {avatar.initials}
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{client?.name}</div>

        <div className="text-muted-foreground text-sm flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary/70" />
            {client?.phone}
        </div>

        <div className="text-muted-foreground text-sm hidden md:flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary/70" />
            {client?.email || 'No disponible'}
        </div>

        <div className="text-muted-foreground text-sm hidden md:flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary/70" />
            {getLastVisitText(client.lastVisit)}
        </div>

        <div className="text-sm hidden md:flex items-center gap-2">
            {client.consent_status === 'accepted' ? (
                <><ShieldCheck className="w-4 h-4 text-green-500" /><span className="text-green-600">Firmado</span></>
            ) : (
                <><ShieldAlert className="w-4 h-4 text-amber-500" /><span className="text-amber-600">Pendiente</span></>
            )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onScheduleAppointment(client)}>Agendar</Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9">
                    <MoreVertical className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewProfile(client)}><Eye className="w-4 h-4 mr-2" /> Ver Perfil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(client)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(client.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default ClientListRow;