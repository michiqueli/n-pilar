// En: src/pages/public/PublicBookingPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, startOfMonth, endOfMonth, isToday, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import PublicBookingModal from '@/components/public/PublicBookingModal';
import api from '@/lib/api';
import config from '@/config';

const hours = Array.from({ length: 57 }, (_, i) => { const totalMinutes = 8 * 60 + i * 15; const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0'); const m = (totalMinutes % 60).toString().padStart(2, '0'); return `${h}:${m}`; });
const timeToMinutes = (time) => { if (!time || typeof time !== 'string') return 0; const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes; };


const PublicBookingPage = () => {
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);
    const [availability, setAvailability] = useState({ default: {}, exceptions: {} });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const fetchPublicData = async () => {
        setLoading(true);
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        try {
            const [appointmentsData, servicesData, schedulesData, exceptionsData] = await Promise.all([
                api.getAppointments(monthStart.toISOString(), monthEnd.toISOString()),
                api.getActiveServices(),
                api.getWorkSchedules(),
                api.getScheduleExceptions()
            ]);

            const appointmentsWithIndex = (appointmentsData || [])
                .filter(a => ['SCHEDULED', 'COMPLETED', 'PAID'].includes(a.status))
                .map(appointment => {
                    const appointmentDate = parseISO(appointment.appointment_at);
                    const hour = appointmentDate.getHours();
                    const minute = appointmentDate.getMinutes();
                    const hourIndex = (hour - 8) * 4 + Math.floor(minute / 15);
                    const duration = appointment.duration_at_time_minutes || 15;
                    const durationInSlots = Math.ceil(duration / 15);
                    return { ...appointment, hourIndex, durationInSlots };
                });
            setAppointments(appointmentsWithIndex);
            setServices((servicesData || []).map(s => ({ id: s.id, name: s.name, duration_min: s.duration_min, sale_price: s.sale_price })));

            const formattedAvailability = { default: { '0': { available: false, ranges: [], breaks: [] }, '1': { available: false, ranges: [], breaks: [] }, '2': { available: false, ranges: [], breaks: [] }, '3': { available: false, ranges: [], breaks: [] }, '4': { available: false, ranges: [], breaks: [] }, '5': { available: false, ranges: [], breaks: [] }, '6': { available: false, ranges: [], breaks: [] }, }, exceptions: {} };
            (schedulesData || []).forEach(s => { const dayKey = s.day_of_week.toString(); formattedAvailability.default[dayKey].available = true; if (s.is_break) { formattedAvailability.default[dayKey].breaks.push({ start: s.start_time, end: s.end_time }); } else { formattedAvailability.default[dayKey].ranges.push({ start: s.start_time, end: s.end_time }); } });
            (exceptionsData || []).forEach(e => { const dateKey = e.exception_date; if (!formattedAvailability.exceptions[dateKey]) { formattedAvailability.exceptions[dateKey] = { available: e.available, ranges: [], breaks: [] }; } if (e.available) { if (e.is_break) { formattedAvailability.exceptions[dateKey].breaks.push({ start: e.start_time, end: e.end_time }); } else { formattedAvailability.exceptions[dateKey].ranges.push({ start: e.start_time, end: e.end_time }); } } });
            setAvailability(formattedAvailability);
        } catch (error) {
            console.error("Error cargando datos públicos de la agenda:", error);
            toast({ title: "Error de Carga", description: "No se pudo cargar la disponibilidad.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPublicData(); }, [currentDate]);
    const weekDaysInterval = useMemo(() => { const start = startOfWeek(currentDate, { weekStartsOn: 1 }); return eachDayOfInterval({ start, end: addDays(start, 6) }); }, [currentDate]);
    const handleOpenModal = (data) => { setModalData(data); setIsModalOpen(true); };
    const handleSaveAppointment = async (newAppointmentDetails) => { toast({ title: "✅ ¡Cita Confirmada!", description: "Tu cita ha sido agendada. ¡Gracias por reservar!", className: 'bg-success text-white' }); fetchPublicData(); };
    const changeWeek = (amount) => { setCurrentDate(prev => addDays(prev, amount * 7)); };
    const title = useMemo(() => { const start = startOfWeek(currentDate, { weekStartsOn: 1 }); const end = endOfWeek(currentDate, { weekStartsOn: 1 }); return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy', { locale: es })}`; }, [currentDate]);
    const getSlotStatus = (day, hourIndex) => { const slotDateTime = new Date(day); const totalMinutes = 8 * 60 + hourIndex * 15; slotDateTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0); if (slotDateTime < new Date()) return 'past'; const dateKey = format(day, 'yyyy-MM-dd'); const dayOfWeek = day.getDay().toString(); const schedule = availability.exceptions[dateKey] || availability.default[dayOfWeek]; if (!schedule || !schedule.available) return 'unavailable'; const slotTime = 8 * 60 + hourIndex * 15; const isBreak = schedule.breaks.some(range => { const startTime = timeToMinutes(range.start); const endTime = timeToMinutes(range.end); return slotTime >= startTime && slotTime < endTime; }); if (isBreak) return 'break'; const isAvailable = schedule.ranges.some(range => { const startTime = timeToMinutes(range.start); const endTime = timeToMinutes(range.end); return slotTime >= startTime && slotTime < endTime; }); if (isAvailable) return 'available'; return 'closed'; };

    if (loading) { return <div className="flex justify-center items-center h-screen">Cargando disponibilidad...</div>; }

    return (
        <>
            <Helmet> <title>{`Reservar Cita - ${config.appName}`}</title> <meta name="description" content="Selecciona un horario disponible para reservar tu cita en nuestra peluquería." /> </Helmet>
            <div className="container mx-auto p-4 space-y-4">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div> <h1 className="text-3xl font-bold text-foreground">Reservar una Cita</h1> <p className="text-muted-foreground mt-1">Elige un horario disponible en nuestra agenda.</p> </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" className="bg-primary/10 hover:bg-primary/20 rounded-full h-9 w-9" size="icon" onClick={() => changeWeek(-1)} aria-label="Semana anterior"><ChevronLeft className="h-5 w-5 text-primary" /></Button>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="secondary" className="w-auto sm:w-[280px] justify-start text-left font-normal text-lg"><CalendarIcon className="mr-3 h-5 w-5" /><span className="capitalize">{title}</span></Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={currentDate} onSelect={(date) => date && setCurrentDate(date)} initialFocus /></PopoverContent>
                            </Popover>
                            <Button variant="ghost" size="icon" className="bg-primary/10 hover:bg-primary/20 rounded-full h-9 w-9" onClick={() => changeWeek(1)} aria-label="Siguiente semana"><ChevronRight className="h-5 w-5 text-primary" /></Button>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={currentDate.toISOString()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        <div className="premium-card p-0 overflow-hidden">
                            <div className="overflow-x-auto">
                                <div className="grid min-w-[800px] relative" style={{ gridTemplateColumns: '60px repeat(7, 1fr)', gridTemplateRows: `auto repeat(${hours.length}, 40px)` }}>
                                    <div className="sticky top-0 z-20 bg-card p-2 border-b border-r" style={{ gridRow: 1, gridColumn: 1 }}></div>
                                    {weekDaysInterval.map((day, dayIndex) => ( <div key={day.toISOString()} className={cn("sticky top-0 z-20 bg-card p-2 text-center border-b border-r", { 'bg-primary/10': isToday(day) })} style={{ gridRow: 1, gridColumn: dayIndex + 2 }}> <p className="text-sm text-muted-foreground">{format(day, 'EEE', { locale: es })}</p> <p className={cn("text-xl font-bold text-foreground", { "text-primary": isToday(day) })}>{format(day, 'd')}</p> </div> ))}

                                    {hours.map((hour, hourIndex) => (
                                        <React.Fragment key={hour}>
                                            <div className="p-2 border-b border-r text-sm text-center text-muted-foreground flex items-center justify-center" style={{ gridRow: hourIndex + 2, gridColumn: 1 }}>{hourIndex % 4 === 0 ? hour : ''}</div>
                                            {weekDaysInterval.map((day, dayIndex) => {
                                                const isOccupied = appointments.some(a => isSameDay(parseISO(a.appointment_at), day) && hourIndex >= a.hourIndex && hourIndex < a.hourIndex + a.durationInSlots);
                                                if (isOccupied) return null;
                                                const status = getSlotStatus(day, hourIndex);
                                                return (
                                                    <div
                                                        key={day.toISOString() + hour}
                                                        className={cn("border-b border-r flex items-center justify-center transition-colors",
                                                            // --- CORRECCIÓN: Aplicamos los nuevos colores ---
                                                            { 'bg-green-500/10 cursor-pointer': status === 'available' },
                                                            { 'bg-red-500/5 cursor-not-allowed': ['break', 'closed', 'unavailable', 'past'].includes(status) }
                                                        )}
                                                        style={{ gridRow: hourIndex + 2, gridColumn: dayIndex + 2 }}
                                                        onClick={() => status === 'available' && handleOpenModal({ date: day, hourIndex })}
                                                    >
                                                        {status === 'available' && (
                                                            <div className="w-full h-full text-green-700 hover:bg-green-500/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center" aria-label="Reservar cita">
                                                                <Plus className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}

                                    {appointments.map((appointment, index) => {
                                        const dayIndex = weekDaysInterval.findIndex(day => isSameDay(parseISO(appointment.appointment_at), day));
                                        if (dayIndex === -1) return null;
                                        return (
                                            <div
                                                key={`appt-${index}`}
                                                // --- CORRECCIÓN: Aplicamos el nuevo color de "Ocupado" ---
                                                className="bg-destructive/10 p-2 rounded-lg flex items-center justify-center overflow-hidden border border-destructive/20"
                                                style={{ gridColumn: `${dayIndex + 2} / span 1`, gridRow: `${appointment.hourIndex + 2} / span ${appointment.durationInSlots}`, zIndex: 10, margin: '1px' }}
                                            >
                                                <p className="font-semibold text-destructive/80 text-sm">Ocupado</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {isModalOpen && ( <PublicBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAppointment} modalData={modalData} services={services} /> )}
        </>
    );
};

export default PublicBookingPage;