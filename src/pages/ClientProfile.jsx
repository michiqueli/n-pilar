import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Phone, Mail, MessageSquare, Edit, Calendar, Clock, User, Scissors, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api';
import ClientForm from '@/components/clients/ClientForm'; // Importamos el formulario

const ClientProfile = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [appointmentHistory, setAppointmentHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Estados para el modal de edición ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        notes: '',
        preferred_service_id: null
    });

    useEffect(() => {
        const fetchClientData = async () => {
            if (!id) return;

            setLoading(true);
            try {
                // getClient returns client with appointments included
                const clientData = await api.getClient(id);
                setClient(clientData);

                // Extract appointment history from client data if available,
                // otherwise it's included in the client response
                const history = (clientData.appointments || [])
                    .filter(a => ['COMPLETED', 'PAID'].includes(a.status))
                    .sort((a, b) => new Date(b.appointment_at) - new Date(a.appointment_at));
                setAppointmentHistory(history);

            } catch (error) {
                console.error("Error fetching client profile:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo cargar el perfil del cliente."
                });
                setClient(null);
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
    }, [id, toast]);

    // --- Funciones para los botones de acción ---

    const handleCall = () => {
        if (client && client?.phone) {
            window.location.href = `tel:${client?.phone}`;
        }
    };

    const handleWhatsApp = () => {
        if (client && client?.phone) {
            // Limpiamos el número de teléfono de caracteres no numéricos
            const cleanPhoneNumber = client?.phone?.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanPhoneNumber}`, '_blank');
        }
    };

    const handleEdit = () => {
        if (client) {
            setFormData({
                name: client?.name,
                phone: client?.phone,
                email: client?.email || '',
                notes: client?.notes || '',
                preferred_service_id: client?.preferred_service_id || null
            });
            setIsModalOpen(true);
        }
    };

    const handleScheduleAppointment = () => {
        navigate('/calendario', { state: { newAppointmentClient: client } });
    };

    // --- Funciones para el formulario de edición ---

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.phone.trim()) {
            toast({
                title: "Datos incompletos",
                description: "Nombre y teléfono son campos obligatorios.",
                variant: "destructive"
            });
            return;
        }

        try {
            const updatedClient = await api.updateClient(client.id, {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                notes: formData.notes,
            });

            setClient(updatedClient); // Actualizamos el perfil en la página al instante
            toast({
                title: "✅ Cliente Actualizado",
                description: `Los datos de ${updatedClient.name} se guardaron correctamente.`,
            });
            setIsModalOpen(false);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: "No se pudo actualizar el cliente. " + error.message,
            });
        }
    };

    // --- Resto de funciones y renderizado ---

    const getClientAvatar = (name) => {
        if (!name) return { initials: '?', color: 'bg-gray-500' };
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colors = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
        const colorIndex = name.length % colors.length;
        return { initials, color: colors[colorIndex] };
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Cargando perfil...</div>;
    }

    if (!client) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground">Cliente no encontrado</h2>
                    <p className="text-muted-foreground">El cliente que buscas no existe o ha sido eliminado.</p>
                    <Button asChild className="mt-4">
                        <Link to="/clientes">Volver a Clientes</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const avatar = getClientAvatar(client?.name);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <>
            <Helmet>
                <title>{client?.name} - Perfil de Cliente</title>
                <meta name="description" content={`Perfil detallado de ${client?.name}, incluyendo historial de servicios y preferencias.`} />
            </Helmet>

            <motion.div
                className="space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <Link to="/clientes" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Volver a todos los clientes
                    </Link>
                </motion.div>

                <motion.div variants={itemVariants} className="premium-card p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className={`w-24 h-24 rounded-full ${avatar.color} flex-shrink-0 flex items-center justify-center text-primary-foreground font-bold text-4xl shadow-lg`}>
                            {avatar.initials}
                        </div>
                        <div className="flex-grow">
                            <h1 className="text-3xl font-bold text-foreground">{client?.name}</h1>
                            <p className="text-muted-foreground mt-1">Cliente desde {format(parseISO(client.created_at), 'MMMM yyyy', { locale: es })}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button onClick={handleCall} variant="outline" size="sm"><Phone className="w-4 h-4 mr-2" />Llamar</Button>
                                <Button onClick={handleWhatsApp} variant="outline" size="sm"><MessageSquare className="w-4 h-4 mr-2" />WhatsApp</Button>
                                <Button onClick={handleEdit} variant="outline" size="sm"><Edit className="w-4 h-4 mr-2" />Editar</Button>
                                <Button onClick={handleScheduleAppointment} variant="primary" size="sm"><Calendar className="w-4 h-4 mr-2" />Agendar Cita</Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                        <div className="premium-card p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Historial de Servicios</h2>
                            {appointmentHistory.length > 0 ? (
                                <ul className="space-y-4">
                                    {appointmentHistory.map((appointment) => (
                                        <li key={appointment.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Scissors className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold text-foreground">{appointment.services?.name || appointment.service?.name || 'Servicio no especificado'}</p>
                                                    <p className="text-sm font-bold text-success">${appointment.price_at_time.toFixed(2)}</p>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{format(parseISO(appointment.appointment_at), 'PPP', { locale: es })}</p>
                                                {appointment.notes && <p className="text-xs italic text-muted-foreground mt-2">"{appointment.notes}"</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No hay historial de servicios registrados.</p>
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-6">
                        <div className="premium-card p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><Info className="w-5 h-5 text-primary"/> Información General</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-foreground"/> <span className="text-foreground">{client?.phone}</span></div>
                                {client.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-foreground"/> <span className="text-foreground">{client.email}</span></div>}
                            </div>
                        </div>
                        <div className="premium-card p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary"/> Notas del Barbero</h2>
                            <p className="text-sm text-muted-foreground italic">
                                {client.notes || "No hay notas personales para este cliente."}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <ClientForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedClient={client}
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
            />
        </>
    );
};

export default ClientProfile;