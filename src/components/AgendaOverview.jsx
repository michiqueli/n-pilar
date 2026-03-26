import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, AlertCircle, Sparkles, DollarSign, Repeat, Scissors } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { startOfDay, endOfDay, getDay } from 'date-fns';
import { api } from '@/lib/api';

const AgendaOverview = () => {
    const { toast } = useToast();
    const [agendaData, setAgendaData] = useState({
        totalAppointments: 0,
        freeTime: '0h 0m', // <-- Cambiado a string
        cancelledToday: 0,
        newClients: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverviewData = async () => {
            const todayStart = startOfDay(new Date()).toISOString();
            const todayEnd = endOfDay(new Date()).toISOString();
            const todayDayOfWeek = getDay(new Date());

            try {
                const [allAppointments, allSchedules] = await Promise.all([
                    api.getAppointments(todayStart, todayEnd),
                    api.getWorkSchedules(),
                ]);

                const todaysAppointments = allAppointments || [];
                const todaysSchedules = (allSchedules || []).filter(s => s.day_of_week === todayDayOfWeek);

                const totalAppointments = todaysAppointments.filter(a => a.status !== 'CANCELLED').length;
                const cancelledToday = todaysAppointments.filter(a => a.status === 'CANCELLED').length;
                const newClients = todaysAppointments
                    .filter(a => a.status !== 'CANCELLED' && a.clients && a.clients.total_visits <= 1)
                    .length;

                // --- CORRECCIÓN: Lógica para formatear el tiempo libre ---
                const timeToMinutes = (time) => {
                    if (!time) return 0;
                    const [hours, minutes] = time.split(':').map(Number);
                    return hours * 60 + minutes;
                };

                const totalWorkMinutes = todaysSchedules
                    .filter(s => !s.is_break)
                    .reduce((sum, range) => sum + (timeToMinutes(range.end_time) - timeToMinutes(range.start_time)), 0);
                
                const bookedMinutes = todaysAppointments
                    .filter(a => a.status !== 'CANCELLED')
                    .reduce((sum, a) => sum + a.duration_at_time_minutes, 0);

                const freeMinutes = Math.max(0, totalWorkMinutes - bookedMinutes);
                
                const hours = Math.floor(freeMinutes / 60);
                const minutes = freeMinutes % 60;
                const formattedFreeTime = `${hours}h ${minutes}m`;

                setAgendaData({
                    totalAppointments,
                    freeTime: formattedFreeTime, // <-- Se guarda el string formateado
                    cancelledToday,
                    newClients,
                });

            } catch (error) {
                console.error("Error fetching agenda overview:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOverviewData();
    }, []);

    const cards = [
        {
            title: 'Citas del Día',
            value: agendaData.totalAppointments,
            subtitle: 'cortes programados',
            icon: Calendar,
            color: 'primary'
        },
        {
            title: 'Huecos Libres',
            value: agendaData.freeTime, // <-- Se usa el string formateado
            subtitle: 'espacios disponibles',
            icon: Users,
            color: 'success'
        },
        {
            title: 'Cancelaciones',
            value: agendaData.cancelledToday,
            subtitle: 'canceladas hoy',
            icon: AlertCircle,
            color: 'error'
        },
        {
            title: 'Clientes Nuevos',
            value: agendaData.newClients,
            subtitle: 'primera visita',
            icon: Sparkles,
            color: 'secondary'
        }
    ];

    const getCardStyles = (color) => {
        return "premium-card p-4 transition-all duration-300 cursor-pointer hover:border-primary/30";
    };

    const getIconColor = (color) => {
        const colors = {
            primary: 'text-primary',
            secondary: 'text-secondary-foreground',
            success: 'text-success',
            error: 'text-destructive'
        };
        return colors[color] || 'text-primary';
    };

    const handleCardClick = (card) => {
        toast({
            title: `📊 ${card.title}`,
            description: `${card.value} ${card.subtitle}`,
        });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array(4).fill(0).map((_, index) => (
                    <div key={index} className="premium-card p-4 h-28 bg-muted animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <motion.div
                        key={index}
                        className={getCardStyles(card.color)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        onClick={() => handleCardClick(card)}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {card.title}
                            </h3>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-accent`}>
                                <Icon className={`w-4 h-4 ${getIconColor(card.color)}`} />
                            </div>
                        </div>
                        
                        <div className="text-left">
                            <p className={`text-2xl font-bold tracking-tight text-foreground`}>
                                {card.value}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {card.subtitle}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default AgendaOverview;