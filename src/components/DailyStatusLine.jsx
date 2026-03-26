import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, AlertTriangle } from 'lucide-react';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '@/lib/api';

const DailyStatusLine = () => {
    const [todaysAppointments, setTodaysAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTodaysData = async () => {
            const todayStart = startOfDay(new Date()).toISOString();
            const todayEnd = endOfDay(new Date()).toISOString();

            try {
                const data = await api.getAppointments(todayStart, todayEnd);
                setTodaysAppointments(data || []);
            } catch (error) {
                console.error("Error fetching today's appointments:", error);
                // No mostramos un toast aquí para no ser intrusivos en el dashboard
            } finally {
                setLoading(false);
            }
        };

        fetchTodaysData();
    }, []);

    const dailyStats = useMemo(() => {
        const now = new Date();
        
        const upcomingAppointments = todaysAppointments.filter(
            a => parseISO(a.appointment_at) > now && a.status !== 'CANCELLED'
        );
        
        const cancellations = todaysAppointments.filter(
            a => a.status === 'CANCELLED'
        ).length;

        const nextAppointment = upcomingAppointments[0];
        
        return {
            nextClientName: nextAppointment?.clients?.name || null,
            nextClientTime: nextAppointment ? format(parseISO(nextAppointment.appointment_at), 'HH:mm') : null,
            totalAppointments: todaysAppointments.filter(a => a.status !== 'CANCELLED').length,
            cancellations: cancellations,
        };
    }, [todaysAppointments]);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                Cargando estado del día...
            </div>
        );
    }

    // Lógica para elegir qué mensaje mostrar
    let statusMessage;
    if (dailyStats.cancellations > 0) {
        statusMessage = `Ojo: Tienes ${dailyStats.cancellations} cancelación para hoy.`;
    } else if (dailyStats.nextClientName) {
        statusMessage = `Tu próximo cliente es ${dailyStats.nextClientName} a las ${dailyStats.nextClientTime}hs. Hoy tienes ${dailyStats.totalAppointments} turnos.`;
    } else if (dailyStats.totalAppointments > 0) {
        statusMessage = `¡Buen trabajo! Ya completaste los ${dailyStats.totalAppointments} turnos de hoy.`;
    } else {
        statusMessage = "No tienes citas programadas para hoy. ¡Un buen día para planificar!";
    }

    const Icon = dailyStats.cancellations > 0 ? AlertTriangle : Sun;

    return (
        <motion.div
            className="flex items-center justify-center gap-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Icon className={`w-4 h-4 ${dailyStats.cancellations > 0 ? 'text-warning' : 'text-primary'}`} />
            <p className="font-medium">{statusMessage}</p>
        </motion.div>
    );
};

export default DailyStatusLine;