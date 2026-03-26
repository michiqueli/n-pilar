import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, MessageSquare, PlusCircle, Banknote } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import AppointmentModal from '@/components/calendar/AppointmentModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { api } from '@/lib/api';

const TodaySchedule = () => {
    const { toast } = useToast();
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [workSchedules, setWorkSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    useEffect(() => {
        const fetchTodaysData = async () => {
            setLoading(true);
            const todayStart = startOfDay(new Date()).toISOString();
            const todayEnd = endOfDay(new Date()).toISOString();
            const todayDayOfWeek = new Date().getDay();

            try {
                const [appointmentsData, clientsData, servicesData, allSchedules] = await Promise.all([
                    api.getAppointments(todayStart, todayEnd),
                    api.getClients(),
                    api.getActiveServices(),
                    api.getWorkSchedules(),
                ]);

                setAppointments(appointmentsData || []);
                setClients(clientsData || []);
                setServices(servicesData || []);
                setWorkSchedules((allSchedules || []).filter(s => s.day_of_week === todayDayOfWeek));

            } catch (error) {
                console.error("Error fetching today's schedule:", error);
                toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la agenda de hoy." });
            } finally {
                setLoading(false);
            }
        };

        fetchTodaysData();
    }, [toast]);

    const dailySchedule = useMemo(() => {
        const schedule = [];
        const timeToMinutes = (time) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };

        appointments.forEach(app => {
            schedule.push({
                ...app, // Incluimos todos los datos de la cita
                time: format(parseISO(app.appointment_at), 'HH:mm'),
                client: app.clients?.name || 'Cliente',
                service: app.services?.name || 'Servicio',
                status: 'confirmada',
                price: app.price_at_time,
                isFreeSlot: false,
            });
        });

        const workingRanges = workSchedules.filter(s => !s.is_break);
        workingRanges.forEach(range => {
            let currentTime = timeToMinutes(range.start_time);
            const endTime = timeToMinutes(range.end_time);

            while (currentTime < endTime) {
                const isOccupied = appointments.some(app => {
                    const appStartTime = timeToMinutes(format(parseISO(app.appointment_at), 'HH:mm'));
                    const appEndTime = appStartTime + app.duration_at_time_minutes;
                    return currentTime >= appStartTime && currentTime < appEndTime;
                });

                if (!isOccupied) {
                    const h = Math.floor(currentTime / 60).toString().padStart(2, '0');
                    const m = (currentTime % 60).toString().padStart(2, '0');
                    schedule.push({
                        id: `free-${currentTime}`,
                        time: `${h}:${m}`,
                        client: null,
                        service: 'HUECO LIBRE',
                        status: 'libre',
                        price: 0,
                        isFreeSlot: true,
                    });
                }
                currentTime += 15;
            }
        });

        return schedule.sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments, workSchedules]);

    // --- NUEVO: Lógica para enviar recordatorio por WhatsApp ---
    const handleSendReminder = async (appointment) => {
        if (appointment.clients && appointment.clients?.phone) {
            const cleanPhoneNumber = appointment.clients?.phone.replace(/[^0-9]/g, '');
            const message = encodeURIComponent(`¡Hola ${appointment?.clients?.name}! Te recordamos tu turno para un servicio de "${appointment?.services?.name}" hoy a las ${format(parseISO(appointment.appointment_at), 'HH:mm')}hs. ¡Te esperamos en Skin Hair Studio PILAR!`);
            window.open(`https://wa.me/${cleanPhoneNumber}?text=${message}`, '_blank');

            // Actualizamos la base de datos para marcar el recordatorio como enviado
            try {
                await api.updateAppointment(appointment.id, { reminder_sent: true });
                // Actualizamos el estado local para que la UI cambie al instante
                setAppointments(prev => prev.map(apt =>
                    apt.id === appointment.id ? { ...apt, reminder_sent: true } : apt
                ));
                toast({ title: "📱 Recordatorio Enviado", description: "Se ha abierto WhatsApp para enviar el mensaje." });
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado del recordatorio." });
            }
        } else {
            toast({
                title: '⚠️ Sin número de teléfono',
                description: 'Este cliente no tiene un número de WhatsApp guardado.',
                variant: 'destructive'
            });
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmada': return <CheckCircle className="w-5 h-5 text-success" />;
            case 'libre': return <PlusCircle className="w-5 h-5 text-muted-foreground" />;
            default: return <Clock className="w-5 h-5 text-warning" />;
        }
    };

    const handleNewAppointment = (time) => {
        const [hour, minute] = time.split(':');
        const hourIndex = (parseInt(hour) - 8) * 4 + Math.floor(parseInt(minute) / 15);
        setModalData({ date: new Date(), hourIndex });
        setIsModalOpen(true);
    };

    const handleAppointmentClick = (appointment) => {
        if (appointment.status === 'libre') {
            handleNewAppointment(appointment.time);
        } else {
            toast({
                title: `📅 Cita de ${appointment.client}`,
                description: `${appointment.service} a las ${appointment.time}`,
            });
        }
    };

    const handleSaveAppointment = async (data) => {
        try {
            let clientId = data.details.clientId;
            let clientName = data.details.clientName;

            if (data.details.isNew) {
                const newClient = await api.createClient({ name: data?.details?.name, phone: data?.details?.phone });
                clientId = newClient.id;
                clientName = newClient?.name;
                setClients(prev => [...prev, newClient]);
            }
            
            const selectedService = services.find(s => s.id === data.details.serviceId);
            if (!selectedService) throw new Error("Servicio no encontrado");

            const appointmentDateTime = new Date(data.date);
            const totalMinutes = 8 * 60 + data.hourIndex * 15;
            appointmentDateTime.setHours(Math.floor(totalMinutes / 60));
            appointmentDateTime.setMinutes(totalMinutes % 60);
            appointmentDateTime.setSeconds(0, 0);
            appointmentDateTime.setMilliseconds(0);

            const appointmentTimestamp = format(appointmentDateTime, "yyyy-MM-dd'T'HH:mm:ssXXX");
            
            const newAppointmentForDB = {
                client_id: clientId, service_id: data.details.serviceId,
                appointment_at: appointmentTimestamp, status: 'SCHEDULED',
                price_at_time: selectedService.sale_price,
                duration_at_time_minutes: selectedService.duration_min,
                notes: data.details.notes,
            };

            const insertedAppointment = await api.createAppointment(newAppointmentForDB);

            setAppointments(prev => [...prev, insertedAppointment].sort((a,b) => a.appointment_at.localeCompare(b.appointment_at)));
            setIsModalOpen(false);
            toast({
                title: "✅ Cita Guardada",
                description: `Se ha agendado a ${clientName} para el servicio ${selectedService?.name}.`,
                className: 'bg-success text-white'
            });
        } catch (error) {
            toast({ variant: "destructive", title: "❌ Error al Guardar", description: "No se pudo crear la cita." });
        }
    };

    const estimatedRevenue = dailySchedule
        .filter(a => !a.isFreeSlot)
        .reduce((sum, a) => sum + a.price, 0);

    if (loading) {
        return <div className="premium-card p-4 sm:p-6 h-full animate-pulse">Cargando agenda del día...</div>;
    }

    return (
        <>
            <div className="premium-card p-4 sm:p-6 overflow-hidden h-full flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-card-foreground flex items-center tracking-tight">
                        <Clock className="w-6 sm:w-7 h-6 sm:h-7 mr-3 text-primary" />
                        Agenda de Hoy
                    </h3>
                    <div className="text-sm sm:text-base text-muted-foreground">
                        {appointments.length} citas programadas
                    </div>
                </div>
                
                <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar" aria-label="Lista de turnos móvil">
                    {dailySchedule.map((appointment, index) => (
                        <motion.div
                            key={appointment.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            {appointment.status === 'libre' ? (
                                <Button
                                    variant="ghost"
                                    className="w-full h-auto p-4 flex items-center justify-between rounded-xl transition-all duration-300 border border-dashed border-border/50 hover:bg-accent hover:border-primary/50"
                                    onClick={() => handleAppointmentClick(appointment)}
                                    aria-label={`Agendar cita a las ${appointment.time}`}
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="text-center min-w-[50px]">
                                            <p className="text-base sm:text-lg font-bold text-card-foreground">
                                                {appointment.time}
                                            </p>
                                        </div>
                                        <div className="w-px h-10 bg-border/70 hidden sm:block"></div>
                                        <div className="flex items-center text-muted-foreground font-semibold text-sm sm:text-base">
                                            <PlusCircle className="w-5 h-5 mr-3 text-gray-400" />
                                            Hueco Libre - Agendar
                                        </div>
                                    </div>
                                </Button>
                            ) : (
                                <div
                                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 border bg-card hover:bg-accent"
                                    onClick={() => handleAppointmentClick(appointment)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAppointmentClick(appointment)}
                                >
                                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                        <div className="text-center min-w-[50px]">
                                            <p className="text-base sm:text-lg font-bold text-card-foreground">
                                                {appointment.time}
                                            </p>
                                        </div>
                                        <div className="w-px h-10 bg-border/70 hidden sm:block"></div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-card-foreground tracking-tight text-base sm:text-lg truncate" title={appointment.client}>
                                                {appointment.client}
                                            </h4>
                                            <p className="text-muted-foreground text-sm sm:text-base truncate" title={appointment.service}>
                                                {appointment.service}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 sm:space-x-4 ml-2">
                                        {/* --- NUEVO: Renderizado del botón de recordatorio --- */}
                                        {appointment.reminder_sent ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center justify-center w-8 h-8">
                                                        <CheckCircle className="w-5 h-5 text-success" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Recordatorio enviado</p></TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon"
                                                        onClick={(e) => { e.stopPropagation(); handleSendReminder(appointment); }}
                                                        className="text-warning hover:text-yellow-700 hover:bg-yellow-100/50 h-8 w-8"
                                                        aria-label="Enviar recordatorio"
                                                    >
                                                        <MessageSquare className="w-5 h-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Enviar recordatorio de cita</p></TooltipContent>
                                            </Tooltip>
                                        )}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="w-6 h-6 flex items-center justify-center">
                                                    {getStatusIcon(appointment.status)}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="capitalize">{appointment.status.replace('_', ' ')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-center items-center p-3 rounded-lg bg-accent/50">
                        <div className="flex items-center space-x-2 text-primary">
                            <Banknote className="w-5 h-5" />
                            <span className="font-bold text-base sm:text-lg text-card-foreground">${estimatedRevenue.toFixed(2)}</span>
                        </div>
                        <span className="text-muted-foreground text-xs sm:text-sm ml-2">Ganancia estimada</span>
                    </div>
                </div>
            </div>
            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                modalData={modalData}
                onSave={handleSaveAppointment}
                clients={clients}
                services={services}
                appointments={appointments}
            />
        </>
    );
};

export default TodaySchedule;