import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, UserPlus, Calendar as CalendarIcon, AlertTriangle, Clock } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addMinutes, parse, parseISO, startOfDay, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import TimePicker from '@/components/calendar/TimePicker';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';

const AppointmentModal = ({ isOpen, onClose, modalData, onSave, clients, services: initialServices, appointments, availability }) => {
    const { toast } = useToast();
    const [localServices, setLocalServices] = useState(initialServices || []);
    const [tab, setTab] = useState('existing');
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [endTime, setEndTime] = useState('');
    const [overlapWarning, setOverlapWarning] = useState(false);
    const [availabilityWarning, setAvailabilityWarning] = useState(false);
    const [notes, setNotes] = useState('');
    
    const [filteredClients, setFilteredClients] = useState([]);
    const [isClientListVisible, setIsClientListVisible] = useState(false);
    
    // --- CORRECCIÓN: Se eliminó el estado local `services` y su `useEffect` ---

    useEffect(() => { setLocalServices(initialServices || []); }, [initialServices]);

    const handleCreateService = async ({ name, price }) => {
        try {
            const newService = await api.createService({
                name,
                sale_price: price,
                duration_min: 30,
                category: 'Otro',
                active: true,
            });
            setLocalServices(prev => [...prev, newService]);
            setSelectedServiceId(newService.id.toString());
            toast({ title: "Servicio creado", description: `"${name}" fue agregado.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const resetForm = () => {
        setTab('existing');
        setClientSearch('');
        setSelectedClientId('');
        setNewClientName('');
        setNewClientPhone('');
        setSelectedServiceId('');
        setEndTime('');
        setOverlapWarning(false);
        setAvailabilityWarning(false);
        setIsClientListVisible(false);
        setNotes('');
    };

    useEffect(() => {
        if (isOpen) {
            const preselectedClient = modalData?.preselectedClient;
            
            if (preselectedClient) {
                setTab('existing');
                setSelectedClientId(preselectedClient.id);
                setClientSearch(preselectedClient.name);
                setIsClientListVisible(false);
            }

            if (modalData && modalData.date && modalData.hourIndex !== undefined) {
                setSelectedDate(modalData.date);
                const initialTime = addMinutes(new Date(modalData.date).setHours(8, 0, 0, 0), modalData.hourIndex * 15);
                setSelectedTime(format(initialTime, 'HH:mm'));
            } else {
                setSelectedDate(new Date());
                setSelectedTime('09:00');
            }
        } else {
            resetForm();
        }
    }, [modalData, isOpen]);
    
    useEffect(() => {
        if (clientSearch && !selectedClientId) {
            const results = clients.filter(c => 
                c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                (c.phone && c.phone.includes(clientSearch))
            );
            setFilteredClients(results);
            setIsClientListVisible(true);
        } else {
            setIsClientListVisible(false);
        }
    }, [clientSearch, clients, selectedClientId]);
    
    useEffect(() => {
        if (selectedServiceId && selectedTime && selectedDate && localServices && localServices.length > 0 && availability) {
            const service = localServices.find(s => s.id.toString() === selectedServiceId);
            if (service) {
                try {
                    const startTime = parse(selectedTime, 'HH:mm', selectedDate);
                    const newEndTime = addMinutes(startTime, service.duration_min);
                    setEndTime(format(newEndTime, 'HH:mm'));
                    
                    const appointmentStart = startTime.getTime();
                    const appointmentEnd = newEndTime.getTime();
                    
                    const isOverlap = appointments.some(appt => {
                        const existingStart = parseISO(appt.appointment_at).getTime();
                        const existingEnd = addMinutes(existingStart, appt.duration_at_time_minutes).getTime();
                        return (appointmentStart < existingEnd && appointmentEnd > existingStart);
                    });
                    setOverlapWarning(isOverlap);

                    const timeToMinutes = (time) => time ? (parseInt(time.slice(0, 2)) * 60 + parseInt(time.slice(3, 5))) : 0;
                    const dateKey = format(selectedDate, 'yyyy-MM-dd');
                    const dayOfWeek = getDay(selectedDate).toString();
                    const schedule = availability.exceptions[dateKey] ? { available: false } : availability.default[dayOfWeek];

                    let isAvailable = false;
                    if (schedule && schedule.available) {
                        const slotTimeInMinutes = timeToMinutes(selectedTime);
                        const isInWorkRange = schedule.ranges.some(range => {
                            const rangeStart = timeToMinutes(range.start);
                            const rangeEnd = timeToMinutes(range.end);
                            return slotTimeInMinutes >= rangeStart && slotTimeInMinutes < rangeEnd;
                        });
                        const isInBreakRange = schedule.breaks.some(range => {
                            const start = timeToMinutes(range.start);
                            const end = timeToMinutes(range.end);
                            return slotTimeInMinutes >= start && slotTimeInMinutes < end;
                        });
                        isAvailable = isInWorkRange && !isInBreakRange;
                    }
                    setAvailabilityWarning(!isAvailable);

                } catch (error) {
                    setEndTime('');
                }
            }
        } else {
            setEndTime('');
        }
    }, [selectedServiceId, selectedTime, selectedDate, localServices, appointments, availability]);

    const handleSave = (e) => {
        e.preventDefault();

        const [hour, minute] = selectedTime.split(':');
        const appointmentDateTime = new Date(selectedDate);
        appointmentDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

        if (appointmentDateTime < new Date()) {
            toast({ variant: 'destructive', title: 'Fecha inválida', description: 'No se puede agendar una cita en el pasado.' });
            return;
        }

        if (overlapWarning || availabilityWarning) {
            toast({ variant: "destructive", title: "Acción no permitida", description: "El horario seleccionado no está disponible." });
            return;
        }

        let clientDetails;
        if (tab === 'new') {
            if (!newClientName.trim()) {
                toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Por favor, completa el nombre del nuevo cliente.' });
                return;
            }
            clientDetails = { isNew: true, name: newClientName, phone: newClientPhone };
        } else {
            if (!selectedClientId) {
                toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Por favor, selecciona un cliente existente.' });
                return;
            }
            const client = clients.find(c => c.id === selectedClientId);
            if (!client) {
                toast({ variant: 'destructive', title: 'Error', description: 'El cliente seleccionado no es válido.' });
                return;
            }
            clientDetails = { isNew: false, clientId: client.id, clientName: client.name };
        }

        if (!selectedServiceId) {
            toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Por favor, selecciona un servicio.'});
            return;
        }
        
        const service = localServices.find(s => s.id.toString() === selectedServiceId);
        if (!service) {
            toast({ variant: 'destructive', title: 'Error', description: 'El servicio seleccionado no es válido.' });
            return;
        }

        const hourIndex = (parseInt(hour) - 8) * 4 + Math.floor(parseInt(minute) / 15);

        onSave({
            date: selectedDate,
            hourIndex: hourIndex,
            details: { ...clientDetails, serviceId: service.id, notes: notes }
        });
        handleClose();
    };
    
    const handleClose = () => {
        onClose();
    };

    const isPrefilled = !!modalData?.date && modalData?.hourIndex !== undefined && !modalData?.preselectedClient;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-w-[90vw] rounded-xl top-12 sm:left-[20%] left-[5%] fixed xl:top-12 xl:left-[35%]">
                <DialogHeader>
                    <DialogTitle>Nueva Cita</DialogTitle>
                    <DialogDescription>
                        Completa los datos para agendar una nueva cita.
                    </DialogDescription>
                </DialogHeader>
                <form id="appointment-form" onSubmit={handleSave} className="py-4 space-y-4 overflow-y-auto max-h-[70vh] pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="date">Fecha</Label>
                           </div>
                           {isPrefilled ? (
                                <div className="premium-input flex items-center bg-secondary cursor-not-allowed">
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{format(selectedDate, 'PPP', { locale: es })}</span>
                                </div>
                           ) : (
                               <Popover>
                                   <PopoverTrigger asChild>
                                       <Button variant="secondary" className={cn("w-full justify-start text-left font-normal premium-input bg-transparent", !selectedDate && "text-muted-foreground")}>
                                           <CalendarIcon className="mr-2 h-4 w-4" />
                                           {selectedDate ? format(selectedDate, 'dd-MM-yyyy', { locale: es }) : <span>Elige una fecha</span>}
                                       </Button>
                                   </PopoverTrigger>
                                   <PopoverContent className="w-auto p-0" align="start">
                                       <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={{ before: startOfDay(new Date()) }} initialFocus aria-label="Calendario" />
                                   </PopoverContent>
                               </Popover>
                           )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="time">Hora</Label>
                            </div>
                             {isPrefilled ? (
                                <div className="premium-input flex items-center bg-secondary cursor-not-allowed">
                                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{selectedTime}</span>
                                </div>
                            ) : (
                                <TimePicker value={selectedTime} onChange={setSelectedTime} selectedDate={selectedDate} />
                            )}
                        </div>
                    </div>
                    
                    {overlapWarning && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Horario Ocupado</AlertTitle>
                            <AlertDescription>
                                El horario seleccionado se superpone con otra cita. Por favor, elige otra hora.
                            </AlertDescription>
                        </Alert>
                    )}

                    {availabilityWarning && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Fuera de Horario</AlertTitle>
                            <AlertDescription>
                                El horario seleccionado está fuera de tu jornada laboral o en un día no disponible.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Tabs value={tab} onValueChange={setTab} className="pt-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="existing" aria-label="Seleccionar cliente existente"><User className="w-4 h-4 mr-2" />Existente</TabsTrigger>
                            <TabsTrigger value="new" aria-label="Crear cliente nuevo"><UserPlus className="w-4 h-4 mr-2" />Nuevo</TabsTrigger>
                        </TabsList>
                        <TabsContent value="existing" className="space-y-4 pt-4">
                            <div>
                                <Label htmlFor="client-search">Buscar cliente</Label>
                                <SearchableSelect
                                    id="client-search"
                                    items={clients}
                                    value={selectedClientId}
                                    onSelect={(client) => {
                                        if (client) {
                                            setSelectedClientId(client.id);
                                            setClientSearch(client.name);
                                        } else {
                                            setSelectedClientId('');
                                            setClientSearch('');
                                        }
                                    }}
                                    placeholder="Buscar cliente..."
                                    renderSelected={(client) => client.name}
                                    renderItem={(client) => (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{client.name}</p>
                                                <p className="text-xs text-muted-foreground">{client.phone}</p>
                                            </div>
                                            {client.last_visit_at && <p className="text-xs text-muted-foreground">Última visita: {format(new Date(client.last_visit_at), 'dd/MM/yy')}</p>}
                                        </div>
                                    )}
                                    filterFn={(client, search) =>
                                        client.name.toLowerCase().includes(search.toLowerCase()) ||
                                        (client.phone && client.phone.includes(search))
                                    }
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="new" className="space-y-4 pt-4">
                            <div>
                                <Label htmlFor="new-name">Nombre (requerido)</Label>
                                <Input id="new-name" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="new-phone">Teléfono (opcional)</Label>
                                <Input id="new-phone" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="space-y-2 pt-2">
                        <Label htmlFor="service">Servicio (requerido)</Label>
                        <SearchableSelect
                            id="service"
                            items={localServices}
                            value={selectedServiceId}
                            onSelect={(service) => setSelectedServiceId(service ? service.id.toString() : '')}
                            onCreateNew={handleCreateService}
                            placeholder="Buscar servicio..."
                            renderSelected={(service) => service.name}
                            renderItem={(service) => (
                                <div>
                                    <p className="font-medium">{service.name}</p>
                                    <p className="text-xs text-muted-foreground">${service.sale_price} — {service.duration_min} min</p>
                                </div>
                            )}
                        />
                        {endTime && <p className="text-xs text-right text-muted-foreground">Finaliza aprox. a las {endTime}</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alergias, preferencias, etc." />
                    </div>
                </form>
                <DialogFooter className="pt-4">
                    <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" form="appointment-form" variant="primary" disabled={overlapWarning || availabilityWarning}>
                        Guardar Cita
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AppointmentModal;