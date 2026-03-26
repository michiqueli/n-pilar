import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Phone, MessageSquare, CheckCircle, PartyPopper } from 'lucide-react';
import { api } from '@/lib/api';
import { APP_CONFIG } from '../../config';

const PublicBookingModal = ({ isOpen, onClose, modalData, services, onSave }) => {
    const { toast } = useToast();
    const [step, setStep] = useState('details');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep('details');
            setSelectedServiceId('');
            setPhoneNumber('');
            setVerificationCode('');
            setEndTime('');
            setIsLoading(false);
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedServiceId && modalData) {
            const service = services.find(s => s.id.toString() === selectedServiceId);
            if (service) {
                const startTime = addMinutes(new Date(modalData.date).setHours(8, 0, 0, 0), modalData.hourIndex * 15);
                const newEndTime = addMinutes(startTime, service.duration_min);
                setEndTime(format(newEndTime, 'HH:mm'));
            }
        }
    }, [selectedServiceId, modalData, services]);

    const handleSendVerificationCode = async () => {
        if (!selectedServiceId) { setError('Por favor, selecciona un servicio.'); return; }
        if (!phoneNumber || phoneNumber.length < 9) { setError('Por favor, ingresa un número de teléfono válido.'); return; }
        setIsLoading(true);
        setError('');

        try {
            await api.sendVerificationCode(`+54${phoneNumber}`, APP_CONFIG.tenantSlug);
            toast({ title: "Código Enviado", description: "Revisa tu teléfono para obtener el código de verificación." });
            setStep('verify');
        } catch (err) {
            console.error("Error al enviar el código:", err);
            setError("No se pudo enviar el código. Revisa el número e inténtalo de nuevo.");
            toast({ variant: "destructive", title: "Error", description: "No se pudo enviar el código de verificación." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!verificationCode || verificationCode.length !== 6) { setError('El código debe tener 6 dígitos.'); return; }
        setIsLoading(true);
        setError('');

        try {
            const appointmentDetails = await api.verifyAndBook({
                phone: `+54${phoneNumber}`,
                code: verificationCode,
                serviceId: selectedServiceId,
                appointmentAt: modalData.date.toISOString(),
                hourIndex: modalData.hourIndex,
            });
            setStep('success');
            onSave(appointmentDetails);
        } catch (err) {
            console.error("Error al confirmar la cita:", err);
            setError(err.message || "El código es incorrecto o ha expirado.");
            toast({ variant: "destructive", title: "Error de Verificación", description: err.message || "El código no es válido." });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedDateTime = useMemo(() => {
        if (!modalData) return { date: '', time: '' };
        const date = modalData.date;
        const time = addMinutes(new Date(date).setHours(8, 0, 0, 0), modalData.hourIndex * 15);
        return {
            date: format(date, 'EEEE, d \'de\' MMMM', { locale: es }),
            time: format(time, 'HH:mm'),
        };
    }, [modalData]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-w-[90vw] rounded-xl top-12 sm:left-[20%] left-[5%] fixed xl:top-12 xl:left-[35%]">
                <DialogHeader>
                    <DialogTitle>Confirmar tu Cita</DialogTitle>
                    <DialogDescription>
                        Estás a punto de reservar para el <span className="font-bold text-primary">{selectedDateTime.date}</span> a las <span className="font-bold text-primary">{selectedDateTime.time}</span>.
                    </DialogDescription>
                </DialogHeader>

                {step === 'details' && (
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="service">1. Elige el servicio</Label>
                            <Select onValueChange={setSelectedServiceId} value={selectedServiceId}>
                                <SelectTrigger id="service" className="w-full"><SelectValue placeholder="Selecciona un servicio..." /></SelectTrigger>
                                <SelectContent>
                                    {services.map(service => (<SelectItem key={service.id} value={service.id.toString()}>{service.name} - ${service.sale_price} ({service.duration_min} min)</SelectItem>))}
                                </SelectContent>
                            </Select>
                            {endTime && <p className="text-xs text-right text-muted-foreground">Finaliza aprox. a las {endTime}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">2. Ingresa tu teléfono (sin 0 y sin 15)</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Ej: 2991234567" className="pl-10" />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive text-center">{error}</p>}
                    </div>
                )}

                {step === 'verify' && (
                     <div className="py-4 space-y-4">
                        <div className="space-y-2 text-center">
                            <Label htmlFor="code">Ingresa el código de 6 dígitos que recibiste por SMS</Label>
                             <div className="relative w-48 mx-auto">
                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="code" type="text" maxLength={6} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="------" className="pl-10 text-center text-lg tracking-[0.5em]" />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive text-center">{error}</p>}
                     </div>
                )}
                
                {step === 'success' && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        <PartyPopper className="h-16 w-16 text-success" />
                        <h2 className="text-2xl font-bold">¡Cita Agendada!</h2>
                        <p className="text-muted-foreground">Tu cita ha sido confirmada con éxito. ¡Te esperamos!</p>
                    </div>
                )}

                <DialogFooter className="pt-4">
                    {step === 'details' && (<Button onClick={handleSendVerificationCode} className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enviar Código</Button>)}
                    {step === 'verify' && (<Button onClick={handleConfirmBooking} className="w-full" variant="primary" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}Confirmar Cita</Button>)}
                    {step === 'success' && (<Button onClick={onClose} className="w-full">Cerrar</Button>)}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PublicBookingModal;