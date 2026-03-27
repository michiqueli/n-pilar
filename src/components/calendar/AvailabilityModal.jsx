import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, Trash2 } from 'lucide-react';

const weekDays = [
    { key: '1', label: 'Lunes' },
    { key: '2', label: 'Martes' },
    { key: '3', label: 'Miércoles' },
    { key: '4', label: 'Jueves' },
    { key: '5', label: 'Viernes' },
    { key: '6', label: 'Sábado' },
    { key: '0', label: 'Domingo' },
];

const TimeRangeRow = ({ range, onTimeChange, onRemove }) => (
    <div className="flex items-center gap-2 mt-1">
        <Input type="time" step="900" value={range.start} onChange={(e) => onTimeChange('start', e.target.value)} className="w-full" />
        <span>-</span>
        <Input type="time" step="900" value={range.end} onChange={(e) => onTimeChange('end', e.target.value)} className="w-full" />
        <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
    </div>
);

const AvailabilityModal = ({ isOpen, onClose, availability, onSave, onDelete }) => {
    const { toast } = useToast();
    const [defaultHours, setDefaultHours] = useState({});
    const [exceptions, setExceptions] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tab, setTab] = useState('default');
    const [exceptionType, setExceptionType] = useState('single');
    const [singleDate, setSingleDate] = useState(null);
    const [customTimeDate, setCustomTimeDate] = useState(null);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [times, setTimes] = useState({ start: '09:00', end: '13:00' });
    const [localSchedule, setLocalSchedule] = useState(availability);

    useEffect(() => {
        if (isOpen) {
            setDefaultHours(JSON.parse(JSON.stringify(availability.default)));
            setExceptions(JSON.parse(JSON.stringify(availability.exceptions)));
        }
    }, [availability, isOpen]);

    const handleDefaultHoursChange = (day, field, value, rangeType, rangeIndex) => {
        setDefaultHours(prev => {
            const newDayConfig = { ...prev[day] };
            if (field === 'available') {
                newDayConfig.available = value;
            } else {
                newDayConfig[rangeType][rangeIndex][field] = value;
            }
            return { ...prev, [day]: newDayConfig };
        });
    };

    const addDefaultRange = (day, rangeType) => {
        setDefaultHours(prev => {
            const newDayConfig = { ...prev[day] };
            const newRange = rangeType === 'breaks' ? { start: '13:00', end: '14:00' } : { start: '15:00', end: '20:00' };
            newDayConfig[rangeType].push(newRange);
            return { ...prev, [day]: newDayConfig };
        });
    };

    const removeDefaultRange = (day, rangeType, rangeIndex) => {
        setDefaultHours(prev => {
            const newDayConfig = { ...prev[day] };
            newDayConfig[rangeType].splice(rangeIndex, 1);
            return { ...prev, [day]: newDayConfig };
        });
    };

    const handleDeleteException = (dateKeyToDelete) => {
        setLocalSchedule(prevSchedule => {
            const newExceptions = { ...prevSchedule.exceptions };
            if (newExceptions[dateKeyToDelete]) {
                delete newExceptions[dateKeyToDelete];
                onDelete(dateKeyToDelete);
            }
            return {
                ...prevSchedule,
                exceptions: newExceptions
            };
        });
    };



    const handlePrepareAndSave = () => {
        if (tab === 'default') {
            onSave({
                type: 'full_update',
                data: { ...localSchedule, default: defaultHours }
            });
            return;
        }
        if (tab === 'exceptions') {
            let exceptionsToInsert = [];
            switch (exceptionType) {
                case 'single':
                    if (!singleDate) {
                        alert("Error: Debes seleccionar una fecha.");
                        return;
                    }
                    exceptionsToInsert.push({
                        exception_date: format(singleDate, 'yyyy-MM-dd'),
                        available: false,
                        start_time: null,
                        end_time: null,
                        is_break: false
                    });
                    break;
                case 'range':
                    if (!dateRange || !dateRange.from || !dateRange.to) {
                        alert("Error: Debes seleccionar un rango de fechas válido.");
                        return;
                    }
                    const daysInRange = eachDayOfInterval({
                        start: dateRange.from,
                        end: dateRange.to
                    });

                    exceptionsToInsert = daysInRange.map(day => ({
                        exception_date: format(day, 'yyyy-MM-dd'),
                        available: false,
                        start_time: null,
                        end_time: null,
                        is_break: false
                    }));
                    break;
                case 'customTime':
                    if (!customTimeDate) {
                        alert("Error: Debes seleccionar una fecha.");
                        return;
                    }
                    if (times.end <= times.start) {
                        alert("Error: La hora de fin debe ser posterior a la hora de inicio.");
                        return;
                    }
                    exceptionsToInsert.push({
                        exception_date: format(customTimeDate, 'yyyy-MM-dd'),
                        available: true,
                        start_time: times.start,
                        end_time: times.end,
                        is_break: false
                    });
                    break;

                default:
                    console.error("Tipo de excepción no reconocido:", exceptionType);
                    return;
            }
            if (exceptionsToInsert.length === 0) {
                alert("No hay nada que guardar. Por favor, completa la información.");
                return;
            }
            onSave({
                type: 'add_exceptions',
                data: { exceptionsToInsert }
            });
        }
    };


    const sortedExceptions = useMemo(() => {
        return Object.keys(exceptions).sort((a, b) => new Date(a) - new Date(b));
    }, [exceptions]);


    const dateKeyForSelected = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl top-12 left-[5%] md:left-[10%] lg:left-[20%] xl:left-[30%] " style={{ maxWidth: '50rem' }}>
                <DialogHeader>
                    <DialogTitle>Editar Horarios de Disponibilidad</DialogTitle>
                    <DialogDescription>
                        Define tu horario de trabajo estándar, añade descansos y gestiona excepciones para días específicos.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={tab} onValueChange={setTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
                        <TabsTrigger value="default">Horario Predeterminado</TabsTrigger>
                        <TabsTrigger value="exceptions">Excepciones por Día</TabsTrigger>
                    </TabsList>

                    <TabsContent value="default" className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {weekDays.map(({ key, label }) => {
                            const dayConfig = defaultHours[key];
                            if (!dayConfig) return null;

                            return (
                                <div key={key} className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                        <span className="font-semibold w-full sm:w-28 mb-2 sm:mb-0">{label}</span>
                                        <div className="flex items-center gap-4">
                                            <Label htmlFor={`switch-${key}`} className="text-sm">Disponible</Label>
                                            <Switch
                                                id={`switch-${key}`}
                                                checked={dayConfig.available}
                                                onCheckedChange={(checked) => handleDefaultHoursChange(key, 'available', checked)}
                                                aria-label={`Disponibilidad para ${label}`}
                                            />
                                        </div>
                                    </div>
                                    {dayConfig.available && (
                                        <div className="mt-4 pl-0 sm:pl-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Horarios de Trabajo</Label>
                                                {dayConfig.ranges.map((range, index) => (
                                                    <TimeRangeRow
                                                        key={`range-${index}`}
                                                        range={range}
                                                        onTimeChange={(field, value) => handleDefaultHoursChange(key, field, value, 'ranges', index)}
                                                        onRemove={() => removeDefaultRange(key, 'ranges', index)}
                                                    />
                                                ))}
                                                <Button variant="link" size="sm" onClick={() => addDefaultRange(key, 'ranges')} className="p-0 h-auto">
                                                    <PlusCircle className="w-4 h-4 mr-1" /> Agregar Horario
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Descansos</Label>
                                                {dayConfig.breaks.map((range, index) => (
                                                    <TimeRangeRow
                                                        key={`break-${index}`}
                                                        range={range}
                                                        onTimeChange={(field, value) => handleDefaultHoursChange(key, field, value, 'breaks', index)}
                                                        onRemove={() => removeDefaultRange(key, 'breaks', index)}
                                                    />
                                                ))}
                                                <Button variant="link" size="sm" onClick={() => addDefaultRange(key, 'breaks')} className="p-0 h-auto">
                                                    <PlusCircle className="w-4 h-4 mr-1" /> Agregar Descanso
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </TabsContent>

                    <TabsContent value="exceptions" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-center content-center w-full">
                        <Tabs value={exceptionType} onValueChange={setExceptionType}>
                            <TabsList className="grid w-full grid-cols-1">
                                <TabsTrigger value="single">Día Completo</TabsTrigger>
                                <TabsTrigger value="range">Rango de Fechas</TabsTrigger>
                                <TabsTrigger value="customTime">Horario Específico</TabsTrigger>
                            </TabsList>
                            <div className="mt-4">
                                <TabsContent value='single' className="mt-4 justify-center flex">
                                    {/* --- CASO 1: DÍA ÚNICO --- */}
                                    {exceptionType === 'single' && (
                                        <div className="flex justify-center flex-col items-center border border-solid rounded-md">
                                            <p className='border-b-2'>Selecciona el día que quieres marcar como no laborable.</p>
                                            <Calendar
                                                mode="single"
                                                selected={singleDate}
                                                onSelect={setSingleDate}
                                            />
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value='range' className="mt-4">
                                    {/* --- CASO 2: RANGO DE FECHAS --- */}
                                    {exceptionType === 'range' && (
                                        <div className="flex justify-center flex-col items-center border border-solid rounded-md">
                                            <p className='border-b-2'>Selecciona el rango de fechas que quieres marcar como no laborables.</p>
                                            <Calendar
                                                mode="range"
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                            />
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value='customTime' className="mt-4">
                                    {/* --- CASO 3: HORARIO ESPECÍFICO --- */}
                                    {exceptionType === 'customTime' && (
                                        <div className="space-y-4 flex justify-center flex-col items-center border border-solid rounded-md">
                                            <p className='border-b-2'>Selecciona una fecha y define un horario de trabajo especial.</p>
                                            <Calendar
                                                mode="single"
                                                selected={customTimeDate}
                                                onSelect={setCustomTimeDate}
                                            />
                                            <div className="flex gap-4">
                                                <div>
                                                    <Label htmlFor="start_time">Hora de Inicio</Label>
                                                    <Input
                                                        id="start_time"
                                                        type="time"
                                                        value={times.start}
                                                        onChange={(e) => setTimes(prev => ({ ...prev, start: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="end_time">Hora de Fin</Label>
                                                    <Input
                                                        id="end_time"
                                                        type="time"
                                                        value={times.end}
                                                        onChange={(e) => setTimes(prev => ({ ...prev, end: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Excepciones Activas</h3>
                            <div className=" max-h-96 overflow-y-scroll space-y-2 border rounded-lg p-2 bg-muted/50">
                                {sortedExceptions.length > 0 ? (
                                    sortedExceptions.map(dateKey => {
                                        const exceptionDetails = localSchedule.exceptions[dateKey];
                                        if (!exceptionDetails) {
                                            return null;
                                        }
                                        const dateObject = parseISO(dateKey);
                                        return (
                                            <div key={dateKey} className="flex items-center justify-between p-2 pl-3 bg-card rounded-md shadow-sm">
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {/* Usamos PPP para un formato amigable como "12 de sep. de 2025" */}
                                                        {format(dateObject, 'PPP', { locale: es })}
                                                    </p>
                                                    {/* Lógica para mostrar el tipo de excepción */}
                                                    {!exceptionDetails.available ? (
                                                        <p className="text-xs font-medium text-destructive">Día Completo (No Laborable)</p>
                                                    ) : (
                                                        <p className="text-xs font-medium text-sky-600">
                                                            Horario Especial: {exceptionDetails.ranges[0]?.start} - {exceptionDetails.ranges[0]?.end}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* El botón ahora llama a la nueva función con el dateKey */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDeleteException(dateKey)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive/70 hover:text-destructive" />
                                                </Button>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center p-4">No hay excepciones configuradas.</p>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handlePrepareAndSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AvailabilityModal;