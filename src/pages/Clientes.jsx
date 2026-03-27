import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Plus, Download, UserPlus, LayoutGrid, Rows, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ClientCard from '@/components/clients/ClientCard';
import ClientFilters from '@/components/clients/ClientFilters';
import ClientForm from '@/components/clients/ClientForm';
import EmptyState from '@/components/clients/EmptyState';
import { useNavigate } from 'react-router-dom';
import ClientListRow from '@/components/clients/ClientListRow';
import api from '@/lib/api';
import config from '@/config';

const Clientes = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('last_visit_at');
    const [filterBy, setFilterBy] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        preferred_service_id: null
    });

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setViewMode('mobile');
            } else if (viewMode === 'mobile') {
                setViewMode('grid');
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [viewMode]);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const [data, servicesData] = await Promise.all([
                    api.getClients(),
                    api.getActiveServices(),
                ]);
                setClients(data || []);
                setServices(servicesData || []);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error al cargar clientes",
                    description: "No se pudieron obtener los datos de los clientes desde la base de datos."
                });
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [toast]);


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
            if (selectedClient) {
                await api.updateClient(selectedClient.id, {
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    preferred_service_id: formData.preferred_service_id || null,
                });

                // Refetch para traer la relación preferred_service completa
                const refreshed = await api.getClients();
                setClients(refreshed || []);
                toast({
                    title: "Cliente Actualizado",
                    description: `Los datos de ${formData.name} se guardaron correctamente.`,
                });

            } else {
                await api.createClient({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email || null,
                    preferred_service_id: formData.preferred_service_id || null,
                });

                const refreshed = await api.getClients();
                setClients(refreshed || []);
                toast({
                    title: "Cliente Agregado",
                    description: `${formData.name} ahora forma parte de tu cartera.`,
                });
            }
            resetForm();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: "No se pudo guardar el cliente. " + error.message,
            });
        }
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', email: '', preferred_service_id: null });
        setSelectedClient(null);
        setIsModalOpen(false);
    };

    const openNewClientModal = () => {
        setSelectedClient(null);
        setFormData({ name: '', phone: '', email: '', preferred_service_id: null });
        setIsModalOpen(true);
    }

    const handleEdit = (client) => {
        setSelectedClient(client);
        setFormData({
            name: client?.name,
            phone: client?.phone,
            email: client?.email || null,
            preferred_service_id: client?.preferred_service_id || null
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (clientId) => {
        try {
            await api.deleteClient(clientId);

            setClients(prev => prev.filter(client => client.id !== clientId));
            toast({
                title: "🗑️ Cliente Eliminado",
                description: "El cliente ha sido removido de tu lista.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al eliminar",
                description: "No se pudo eliminar el cliente. " + error.message,
            });
        }
    };

    const handleFeatureNotImplemented = (featureName) => {
        toast({
            title: `🚧 ${featureName} no disponible`,
            description: "Esta función no está implementada aún. ¡Pídela en tu próximo prompt! 🚀",
        });
    };

    const handleViewProfile = (client) => {
        navigate(`/clientes/${client.id}`);
    };

    const handleScheduleAppointment = (client) => {
        navigate('/calendario', { state: { newAppointmentClient: client }});
    };

    const handleSendConsent = async (client) => {
        try {
            await api.sendConsent(client.id);
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, consent_status: 'sent' } : c));
            toast({ title: "Consentimiento enviado", description: `Se envió el email a ${client.email}` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo enviar el consentimiento." });
        }
    };

    const filteredAndSortedClients = clients
        .filter(client => {
            const searchLower = searchTerm.toLowerCase();
            return client?.name.toLowerCase().includes(searchLower) ||
                   client?.phone.includes(searchTerm) ||
                   (client.email && client.email.toLowerCase().includes(searchLower));
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'last_visit_at':
                    return new Date(b.last_visit_at || 0) - new Date(a.last_visit_at || 0);
                case 'created_at':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'total_visits':
                    return (b.total_visits || 0) - (a.total_visits || 0);
                default:
                    return 0;
            }
        });

    const viewClasses = {
        grid: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6",
        compact: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4",
        list: "flex flex-col gap-2",
        mobile: "flex flex-col gap-3",
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando clientes...</div>;
    }

    return (
        <>
            <Helmet>
                <title>{`Mis Clientes - ${config.appName}`}</title>
                <meta name="description" content="Gestiona tu base de clientes, su historial de visitas, preferencias y más." />
            </Helmet>

            <div className="space-y-6">
                <motion.div
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-foreground">Mis Clientes</h1>
                        <p className="text-muted-foreground mt-1">Tu base de datos para construir relaciones duraderas.</p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/*<DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" className="hidden md:flex">
                                    <Download className="w-4 h-4 mr-2" />
                                    Opciones
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleFeatureNotImplemented('Importar Contactos')}>
                                    Importar desde Contactos
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFeatureNotImplemented('Importar CSV')}>
                                    Importar desde CSV
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleFeatureNotImplemented('Exportar CSV')}>
                                    Exportar a CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>*/}

                        <Button onClick={openNewClientModal} variant="primary" className="w-full md:w-auto" size="lg">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Nuevo Cliente
                        </Button>
                    </div>
                </motion.div>

                <motion.div
                    className="premium-card p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <ClientFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        filterBy={filterBy}
                        setFilterBy={setFilterBy}
                        clients={clients}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        isMobile={isMobile}
                    />
                </motion.div>

                <AnimatePresence mode="wait">
                    {filteredAndSortedClients.length > 0 ? (
                        <motion.div
                            key={viewMode}
                            className={viewClasses[viewMode]}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                        {filteredAndSortedClients.map((client, index) => {
                            if (viewMode === 'list') {
                                return <ClientListRow
                                    key={client.id}
                                    client={client}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onScheduleAppointment={handleScheduleAppointment}
                                    onViewProfile={handleViewProfile}
                                />
                            }
                            return <ClientCard
                                key={client.id}
                                client={client}
                                index={index}
                                viewMode={viewMode}
                                onViewProfile={handleViewProfile}
                                onEdit={handleEdit}
                                onScheduleAppointment={handleScheduleAppointment}
                                onDelete={handleDelete}
                                onSendConsent={handleSendConsent}
                            />
                        })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mt-8"
                        >
                        {searchTerm || filterBy !== 'all' ? (
                            <div className="text-center py-16">
                                <h3 className="text-xl font-bold text-foreground mb-3">
                                    No se encontraron clientes
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Intenta ajustar los filtros o el término de búsqueda.
                                </p>
                                <Button
                                    onClick={() => {
                                    setSearchTerm('');
                                    setFilterBy('all');
                                    }}
                                    variant="secondary"
                                >
                                    Limpiar filtros
                                </Button>
                            </div>
                        ) : (
                            <EmptyState onAddClient={openNewClientModal} />
                        )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            <ClientForm
                isOpen={isModalOpen}
                onClose={resetForm}
                selectedClient={selectedClient}
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                services={services}
            />
        </>
    );
};

export default Clientes;