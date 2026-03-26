import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import PeriodPicker from '../analytics/PeriodPicker';
import dayjs from 'dayjs';

const expenseCategories = ['Productos', 'Alquiler', 'Suministros', 'Marketing', 'Salarios', 'Mantenimiento', 'Otros'];
const paymentMethods = ['Todos', 'Efectivo', 'Tarjeta', 'Transferencia', 'Otro'];

const FilterBar = ({ onApplyFilters, onClearFilters }) => {
    const [dateRange, setDateRange] = useState({
        from: dayjs().startOf('month').toDate(),
        to: dayjs().endOf('month').toDate(),
    });

    const [type, setType] = useState('Todos');
    const [category, setCategory] = useState('Todos');
    const [paymentMethod, setPaymentMethod] = useState('Todos');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [incomeServices, setIncomeServices] = useState([]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const data = await api.getActiveServices();
                const serviceNames = data.map(s => s.name);
                setIncomeServices(serviceNames);
            } catch (error) {
                console.error("Failed to load services", error);
            }
        };
        fetchServices();
    }, []);

    const categories = useMemo(() => {
        if (type === 'income') return ['Todos', ...incomeServices];
        if (type === 'expense') return ['Todos', ...expenseCategories];
        return ['Todos', ...new Set([...incomeServices, ...expenseCategories])];
    }, [type, incomeServices]);

    useEffect(() => {
        setCategory('Todos');
    }, [type]);

    const quickSelectOptions = [
        { label: 'Mes Actual', value: 'this_month' },
        { label: 'Mes Anterior', value: 'last_month' },
        { label: 'Año Actual', value: 'this_year' },
        { label: 'Año Anterior', value: 'last_year' },
        { label: 'Últimos 12 Meses', value: 'last_12_months' },
    ];

    useEffect(() => {
        const handler = setTimeout(() => {
            onApplyFilters({
                dateRange,
                type: type === 'Todos' ? null : type,
                category: category === 'Todos' ? null : category,
                paymentMethod: paymentMethod === 'Todos' ? null : paymentMethod,
                minAmount: minAmount ? parseFloat(minAmount) : null,
                maxAmount: maxAmount ? parseFloat(maxAmount) : null,
            });
        }, 500);
        return () => {
            clearTimeout(handler);
        };
    }, [dateRange, type, category, paymentMethod, minAmount, maxAmount, onApplyFilters]);

    const handleClear = () => {
        setDateRange({ from: subMonths(new Date(), 1), to: new Date() });
        setType('Todos');
        setCategory('Todos');
        setPaymentMethod('Todos');
        setMinAmount('');
        setMaxAmount('');
        onClearFilters();
    };

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

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-4 rounded-lg bg-card border mb-6"
        >
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-[1.5fr_1.5fr] xl:grid-cols-[1.75fr_1.25fr_1.25fr_1.25fr_1.25fr] gap-4 items-end">
                <div >
                    <Label>Rango de Fechas</Label>
                    <PeriodPicker dateRange={dateRange} setDateRange={setDateRange}
                    /></div>
                <div>
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Todos">Todos</SelectItem>
                            <SelectItem value="income">Ingresos</SelectItem>
                            <SelectItem value="expense">Gastos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Categoría</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div >
                    <Label>Método de Pago</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {paymentMethods.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label>Monto Mín.</Label>
                        <Input type="number" placeholder="$" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label>Monto Máx.</Label>
                        <Input type="number" placeholder="$" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="mt-1" />
                    </div>
                </div>
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
            <div className="flex justify-end mt-4 pt-4 border-t">
                <Button variant="ghost" onClick={handleClear}>
                    <X className="w-4 h-4 mr-2" />
                    Limpiar Filtros
                </Button>
            </div>
            
        </motion.div>
    );
};

export default FilterBar;