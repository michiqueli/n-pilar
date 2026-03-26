import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y } from 'swiper/modules';
import { motion } from 'framer-motion';
import { User, MessageSquare, Receipt, Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PaymentModal from '@/components/payments/PaymentModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO, startOfDay, endOfDay, addMinutes } from 'date-fns';
import { api } from '@/lib/api';
import 'swiper/css';
import 'swiper/css/navigation';

const ClientCard = ({ title, appointment, onRegisterPayment, onWhatsApp, onViewProfile }) => {
    if (!appointment) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-card rounded-xl border">
                <Info className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="font-bold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">No hay cliente</p>
            </div>
        );
    }

    const { clients: client, services: service, appointment_at, status } = appointment;
    const isPaid = status === 'PAID';

    return (
        <motion.div
            className="h-full flex flex-col justify-between p-6 bg-card rounded-xl border shadow-sm"
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
            transition={{ duration: 0.2 }}
        >
            <div>
                <p className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
                <h3 className="text-2xl font-bold text-foreground truncate">{client?.name}</h3>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Clock className="w-4 h-4" />
                    <p className="font-medium">{format(parseISO(appointment_at), 'HH:mm')} - {service?.name}</p>
                </div>
            </div>
            <div className="mt-6 flex flex-col xl:flex-row gap-2">
                <Button onClick={() => onViewProfile(client.id)} variant="secondary" size="sm" className="flex-1">
                    <User className="w-4 h-4 mr-2" /> Ficha
                </Button>
                <Button onClick={() => onWhatsApp(client)} variant="secondary" size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex-1">
                            <Button
                                onClick={() => onRegisterPayment(appointment)}
                                variant="primary"
                                size="sm"
                                className="w-full"
                                disabled={isPaid}
                            >
                                <Receipt className="w-4 h-4 mr-2" />
                                {isPaid ? 'Cobrado' : 'Cobrar'}
                            </Button>
                        </div>
                    </TooltipTrigger>
                    {isPaid && (
                        <TooltipContent>
                            <p>Esta cita ya ha sido cobrada.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </div>
        </motion.div>
    );
};

const ClientCarousel = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    useEffect(() => {
        const fetchTodaysAppointments = async () => {
            setLoading(true);
            const todayStart = startOfDay(new Date()).toISOString();
            const todayEnd = endOfDay(new Date()).toISOString();

            try {
                const data = await api.getAppointments(todayStart, todayEnd);
                setAppointments(data || []);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error al cargar citas",
                    description: "No se pudieron obtener las citas de hoy."
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTodaysAppointments();
    }, [toast]);

    // --- LÓGICA CORREGIDA PARA DETERMINAR PASADO, ACTUAL Y PRÓXIMO ---
    const { past, current, next } = useMemo(() => {
        const now = new Date();

        // Encontrar el índice de la cita que está ocurriendo ahora
        const currentIndex = appointments.findIndex(a => {
            const start = parseISO(a.appointment_at);
            const end = addMinutes(start, a.duration_at_time_minutes);
            return now >= start && now <= end;
        });

        let pastAppt = null;
        let currentAppt = null;
        let nextAppt = null;

        if (currentIndex !== -1) {
            // Si hay una cita en progreso
            currentAppt = appointments[currentIndex];
            pastAppt = appointments[currentIndex - 1] || null; // La anterior en el array
            nextAppt = appointments[currentIndex + 1] || null; // La siguiente en el array
        } else {
            // Si NO hay una cita en progreso, buscamos la última que terminó y la próxima que empieza
            const completed = appointments.filter(a => addMinutes(parseISO(a.appointment_at), a.duration_at_time_minutes) < now);
            const pending = appointments.filter(a => parseISO(a.appointment_at) > now);

            pastAppt = completed.length > 0 ? completed[completed.length - 1] : null; // La última del array de completadas
            nextAppt = pending.length > 0 ? pending[0] : null; // La primera del array de pendientes
        }

        return {
            past: pastAppt,
            current: currentAppt,
            next: nextAppt,
        };
    }, [appointments]);

    const handleRegisterPayment = (appointment) => {
        setSelectedAppointment(appointment);
        setPaymentModalOpen(true);
    };

    const handleSavePayment = async (paymentData) => {
        try {
            await api.createPayment({
                appointment_id: selectedAppointment.id,
                client_id: selectedAppointment.clients.id,
                amount: paymentData.amount,
                method: paymentData.paymentMethod,
                status: 'COMPLETED',
                notes: paymentData.notes,
                payment_at: new Date().toISOString(),
            });

            await api.updateAppointment(selectedAppointment.id, { status: 'PAID' });

            setAppointments(prev => prev.map(app =>
                app.id === selectedAppointment.id ? { ...app, status: 'PAID' } : app
            ));

            setPaymentModalOpen(false);
            toast({
                title: '✅ Pago Registrado',
                description: `El pago de ${selectedAppointment.clients?.name} se ha guardado con éxito.`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al registrar el pago",
                description: error.message,
            });
        }
    };

    const handleWhatsApp = (client) => {
        if (client && client?.phone) {
            const cleanPhoneNumber = client?.phone.replace(/[^0-9]/g, '');
            const message = encodeURIComponent(`Hola ${client?.name}, un saludo desde Skin Hair Studio PILAR!`);
            window.open(`https://wa.me/${cleanPhoneNumber}?text=${message}`, '_blank');
        } else {
            toast({
                title: '⚠️ Sin número de teléfono',
                description: 'Este cliente no tiene un número de WhatsApp guardado.',
                variant: 'destructive'
            });
        }
    };

    const handleViewProfile = (clientId) => {
        navigate(`/clientes/${clientId}`);
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="relative">
            <Swiper
                modules={[Navigation, A11y]}
                spaceBetween={20}
                slidesPerView={1}
                navigation={{
                    nextEl: '.swiper-button-next-custom',
                    prevEl: '.swiper-button-prev-custom',
                }}
                breakpoints={{
                    768: { slidesPerView: 2 },
                    1280: { slidesPerView: 3 },
                }}
                className="!pb-2"
            >
                <SwiperSlide>
                    <ClientCard title="Pasado" appointment={past} onRegisterPayment={handleRegisterPayment} onWhatsApp={handleWhatsApp} onViewProfile={handleViewProfile} />
                </SwiperSlide>
                <SwiperSlide>
                    <ClientCard title="Actual" appointment={current} onRegisterPayment={handleRegisterPayment} onWhatsApp={handleWhatsApp} onViewProfile={handleViewProfile} />
                </SwiperSlide>
                <SwiperSlide>
                    <ClientCard title="Próximo" appointment={next} onRegisterPayment={handleRegisterPayment} onWhatsApp={handleWhatsApp} onViewProfile={handleViewProfile} />
                </SwiperSlide>
            </Swiper>

            <button className="swiper-button-prev-custom absolute top-1/2 -translate-y-1/2 -left-4 z-10 w-10 h-10 rounded-full bg-card border flex items-center justify-center text-foreground hover:bg-accent transition-transform duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="swiper-button-next-custom absolute top-1/2 -translate-y-1/2 -right-4 z-10 w-10 h-10 rounded-full bg-card border flex items-center justify-center text-foreground hover:bg-accent transition-transform duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronRight className="w-6 h-6" />
            </button>

            {selectedAppointment && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    onSave={handleSavePayment}
                    isManual={false}
                    prefillData={{
                        client: selectedAppointment?.clients ?? null,
                        service: selectedAppointment?.services?.name ?? null,
                        amount: selectedAppointment?.price_at_time ?? null,
                    }}
                />
            )}
        </div>
    );
};

export default ClientCarousel;