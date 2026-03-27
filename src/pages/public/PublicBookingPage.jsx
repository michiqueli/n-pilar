import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { format, addDays, startOfDay, endOfMonth, startOfMonth, isToday, isSameDay, parseISO, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import PublicBookingModal from '@/components/public/PublicBookingModal';
import BusinessLogo from '@/components/BusinessLogo';
import api from '@/lib/api';
import config from '@/config';

const timeToMinutes = (time) => {
    if (!time || typeof time !== 'string') return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

const PublicBookingPage = () => {
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);
    const [availability, setAvailability] = useState({ default: {}, exceptions: {} });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchPublicData = async () => {
        setLoading(true);
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        try {
            const [appointmentsData, servicesData, schedulesData, exceptionsData] = await Promise.all([
                api.getAppointments(monthStart.toISOString(), monthEnd.toISOString()),
                api.getActiveServices(),
                api.getWorkSchedules(),
                api.getScheduleExceptions()
            ]);

            setAppointments(
                (appointmentsData || [])
                    .filter(a => ['SCHEDULED', 'COMPLETED', 'PAID'].includes(a.status))
                    .map(a => ({
                        ...a,
                        startMin: (() => { const d = parseISO(a.appointment_at); return d.getHours() * 60 + d.getMinutes(); })(),
                        duration: a.duration_at_time_minutes || 15,
                    }))
            );
            setServices((servicesData || []).map(s => ({ id: s.id, name: s.name, duration_min: s.duration_min, sale_price: s.sale_price })));

            const formatted = { default: {}, exceptions: {} };
            for (let i = 0; i < 7; i++) formatted.default[i.toString()] = { available: false, ranges: [], breaks: [] };
            (schedulesData || []).forEach(s => {
                const key = s.day_of_week.toString();
                formatted.default[key].available = true;
                if (s.is_break) formatted.default[key].breaks.push({ start: s.start_time, end: s.end_time });
                else formatted.default[key].ranges.push({ start: s.start_time, end: s.end_time });
            });
            (exceptionsData || []).forEach(e => {
                const key = e.exception_date;
                if (!formatted.exceptions[key]) formatted.exceptions[key] = { available: e.available, ranges: [], breaks: [] };
                if (e.available) {
                    if (e.is_break) formatted.exceptions[key].breaks.push({ start: e.start_time, end: e.end_time });
                    else formatted.exceptions[key].ranges.push({ start: e.start_time, end: e.end_time });
                }
            });
            setAvailability(formatted);
        } catch (error) {
            toast({ title: "Error de Carga", description: "No se pudo cargar la disponibilidad.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPublicData(); }, [selectedDate]);

    const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId), [services, selectedServiceId]);

    // Días visibles: desktop 7 desde hoy, mobile 2 desde selectedDate
    const visibleDays = useMemo(() => {
        const today = startOfDay(new Date());
        const start = isMobile ? startOfDay(selectedDate) : today;
        const count = isMobile ? 2 : 7;
        return Array.from({ length: count }, (_, i) => addDays(start, i));
    }, [selectedDate, isMobile]);

    // Genera slots disponibles para un día, considerando duración del servicio
    const getAvailableSlots = (day) => {
        if (!selectedService) return [];
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayOfWeek = day.getDay().toString();
        const schedule = availability.exceptions[dateKey] || availability.default[dayOfWeek];
        if (!schedule || !schedule.available) return [];

        const duration = selectedService.duration_min;
        const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.appointment_at), day));
        const now = new Date();
        const slots = [];

        // Para cada rango de trabajo, generar slots de 15 min
        schedule.ranges.forEach(range => {
            const rangeStart = timeToMinutes(range.start);
            const rangeEnd = timeToMinutes(range.end);

            for (let slotStart = rangeStart; slotStart + duration <= rangeEnd; slotStart += 15) {
                const slotEnd = slotStart + duration;

                // Verificar que no sea pasado
                if (isToday(day)) {
                    const slotDateTime = new Date(day);
                    slotDateTime.setHours(Math.floor(slotStart / 60), slotStart % 60);
                    if (slotDateTime <= now) continue;
                }

                // Verificar que no esté en break
                const inBreak = schedule.breaks.some(b => {
                    const bStart = timeToMinutes(b.start);
                    const bEnd = timeToMinutes(b.end);
                    return slotStart < bEnd && slotEnd > bStart;
                });
                if (inBreak) continue;

                // Verificar que no se solape con citas existentes
                const overlaps = dayAppointments.some(a => {
                    const aEnd = a.startMin + a.duration;
                    return slotStart < aEnd && slotEnd > a.startMin;
                });
                if (overlaps) continue;

                slots.push({ startMin: slotStart, time: minutesToTime(slotStart), endTime: minutesToTime(slotEnd) });
            }
        });

        return slots;
    };

    const handleSlotClick = (day, slot) => {
        const hourIndex = (slot.startMin - 8 * 60) / 15;
        setModalData({ date: day, hourIndex });
        setIsModalOpen(true);
    };

    const handleSaveAppointment = async () => {
        toast({ title: "Cita Confirmada", description: "Tu cita ha sido agendada.", className: 'bg-success text-white' });
        fetchPublicData();
    };

    const navigateDays = (amount) => {
        setSelectedDate(prev => {
            const next = addDays(prev, amount);
            if (isBefore(next, startOfDay(new Date()))) return startOfDay(new Date());
            return next;
        });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando disponibilidad...</div>;
    }

    return (
        <>
            <Helmet>
                <title>{`Reservar Cita - ${config.appName}`}</title>
            </Helmet>
            <div className="container mx-auto p-4 space-y-6 max-w-4xl">
                {/* Branding */}
                <div className="flex flex-col items-center text-center">
                    <BusinessLogo size="lg" className="mb-2" />
                    <h1 className="text-2xl font-bold text-foreground">{config.appName}</h1>
                    {config.businessSubtitle && (
                        <p className="text-sm text-muted-foreground">{config.businessSubtitle}</p>
                    )}
                </div>

                {/* PASO 1: Elegir día */}
                <div className="premium-card p-4 md:p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">1</div>
                        <h2 className="text-lg font-semibold text-foreground">Elige el día</h2>
                    </div>
                    <div className="flex justify-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="secondary" className="text-base">
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span className="capitalize">{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* PASO 2: Elegir servicio */}
                <div className="premium-card p-4 md:p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">2</div>
                        <h2 className="text-lg font-semibold text-foreground">Elige el servicio</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {services.map(service => (
                            <button
                                key={service.id}
                                onClick={() => setSelectedServiceId(service.id)}
                                className={cn(
                                    "p-4 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between",
                                    selectedServiceId === service.id
                                        ? "bg-primary/10 ring-2 ring-primary/30"
                                        : "bg-muted/40 hover:bg-muted/70"
                                )}
                            >
                                <div>
                                    <p className="font-medium text-foreground">{service.name}</p>
                                    <p className="text-sm text-muted-foreground">{service.duration_min} min — ${service.sale_price}</p>
                                </div>
                                {selectedServiceId === service.id && (
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* PASO 3: Elegir horario */}
                {selectedService && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="premium-card p-4 md:p-6 space-y-4"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">3</div>
                            <h2 className="text-lg font-semibold text-foreground">Elige el horario</h2>
                            <span className="text-sm text-muted-foreground ml-auto">
                                {selectedService.name} — {selectedService.duration_min} min
                            </span>
                        </div>

                        {/* Navegación de días (mobile) */}
                        {isMobile && (
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigateDays(-2)}
                                    disabled={isSameDay(selectedDate, startOfDay(new Date()))}
                                    className="rounded-full"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <span className="text-sm font-medium text-muted-foreground capitalize">
                                    {format(visibleDays[0], "d MMM", { locale: es })} — {format(visibleDays[visibleDays.length - 1], "d MMM", { locale: es })}
                                </span>
                                <Button variant="ghost" size="icon" onClick={() => navigateDays(2)} className="rounded-full">
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        )}

                        {/* Grilla de horarios por día */}
                        <div className={cn(
                            "grid gap-4",
                            isMobile ? "grid-cols-2" : "grid-cols-7"
                        )}>
                            {visibleDays.map(day => {
                                const slots = getAvailableSlots(day);
                                const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                                return (
                                    <div key={day.toISOString()} className="space-y-2">
                                        <div className={cn(
                                            "text-center p-2 rounded-lg",
                                            isToday(day) ? "bg-primary/10" : "bg-muted/50"
                                        )}>
                                            <p className="text-xs text-muted-foreground capitalize">{format(day, 'EEE', { locale: es })}</p>
                                            <p className={cn("text-lg font-bold", isToday(day) ? "text-primary" : "text-foreground")}>
                                                {format(day, 'd')}
                                            </p>
                                        </div>
                                        <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                            {isPast ? (
                                                <p className="text-xs text-muted-foreground text-center py-4">Pasado</p>
                                            ) : slots.length === 0 ? (
                                                <p className="text-xs text-muted-foreground text-center py-4">Sin disponibilidad</p>
                                            ) : (
                                                slots.map(slot => (
                                                    <button
                                                        key={slot.time}
                                                        onClick={() => handleSlotClick(day, slot)}
                                                        className="w-full text-center py-2 px-1 rounded-lg text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-primary/15 hover:text-primary active:bg-primary/25 transition-all cursor-pointer"
                                                    >
                                                        {slot.time}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Navegación desktop */}
                        {!isMobile && (
                            <p className="text-xs text-muted-foreground text-center">
                                Mostrando semana del {format(visibleDays[0], "d 'de' MMMM", { locale: es })} al {format(visibleDays[6], "d 'de' MMMM", { locale: es })}
                            </p>
                        )}
                    </motion.div>
                )}
            </div>

            {isModalOpen && (
                <PublicBookingModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveAppointment}
                    modalData={modalData}
                    services={services}
                    preselectedServiceId={selectedServiceId?.toString()}
                />
            )}
        </>
    );
};

export default PublicBookingPage;
