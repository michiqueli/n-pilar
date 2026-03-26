import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, parseISO, format, subMonths, differenceInDays, subDays, eachDayOfInterval, getDay, startOfDay } from 'date-fns';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
    BarChart2,
    PieChart,
    TrendingUp,
    Download,
    Wallet
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import DayFilterDropdown from '@/components/analytics/DayFilterDropdown';
import PeriodPicker from '@/components/analytics/PeriodPicker';
import SummaryTab from '@/components/analytics/SummaryTab';
import ServicesTab from '@/components/analytics/ServicesTab';
import HistoricTab from '@/components/analytics/HistoricTab';
import FinancialDashboard from '@/pages/FinancialDashboard';
import api from '@/lib/api';
import config from '@/config';

dayjs.locale('es');

const Analitica = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('resumen');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [appointmentsData, setAppointmentsData] = useState([]);
    const [paymentsData, setPaymentsData] = useState([]);
    const [currentMonthPayments, setCurrentMonthPayments] = useState([]);
    const [prevPeriodPayments, setPrevPeriodPayments] = useState([]);
    const [prevPeriodAppointments, setPrevPeriodAppointments] = useState([]);
    const [prevMonthAppointments, setPrevMonthAppointments] = useState([]);
    const [prevPrevMonthAppointments, setPrevPrevMonthAppointments] = useState([]);
    const [historicalAppointments, setHistoricalAppointments] = useState([]);
    const [heatmapAppointments, setHeatmapAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [dateRange, setDateRange] = useState({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            if (!dateRange || !dateRange.from || !dateRange.to) return;
            setLoading(true);
            setError(null);
            try {
                const daysInPeriod = differenceInDays(dateRange.to, dateRange.from) + 1;
                const prevPeriodStart = subDays(dateRange.from, daysInPeriod);
                const prevPeriodEnd = subDays(dateRange.to, daysInPeriod);
                const prevMonthStart = startOfMonth(subMonths(dateRange.from, 1));
                const prevMonthEnd = endOfMonth(subMonths(dateRange.from, 1));
                const prevPrevMonthStart = startOfMonth(subMonths(dateRange.from, 2));
                const prevPrevMonthEnd = endOfMonth(subMonths(dateRange.from, 2));
                const sixMonthsAgo = startOfMonth(subMonths(new Date(), 6));
                const currentMonthStart = startOfMonth(new Date());
                const currentMonthEnd = endOfMonth(new Date());
                const ninetyDaysAgo = startOfDay(subDays(new Date(), 90));

                const [
                    currentPeriodData,
                    currentPaymentsData,
                    currentMonthPaymentsData,
                    prevPeriodPaymentsData,
                    prevPeriodAppointmentsData,
                    prevMonthData,
                    prevPrevMonthData,
                    historicalData,
                    heatmapData
                ] = await Promise.all([
                    api.getAppointments(dateRange.from.toISOString(), dateRange.to.toISOString()),
                    api.getPayments(dateRange.from.toISOString(), dateRange.to.toISOString()),
                    api.getPayments(currentMonthStart.toISOString(), currentMonthEnd.toISOString()),
                    api.getPayments(prevPeriodStart.toISOString(), prevPeriodEnd.toISOString()),
                    api.getAppointments(prevPeriodStart.toISOString(), prevPeriodEnd.toISOString()),
                    api.getAppointments(prevMonthStart.toISOString(), prevMonthEnd.toISOString()),
                    api.getAppointments(prevPrevMonthStart.toISOString(), prevPrevMonthEnd.toISOString()),
                    api.getAppointments(sixMonthsAgo.toISOString(), new Date().toISOString()),
                    api.getAppointments(ninetyDaysAgo.toISOString(), new Date().toISOString())
                ]);

                // Filter completed/paid appointments client-side since the API returns all statuses
                const filterCompleted = (data) => (data || []).filter(a => ['COMPLETED', 'PAID'].includes(a.status));

                setAppointmentsData(filterCompleted(currentPeriodData));
                setPaymentsData(currentPaymentsData || []);
                setCurrentMonthPayments(currentMonthPaymentsData || []);
                setPrevPeriodPayments(prevPeriodPaymentsData || []);
                setPrevPeriodAppointments(filterCompleted(prevPeriodAppointmentsData));
                setPrevMonthAppointments(filterCompleted(prevMonthData));
                setPrevPrevMonthAppointments(filterCompleted(prevPrevMonthData));
                setHistoricalAppointments(filterCompleted(historicalData));
                setHeatmapAppointments(filterCompleted(heatmapData));

            } catch (err) {
                console.error("Error fetching analytics data:", err);
                setError("No se pudieron cargar los datos de análisis.");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalyticsData();
    }, [dateRange]);

    const quickSelectOptions = [
        { label: 'Mes Actual', value: 'this_month' },
        { label: 'Mes Anterior', value: 'last_month' },
        { label: 'Año Actual', value: 'this_year' },
        { label: 'Año Anterior', value: 'last_year' },
        { label: 'Últimos 12 Meses', value: 'last_12_months' },
    ];
    const handleQuickSelect = (period) => {
        let newRange = { from: null, to: null };
        const today = dayjs();

        switch (period) {
            case 'this_month':
                newRange = { from: today.startOf('month').toDate(), to: today.endOf('month').toDate() };
                break;
            case 'last_month':
                const lastMonth = today.subtract(1, 'month');
                newRange = { from: lastMonth.startOf('month').toDate(), to: lastMonth.endOf('month').toDate() };
                break;
            case 'this_year':
                newRange = { from: today.startOf('year').toDate(), to: today.endOf('year').toDate() };
                break;
            case 'last_year':
                const lastYear = today.subtract(1, 'year');
                newRange = { from: lastYear.startOf('year').toDate(), to: lastYear.endOf('year').toDate() };
                break;
            case 'last_12_months':
                newRange = { from: today.subtract(11, 'month').startOf('month').toDate(), to: today.endOf('month').toDate() };
                break;
            default:
                break;
        }
        setDateRange(newRange);
    };


    const analyticsData = useMemo(() => {
        if (!appointmentsData || !paymentsData) return {};

        const periodTotalRevenue = paymentsData.reduce((acc, payment) => acc + (payment.amount || 0), 0);
        const currentMonthTotalRevenue = currentMonthPayments.reduce((acc, payment) => acc + (payment.amount || 0), 0);
        const prevPeriodTotalRevenue = prevPeriodPayments.reduce((acc, payment) => acc + (payment.amount || 0), 0);

        const totalAppointments = appointmentsData.length;
        const averageTicket = totalAppointments > 0 ? periodTotalRevenue / totalAppointments : 0;
        const newClients = appointmentsData.filter(a => {
            const client = a.clients || a.client;
            return client && client.total_visits <= 1;
        }).length;

        const prevTotalAppointments = prevPeriodAppointments.length;
        const prevAverageTicket = prevTotalAppointments > 0 ? prevPeriodTotalRevenue / prevTotalAppointments : 0;

        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };
        const revenueChange = calculateChange(periodTotalRevenue, prevPeriodTotalRevenue);
        const avgTicketChange = calculateChange(averageTicket, prevAverageTicket);

        const calculateRetention = (current, previous) => {
            if (previous.length === 0) return 0;
            const prevClientIds = new Set(previous.map(a => a.client_id));
            const currentClientIds = new Set(current.map(a => a.client_id));
            let retainedCount = 0;
            prevClientIds.forEach(id => {
                if (currentClientIds.has(id)) retainedCount++;
            });
            return (retainedCount / prevClientIds.size) * 100;
        };
        const retentionRate = calculateRetention(appointmentsData, prevMonthAppointments);
        const prevRetentionRate = calculateRetention(prevMonthAppointments, prevPrevMonthAppointments);
        const retentionChange = retentionRate - prevRetentionRate;

        const servicesMap = new Map();
        const clientsMap = new Map();
        const dailyMap = new Map();
        const occupancyMap = new Map();

        const processService = (service, amount, isAppointment) => {
            if (!service) return;
            if (!servicesMap.has(service.name)) {
                servicesMap.set(service.name, { revenue: 0, appointments: 0, manual_sales: 0, cost_per_service: service.service_cost || 0 });
            }
            const currentService = servicesMap.get(service.name);
            currentService.revenue += amount || 0;
            if (isAppointment) {
                currentService.appointments += 1;
            } else {
                currentService.manual_sales += 1;
            }
        };

        appointmentsData.forEach(app => {
            const service = app.services || app.service;
            const client = app.clients || app.client;
            processService(service, app.price_at_time, true);

            if (app.client_id && client) {
                if (!clientsMap.has(app.client_id)) clientsMap.set(app.client_id, { name: client?.name, visits: 0, spent: 0 });
                const currentClient = clientsMap.get(app.client_id);
                currentClient.visits += 1;
                currentClient.spent += app.price_at_time || 0;
            }

            const date = format(parseISO(app.appointment_at), 'yyyy-MM-dd');
            if (!dailyMap.has(date)) dailyMap.set(date, { revenue: 0, appointments: 0 });
            const currentDay = dailyMap.get(date);
            currentDay.revenue += app.price_at_time || 0;
            currentDay.appointments += 1;
        });

        paymentsData.forEach(payment => {
            if (!payment.appointment_id) {
                const service = payment.services || payment.service;
                processService(service, payment.amount, false);
            }
        });

        const services = Array.from(servicesMap, ([name, data]) => ({ name, ...data, total_sales: data.appointments + data.manual_sales })).sort((a, b) => b.revenue - a.revenue);
        const topClients = Array.from(clientsMap.values()).sort((a, b) => b.spent - a.spent).slice(0, 5).map(client => ({ ...client, avatar: client?.name.substring(0, 2).toUpperCase() }));
        const dailyData = Array.from(dailyMap, ([date, data]) => ({ date, day: format(parseISO(date), 'dd'), ...data })).sort((a, b) => a.date.localeCompare(b.date));

        const serviceProfitData = services.map(s => {
            const totalCosts = s.cost_per_service * s.total_sales;
            const margin = s.revenue > 0 ? ((s.revenue - totalCosts) / s.revenue) * 100 : 0;
            return { name: s.name, revenue: s.revenue, appointments: s.total_sales, costs: totalCosts, margin };
        });

        // --- LÓGICA DE MAPA DE CALOR CORREGIDA Y MEJORADA ---
        const weekDayMap = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };
        const dayOccurrences = { 'Dom': 0, 'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0, 'Sáb': 0 };
        const ninetyDaysAgo = subDays(new Date(), 90);
        eachDayOfInterval({ start: ninetyDaysAgo, end: new Date() }).forEach(day => {
            dayOccurrences[weekDayMap[getDay(day)]]++;
        });

        heatmapAppointments.forEach(app => {
            const appDate = parseISO(app.appointment_at);
            const dayOfWeek = weekDayMap[getDay(appDate)];
            const hour = format(appDate, 'HH:00');
            const key = `${dayOfWeek}-${hour}`;
            if (!occupancyMap.has(key)) {
                occupancyMap.set(key, { count: 0 });
            }
            occupancyMap.get(key).count += 1;
        });

        const occupancyData = Array.from(occupancyMap, ([key, value]) => {
            const [day, hour] = key.split('-');
            const totalPossibleSlots = dayOccurrences[day] || 1; // Evitar división por cero
            return {
                day,
                hour,
                occupancy: value.count / totalPossibleSlots,
                appointments: value.count
            };
        });

        const benchmarkData = {
            user: { revenue: periodTotalRevenue, retention: retentionRate, avgTicket: averageTicket },
            industry: { revenue: 18000, retention: 65, avgTicket: 50 },
        };

        const monthlyRevenue = {};
        historicalAppointments.forEach(app => {
            const monthName = dayjs(app.appointment_at).format('MMM');
            monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + app.price_at_time;
        });
        const historicalData = Object.keys(monthlyRevenue).map(name => ({ name, revenue: monthlyRevenue[name] }));

        return {
            periodTotalRevenue, currentMonthTotalRevenue, totalAppointments, averageTicket, newClients,
            retentionRate, revenueChange, avgTicketChange, retentionChange,
            services, topClients, dailyData, benchmarkData, historicalData,
            serviceProfitData, occupancyData
        };
    }, [appointmentsData, paymentsData, currentMonthPayments, prevPeriodPayments, prevPeriodAppointments, prevMonthAppointments, prevPrevMonthAppointments, historicalAppointments, dateRange]);

    if (loading) return <div>Cargando...</div>
    if (error) return <div>Error: {error}</div>

    return (
        <>
            <Helmet>
                <title>{`Analisis - ${config.appName}`}</title>
                <meta name="description" content="Análisis financiero y estadísticas de rendimiento de tu negocio." />
            </Helmet>

            <div className="space-y-6">
                <motion.div
                    className="flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-foreground">Análisis del Negocio</h1>
                        <p className="text-muted-foreground mt-1">Tus insights para tomar decisiones inteligentes.</p>
                    </div>
                    {activeTab !== 'caja' && (
                        <>
                            <div className="grid grid-col-1 items-center lg:justify-end lg:items-end gap-2 w-1/2 justify-center lg:grid-cols-[0.5fr_0.5fr]">
                                <DayFilterDropdown selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
                                <PeriodPicker dateRange={dateRange} setDateRange={setDateRange} varianr='primary'/>
                            </div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                                <p className="text-sm font-medium text-muted-foreground mr-2">Atajos:</p>
                                {quickSelectOptions.map(opt => (
                                    <Button
                                        key={opt.value}
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => handleQuickSelect(opt.value)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                        <TabsTrigger value="resumen"><BarChart2 className="w-4 h-4 mr-2" />Resumen</TabsTrigger>
                        <TabsTrigger value="servicios"><PieChart className="w-4 h-4 mr-2" />Servicios</TabsTrigger>
                        <TabsTrigger value="historico"><TrendingUp className="w-4 h-4 mr-2" />Tendencias</TabsTrigger>
                        <TabsTrigger value="caja"><Wallet className="w-4 h-4 mr-2" />Caja/Finanzas</TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        {activeTab === 'resumen' && (
                            <SummaryTab
                                analyticsData={analyticsData}
                                dateRange={dateRange}
                                selectedDays={selectedDays}
                            />
                        )}
                        {activeTab === 'servicios' && <ServicesTab analyticsData={analyticsData} />}
                        {activeTab === 'historico' && <HistoricTab analyticsData={analyticsData} />}
                        {activeTab === 'caja' && <FinancialDashboard />}
                    </div>
                </Tabs>
            </div>
        </>
    );
};

export default Analitica;