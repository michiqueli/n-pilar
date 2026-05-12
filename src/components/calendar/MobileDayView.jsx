import React from 'react';
import { motion } from 'framer-motion';
import { Plus, User, Edit, Trash2, Coffee, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { isSameDay, parseISO, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

const hours = Array.from({ length: 57 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 15;
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const m = (totalMinutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
});

const statusConfig = {
    SCHEDULED: { label: 'Pendiente', className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
    REMINDER_SENT: { label: 'Recordatorio enviado', className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
    CONFIRMED: { label: 'Confirmado', className: 'bg-green-500/20 text-green-700 dark:text-green-400' },
    COMPLETED: { label: 'Completado', className: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
    PAID: { label: 'Pagado', className: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-500/20 text-red-700 dark:text-red-400' },
};

const MobileDayView = ({
  day,
  appointments,
  onAppointmentAction,
  onNewAppointment,
  isSlotAvailable
}) => {
  const isDayToday = isToday(day);

  const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.date), day));

  return (
    <div className="space-y-2 pb-24">
      {hours.map((hour, hourIndex) => {
        const appointment = dayAppointments.find(a => a.hourIndex === hourIndex);
        const available = isSlotAvailable(day, hourIndex);

        return (
          <div key={hour} className="flex items-stretch space-x-3">
            <div className="w-16 text-center text-muted-foreground font-medium text-sm pt-2">
              {hourIndex % 2 === 0 ? hour : ''}
            </div>
            <div className="flex-1 border-l border-border pl-3">
              {appointment ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      className={cn(
                        "bg-card p-3 cursor-pointer border-l-4 rounded-r-lg",
                        appointment.status === 'CANCELLED'
                          ? "border-red-400 bg-red-500/5 opacity-60"
                          : appointment.status === 'CONFIRMED'
                          ? "border-green-500 bg-green-500/5"
                          : appointment.status === 'REMINDER_SENT'
                          ? "border-blue-400 bg-blue-500/5"
                          : isDayToday
                          ? "border-primary bg-primary/5"
                          : "border-secondary-foreground bg-accent/30"
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="font-semibold text-foreground">{appointment.clientName}</p>
                      <p className="text-sm text-muted-foreground">{appointment.serviceName}</p>
                      {statusConfig[appointment.status] && (
                        <span className={cn("inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1", statusConfig[appointment.status].className)}>
                          {statusConfig[appointment.status].label}
                        </span>
                      )}
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {appointment.status === 'SCHEDULED' && new Date(appointment.appointment_at) > new Date() && (
                      <DropdownMenuItem onClick={() => onAppointmentAction('reminder', appointment)}>
                        <Send className="mr-2 h-4 w-4" />Enviar Recordatorio
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onAppointmentAction('profile', appointment)}>
                      <User className="mr-2 h-4 w-4" />Ver Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAppointmentAction('edit', appointment)}>
                      <Edit className="mr-2 h-4 w-4" />Modificar Cita
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onAppointmentAction('cancel', appointment)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />Cancelar Cita
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                available ? (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-10 border-dashed border transition-all duration-200",
                      isDayToday
                        ? "border-primary/20 hover:border-primary hover:bg-primary/10"
                        : "border-muted/50 hover:border-primary hover:bg-primary/5"
                    )}
                    onClick={() => onNewAppointment({ date: day, hourIndex })}
                  >
                    <Plus className={cn(
                      "w-5 h-5",
                      isDayToday ? "text-primary" : "text-muted-foreground/60"
                    )} />
                  </Button>
                ) : (
                    <div className="h-10 flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileDayView;