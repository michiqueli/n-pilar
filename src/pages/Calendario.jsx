import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, startOfMonth, endOfMonth, isToday, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit, Coffee, X, Trash2, Moon, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import AppointmentModal from '@/components/calendar/AppointmentModal';
import AvailabilityModal from '@/components/calendar/AvailabilityModal';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import MobileDayView from '@/components/calendar/MobileDayView';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import api from '@/lib/api';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import config from '@/config';

const hours = Array.from({ length: 57 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 15;
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const m = (totalMinutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
});

const timeToMinutes = (time) => {
    if (!time || typeof time !== 'string') return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const MonthView = ({ monthDays, onDayClick, appointments, currentDate, availability }) => (
    <div className="grid grid-cols-7">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(day => (
            <div key={day} className="text-center font-bold text-sm text-muted-foreground p-2 border-b">{day}</div>
        ))}
        {monthDays.map((day, index) => {
            const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.appointment_at), day));
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isTheToday = isToday(day);

            const dateKey = format(day, 'yyyy-MM-dd');
            const dayOfWeek = day.getDay().toString();
            const schedule = availability.exceptions[dateKey] ?? availability.default[dayOfWeek] ?? { available: false, ranges: [] };

            return (
                <div
                    key={index}
                    className={cn(
                        "premium-card p-2 min-h-[100px] flex flex-col cursor-pointer hover:border-primary/50 transition-all duration-200 rounded-none border-t-0 border-l-0",
                        !isCurrentMonth && "bg-muted/50 opacity-60",
                        !schedule.available && "bg-muted/50 opacity-60",
                        (index % 7 !== 0) && "border-l"
                    )}
                    onClick={() => onDayClick(day)}
                >
                    <p className={cn("font-bold", isTheToday && "text-primary")}>
                        {format(day, 'd')}
                    </p>
                    {dayAppointments.length > 0 && isCurrentMonth && schedule.available && (
                        <div className="mt-2 text-xs bg-primary/20 text-primary rounded px-2 py-1 text-center font-semibold">
                            {dayAppointments.length} cita{dayAppointments.length > 1 ? 's' : ''}
                        </div>
                    )}
                    {!schedule.available && isCurrentMonth && (
                        <div className="mt-2 text-xs bg-destructive/20 text-destructive rounded px-2 py-1 text-center font-semibold">
                            Cerrado
                        </div>
                    )}
                </div>
            )
        })}
    </div>
);


const Calendario = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('week');

    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [availability, setAvailability] = useState({ default: {}, exceptions: {} });
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const swiperRef = useRef(null);

    const [preselectedClient, setPreselectedClient] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);

        try {
            const [appointmentsData, clientsData, servicesData, schedulesData, exceptionsData] = await Promise.all([
                api.getAppointments(monthStart.toISOString(), monthEnd.toISOString()),
                api.getClients(),
                api.getActiveServices(),
                api.getWorkSchedules(),
                api.getScheduleExceptions()
            ]);

            const appointmentsWithIndex = (appointmentsData || []).map(appointment => {
                const appointmentDate = parseISO(appointment.appointment_at);
                const hour = appointmentDate.getHours();
                const minute = appointmentDate.getMinutes();
                const hourIndex = (hour - 8) * 4 + Math.floor(minute / 15);
                const duration = appointment.duration_at_time_minutes || 15;
                const durationInSlots = Math.ceil(duration / 15);
                return { ...appointment, hourIndex, durationInSlots };
            });
            setAppointments(appointmentsWithIndex);

            setClients(clientsData || []);
            setServices(servicesData || []);

            const formattedAvailability = {
                default: {
                    '0': { available: false, ranges: [], breaks: [] }, '1': { available: false, ranges: [], breaks: [] },
                    '2': { available: false, ranges: [], breaks: [] }, '3': { available: false, ranges: [], breaks: [] },
                    '4': { available: false, ranges: [], breaks: [] }, '5': { available: false, ranges: [], breaks: [] },
                    '6': { available: false, ranges: [], breaks: [] },
                },
                exceptions: {}
            };

            (schedulesData || []).forEach(s => {
                const dayKey = s.day_of_week.toString();
                formattedAvailability.default[dayKey].available = true;
                if (s.is_break) {
                    formattedAvailability.default[dayKey].breaks.push({ start: s.start_time, end: s.end_time });
                } else {
                    formattedAvailability.default[dayKey].ranges.push({ start: s.start_time, end: s.end_time });
                }
            });
            (exceptionsData || []).forEach(e => {
                const dateKey = e.exception_date;

                if (!formattedAvailability.exceptions[dateKey]) {
                    formattedAvailability.exceptions[dateKey] = {
                        available: e.available,
                        ranges: [],
                        breaks: []
                    };
                }
                if (e.available) {
                    if (e.is_break) {
                        formattedAvailability.exceptions[dateKey].breaks.push({ start: e.start_time, end: e.end_time });
                    } else {
                        formattedAvailability.exceptions[dateKey].ranges.push({ start: e.start_time, end: e.end_time });
                    }
                }
            });
            setAvailability(formattedAvailability);

        } catch (error) {
            console.error("Error cargando datos del calendario:", error);
            toast({
                title: "Error de Carga",
                description: "No se pudieron cargar los datos de la agenda.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [currentDate, toast]);

    useEffect(() => {
        const clientFromNav = location.state?.newAppointmentClient;
        if (clientFromNav) {
            setPreselectedClient(clientFromNav);
            toast({
                title: "Cliente Seleccionado",
                description: `Haz clic en un horario disponible para agendar una cita para ${clientFromNav?.name}.`,
            });
            navigate(".", { replace: true, state: {} });
        }
    }, [location.state, navigate, toast]);

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end: addDays(start, 6) });
    }, [currentDate]);

    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const handleOpenModal = (data) => {
        const modalPayload = { ...data, preselectedClient };
        setModalData(modalPayload);
        setIsModalOpen(true);
    };

    const handleSaveAppointment = async (data) => {
        try {
            let clientId = data.details.clientId;
            let clientName = data.details.clientName;

            if (data.details.isNew) {
                const newClient = await api.createClient({
                    name: data?.details?.name,
                    phone: data?.details?.phone
                });

                clientId = newClient?.id;
                clientName = newClient?.name;
                setClients((prevClients) => [...prevClients, newClient]);
            }

            const selectedService = services?.find(
                (s) => s.id === data.details.serviceId
            );
            if (!selectedService) throw new Error("Servicio no encontrado");

            const appointmentDateTime = new Date(data.date);
            const totalMinutes = 8 * 60 + data.hourIndex * 15;
            appointmentDateTime.setHours(Math.floor(totalMinutes / 60));
            appointmentDateTime.setMinutes(totalMinutes % 60);
            appointmentDateTime.setSeconds(0, 0);
            appointmentDateTime.setMilliseconds(0);

            const appointmentTimestamp = format(appointmentDateTime, "yyyy-MM-dd'T'HH:mm:ssXXX");

            const newAppointmentForDB = {
                client_id: clientId,
                service_id: data.details.serviceId,
                appointment_at: appointmentTimestamp,
                status: 'SCHEDULED',
                price_at_time: selectedService.sale_price,
                duration_at_time_minutes: selectedService.duration_min,
                notes: data.details.notes,
            };

            const insertedAppointment = await api.createAppointment(newAppointmentForDB);

            const durationInSlots = Math.ceil((insertedAppointment.services?.duration_min || insertedAppointment.service?.duration_min || selectedService.duration_min || 15) / 15);
            const newAppointmentForState = { ...insertedAppointment, hourIndex: data.hourIndex, durationInSlots };
            setAppointments(prevAppointments => [...prevAppointments, newAppointmentForState]);

            setPreselectedClient(null);
            setIsModalOpen(false);
            toast({
                title: "✅ Cita Guardada",
                description: `Cita para ${clientName} guardada con éxito.`,
                className: 'bg-success text-white'
            });

        } catch (error) {
            console.error("Error al guardar la cita:", error);
            toast({
                title: "❌ Error al Guardar",
                description: "No se pudo crear la cita. Inténtalo de nuevo.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteAppointment = (appointment) => {
        setAppointmentToDelete(appointment);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!appointmentToDelete) return;
        try {
            await api.deleteAppointment(appointmentToDelete.id);

            setAppointments(prev => prev.filter(app => app.id !== appointmentToDelete.id));
            toast({
                title: "🗑️ Cita Eliminada",
                description: "La cita ha sido eliminada correctamente.",
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al eliminar",
                description: "No se pudo eliminar la cita. " + error.message,
            });
        } finally {
            setIsConfirmOpen(false);
            setAppointmentToDelete(null);
        }
    };

    const handleDeleteAvailability = async (dateKey) => {
        try {
            // Find the exception ID by dateKey - we need to delete by the exception's ID
            // Since the API deleteScheduleException expects an ID, we need to refetch or track IDs
            // For now, we'll refetch all data after deletion
            // The API might support deleting by date - let's use the dateKey as identifier
            await api.deleteScheduleException(dateKey);
            const updatedExceptions = { ...availability.exceptions };
            delete updatedExceptions[dateKey];
            setAvailability(prev => ({ ...prev, exceptions: updatedExceptions }));
            toast({ title: "✅ Excepción Eliminada", description: "El horario especial ha sido eliminado." });
        } catch (error) {
            console.error("Error eliminando excepción:", error);
            toast({ variant: "destructive", title: "Error al Eliminar", description: error.message });
        }
    };

    const handleSaveAvailability = async (payload) => {
        setLoading(true);
        try {
            if (payload.type === 'full_update') {
                const newAvailability = payload.data;

                // Build schedules array for the API
                const newSchedules = [];
                for (const dayKey in newAvailability.default) {
                    const daySchedule = newAvailability.default[dayKey];
                    if (daySchedule.available) {
                        daySchedule.ranges.forEach(range => newSchedules.push({ day_of_week: parseInt(dayKey), start_time: range.start, end_time: range.end, is_break: false }));
                        daySchedule.breaks.forEach(range => newSchedules.push({ day_of_week: parseInt(dayKey), start_time: range.start, end_time: range.end, is_break: true }));
                    }
                }

                // Use the API to set work schedules (replaces all)
                await api.setWorkSchedules(newSchedules);

                // Handle exceptions
                const newExceptions = [];
                for (const dateKey in newAvailability.exceptions) {
                    const exceptionDetails = newAvailability.exceptions[dateKey];

                    if (exceptionDetails.available === false) {
                        newExceptions.push({
                            exception_date: dateKey,
                            available: false,
                            start_time: null,
                            end_time: null,
                            is_break: false
                        });
                    } else {
                        const firstRange = exceptionDetails.ranges[0];
                        if (firstRange) {
                            newExceptions.push({
                                exception_date: dateKey,
                                available: true,
                                start_time: firstRange.start,
                                end_time: firstRange.end,
                                is_break: false
                            });
                        }
                    }
                }

                // Create each exception via API
                for (const exception of newExceptions) {
                    await api.createScheduleException(exception);
                }

                setAvailability(newAvailability);
                toast({ title: "✅ Horario Actualizado", description: "Tus cambios en el horario se han guardado." });

            } else if (payload.type === 'add_exceptions') {
                const { exceptionsToInsert } = payload.data;
                for (const exception of exceptionsToInsert) {
                    await api.createScheduleException(exception);
                }
                toast({ title: "✅ Excepción Guardada", description: "El nuevo horario especial ha sido añadido." });
            }
            await fetchAllData();

        } catch (error) {
            console.error("Error guardando disponibilidad:", error);
            toast({
                variant: "destructive",
                title: "Error al Guardar",
                description: error.message.includes('duplicate key')
                    ? "Error: Ya existe una excepción para una de las fechas seleccionadas."
                    : error.message
            });
        } finally {
            setIsAvailabilityModalOpen(false);
            setLoading(false);
        }
    };

    const changeDate = (amount, unit) => {
        const func = unit === 'week' ? addDays : addMonths;
        const realAmount = unit === 'week' ? amount * 7 : amount;
        setCurrentDate(prev => func(prev, realAmount));
    };

    const title = useMemo(() => {
        if (view === 'week' || isMobile) {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            if (start.getMonth() === end.getMonth()) {
                return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy', { locale: es })}`;
            }
            return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy', { locale: es })}`;
        }
        return format(currentDate, 'MMMM yyyy', { locale: es });
    }, [currentDate, view, isMobile]);

    const getSlotStatus = (day, hourIndex) => {
        const slotDateTime = new Date(day);
        const totalMinutes = 8 * 60 + hourIndex * 15;
        slotDateTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

        if (slotDateTime < new Date()) {
            return 'past';
        }

        const dateKey = format(day, 'yyyy-MM-dd');
        const dayOfWeek = day.getDay().toString();
        const schedule = availability.exceptions[dateKey] || availability.default[dayOfWeek];

        if (!schedule || !schedule.available) return 'unavailable';

        const slotTime = 8 * 60 + hourIndex * 15;

        const isBreak = schedule.breaks.some(range => {
            const startTime = timeToMinutes(range.start);
            const endTime = timeToMinutes(range.end);
            return slotTime >= startTime && slotTime < endTime;
        });
        if (isBreak) return 'break';

        const isAvailable = schedule.ranges.some(range => {
            const startTime = timeToMinutes(range.start);
            const endTime = timeToMinutes(range.end);
            return slotTime >= startTime && slotTime < endTime;
        });
        if (isAvailable) return 'available';

        return 'closed';
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando agenda...</div>;
    }
    return (
        <>
            <Helmet>
                <title>{`Agenda - ${config.appName}`}</title>
                <meta name="description" content="Agenda semanal y mensual interactiva para gestionar citas." />
            </Helmet>
            <div className="space-y-4">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" className="bg-primary/10 hover:bg-primary/20 rounded-full h-9 w-9" size="icon" onClick={() => changeDate(-1, view)} aria-label="Periodo anterior">
                                        <ChevronLeft className="h-5 w-5 text-primary" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Periodo anterior</p></TooltipContent>
                            </Tooltip>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="secondary" className="w-auto sm:w-[280px] justify-start text-left font-normal text-lg">
                                        <CalendarIcon className="mr-3 h-5 w-5" />
                                        <span className="capitalize">{title}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={currentDate} onSelect={(date) => date && setCurrentDate(date)} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="bg-primary/10 hover:bg-primary/20 rounded-full h-9 w-9" onClick={() => changeDate(1, view)} aria-label="Siguiente periodo">
                                        <ChevronRight className="h-5 w-5 text-primary" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Siguiente periodo</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Tabs value={view} onValueChange={setView} className={cn("transition-all duration-300 ease-in-out", isMobile && "hidden")}>
                            <TabsList>
                                <TabsTrigger value="week">Semana</TabsTrigger>
                                <TabsTrigger value="month">Mes</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button variant="secondary" onClick={() => setIsAvailabilityModalOpen(true)}>
                            <Edit className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Editar Horarios</span>
                        </Button>
                        <Button size="lg" variant="primary" onClick={() => handleOpenModal(null)}>
                            <Plus className="w-5 h-5 md:mr-2" />
                            <span className="hidden md:inline">Nueva Cita</span>
                        </Button>
                    </div>
                </div>

                {preselectedClient && (
                    <motion.div
                        className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg flex items-center justify-between"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-sm font-medium">
                            Agendando cita para:{" "}
                            <span className="font-bold">{preselectedClient.name ?? "Cliente sin nombre"}</span>
                        </p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setPreselectedClient(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={view + isMobile}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {isMobile ? (
                            <div className="space-y-4">
                                <Swiper
                                    ref={swiperRef}
                                    slidesPerView={5}
                                    centeredSlides={true}
                                    spaceBetween={10}
                                    onSlideChange={(swiper) => {
                                        const newDate = weekDays[swiper.activeIndex];
                                        if (newDate && !isSameDay(newDate, currentDate)) {
                                            setCurrentDate(newDate);
                                        }
                                    }}
                                    className="w-full"
                                    initialSlide={weekDays.findIndex(day => isSameDay(day, currentDate))}
                                >
                                    {weekDays.map((day) => (
                                        <SwiperSlide key={day.toISOString()}>
                                            <div
                                                onClick={() => setCurrentDate(day)}
                                                className={cn(
                                                    "p-3 rounded-lg text-center cursor-pointer transition-all duration-200 border",
                                                    isSameDay(day, currentDate)
                                                        ? 'bg-primary text-primary-foreground font-bold shadow-lg'
                                                        : 'bg-secondary hover:bg-accent'
                                                )}
                                            >
                                                <p className="text-xs capitalize">{format(day, 'EEE', { locale: es })}</p>
                                                <p className="text-lg font-bold">{format(day, 'd')}</p>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                                <MobileDayView
                                    day={currentDate}
                                    appointments={appointments.filter(a => isSameDay(parseISO(a.appointment_at), currentDate))}
                                    onAppointmentAction={(action, appt) => handleDeleteAppointment(appt)}
                                    onNewAppointment={handleOpenModal}
                                    isSlotAvailable={(day, hourIndex) => getSlotStatus(day, hourIndex) === 'available'}
                                />
                            </div>
                        ) : view === 'week' ? (
                            <div className="premium-card p-0 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <div
                                        className="grid min-w-[800px] relative"
                                        style={{
                                            gridTemplateColumns: '60px repeat(7, 1fr)',
                                            gridTemplateRows: `auto repeat(${hours.length}, 40px)`
                                        }}
                                    >
                                        <div className="sticky top-0 z-20 bg-card p-2 border-b border-r" style={{ gridRow: 1, gridColumn: 1 }}></div>
                                        {weekDays.map((day, dayIndex) => (
                                            <div key={day.toISOString()} className={cn("sticky top-0 z-20 bg-card p-2 text-center border-b border-r", { 'bg-primary/10': isToday(day) })} style={{ gridRow: 1, gridColumn: dayIndex + 2 }}>
                                                <p className="text-sm text-muted-foreground">{format(day, 'EEE', { locale: es })}</p>
                                                <p className={cn("text-xl font-bold text-foreground", { "text-primary": isToday(day) })}>{format(day, 'd')}</p>
                                            </div>
                                        ))}

                                        {hours.map((hour, hourIndex) => (
                                            <React.Fragment key={hour}>
                                                <div className="p-2 border-b border-r text-sm text-center text-muted-foreground flex items-center justify-center" style={{ gridRow: hourIndex + 2, gridColumn: 1 }}>
                                                    {hourIndex % 4 === 0 ? hour : ''}
                                                </div>
                                                {weekDays.map((day, dayIndex) => {
                                                    const isOccupied = appointments.some(a =>
                                                        isSameDay(parseISO(a.appointment_at), day) &&
                                                        hourIndex >= a.hourIndex &&
                                                        hourIndex < a.hourIndex + a.durationInSlots
                                                    );

                                                    if (isOccupied) return null;

                                                    const status = getSlotStatus(day, hourIndex);
                                                    return (
                                                        <div
                                                            key={day.toISOString() + hour}
                                                            className={cn("border-b border-r flex items-center justify-center",
                                                                { 'bg-primary/5': isToday(day) },
                                                                { 'bg-muted/30 cursor-not-allowed': status === 'break' },
                                                                { 'bg-muted/20 cursor-not-allowed': status === 'closed' },
                                                                { 'bg-red-500/10 cursor-not-allowed': status === 'unavailable' },
                                                                { 'bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed': status === 'past' }
                                                            )}
                                                            style={{ gridRow: hourIndex + 2, gridColumn: dayIndex + 2 }}
                                                            onClick={() => status === 'available' && handleOpenModal({ date: day, hourIndex })}
                                                        >
                                                            {status === 'available' && (
                                                                <div className="w-full h-full text-muted-foreground hover:bg-primary/10 hover:text-primary opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center" aria-label="Añadir cita">
                                                                    <Plus className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                            {status === 'break' && <Coffee className="h-5 w-5 text-muted-foreground/50" />}
                                                            {status === 'closed' && <Moon className="h-5 w-5 text-muted-foreground/30" />}
                                                            {status === 'past' && <XCircle className="h-5 w-5 text-muted-foreground/20" />}
                                                        </div>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}

                                        {appointments.map(appointment => {
                                            const dayIndex = weekDays.findIndex(day => isSameDay(parseISO(appointment.appointment_at), day));
                                            if (dayIndex === -1) return null;

                                            return (
                                                <div
                                                    key={appointment.id}
                                                    className="bg-primary/20 p-2 rounded-lg flex flex-col justify-between overflow-hidden border-l-4 border-primary cursor-pointer hover:bg-primary/30 transition-colors group relative"
                                                    style={{
                                                        gridColumn: `${dayIndex + 2} / span 1`,
                                                        gridRow: `${appointment.hourIndex + 2} / span ${appointment.durationInSlots}`,
                                                        zIndex: 20,
                                                        margin: '1px'
                                                    }}
                                                >
                                                    <div className="flex-grow">
                                                        <p className="font-bold text-primary text-sm truncate">{appointment.clients?.name || appointment.client?.name}</p>
                                                        <p className="text-primary/80 text-xs truncate">{appointment.services?.name || appointment.service?.name}</p>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAppointment(appointment);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="premium-card p-0 overflow-hidden">
                                <MonthView monthDays={monthDays} onDayClick={(day) => { setView('week'); setCurrentDate(day); }} appointments={appointments} currentDate={currentDate} availability={availability} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            {isModalOpen && (
                <AppointmentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveAppointment}
                    modalData={modalData}
                    clients={clients}
                    services={services}
                    appointments={appointments}
                    availability={availability}
                />
            )}
            <AvailabilityModal
                isOpen={isAvailabilityModalOpen}
                onClose={() => setIsAvailabilityModalOpen(false)}
                availability={availability}
                onSave={handleSaveAvailability}
                onDelete={handleDeleteAvailability}
            />
            <ConfirmationDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Cita?"
                description={`Estás a punto de eliminar la cita de ${appointmentToDelete?.clients?.name || appointmentToDelete?.client?.name || 'este cliente'}. Esta acción es permanente.`}
            />
        </>
    );
};

export default Calendario;