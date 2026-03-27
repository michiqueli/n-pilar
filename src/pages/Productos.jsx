import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Plus, Scissors, Search, X as XIcon, SlidersHorizontal, LayoutGrid, List, Tag, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import ServiceCard from '@/components/products/ServiceCard';
import ServiceListRow from '@/components/products/ServiceListRow';
import ServiceForm from '@/components/products/ServiceForm';
import CategoryFilter from '@/components/products/CategoryFilter';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import config from '@/config';

const Productos = () => {
    const { toast } = useToast();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState('grid');
    const [showInactive, setShowInactive] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [dbCategories, setDbCategories] = useState([]);
    const [showCategoryPanel, setShowCategoryPanel] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    const categories = useMemo(() => {
        const allCategories = new Set(['Todos']);
        dbCategories.forEach(c => allCategories.add(c.name));
        services.forEach(s => {
            if (s.active === !showInactive && s.category) {
                allCategories.add(s.category);
            }
        });
        return Array.from(allCategories);
    }, [services, showInactive, dbCategories]);

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                const [data, cats] = await Promise.all([
                    api.getServices(),
                    api.getCategories(),
                ]);
                setServices(data || []);
                setDbCategories(cats || []);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error al cargar servicios",
                    description: "No se pudo obtener el catálogo de servicios."
                });
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, [toast]);

    const serviceCounts = useMemo(() => services.reduce((acc, service) => {
        if (service.active === !showInactive) {
            const category = service.category || 'Sin Categoría';
            acc[category] = (acc[category] || 0) + 1;
            acc['Todos'] = (acc['Todos'] || 0) + 1;
        }
        return acc;
    }, {}), [services, showInactive]);

    const filteredServices = useMemo(() => {
        return services
            .filter(service => service.active === !showInactive)
            .filter(service => selectedCategory === 'Todos' || service.category === selectedCategory)
            .filter(service => service.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                switch (sortBy) {
                    case 'price_asc': return a.sale_price - b.sale_price;
                    case 'price_desc': return b.sale_price - a.sale_price;
                    case 'duration_asc': return a.duration_min - b.duration_min;
                    case 'duration_desc': return b.duration_min - a.duration_min;
                    case 'name_asc': return a.name.localeCompare(b.name);
                    default: return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
                }
            });
    }, [services, selectedCategory, searchTerm, sortBy, showInactive]);

    const handleOpenModal = (service = null) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    const handleSaveService = async (serviceData) => {
        try {
            const { id, ...dataToSave } = serviceData;
            if (id) {
                const data = await api.updateService(id, dataToSave);
                setServices(prev => prev.map(s => s.id === data.id ? data : s));
                toast({ title: "✅ Servicio Actualizado" });
            } else {
                const data = await api.createService(dataToSave);
                setServices(prev => [...prev, data]);
                toast({ title: "🎉 Servicio Agregado" });
            }
            handleCloseModal();
        } catch (error) {
            toast({ variant: "destructive", title: "Error al guardar", description: error.message });
        }
    };

    const togglePopular = async (serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;
        try {
            const data = await api.updateService(serviceId, { popular: !service.popular });
            setServices(services.map(s => s.id === serviceId ? data : s));
            toast({ title: "⭐ Estado Actualizado" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error al actualizar", description: error.message });
        }
    };

    const handleDeactivateService = async (serviceId) => {
        try {
            const data = await api.updateService(serviceId, { active: false });
            setServices(services.map(s => s.id === serviceId ? data : s));
            toast({ title: "🗑️ Servicio Desactivado" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error al desactivar", description: error.message });
        }
    };

    const handleReactivateService = async (serviceId) => {
        try {
            const data = await api.updateService(serviceId, { active: true });
            setServices(services.map(s => s.id === serviceId ? data : s));
            toast({ title: "✅ Servicio Reactivado" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error al reactivar", description: error.message });
        }
    };

    const handleDeleteService = (service) => {
        setServiceToDelete(service);
        setIsConfirmOpen(true);
    };

    const confirmPermanentDelete = async () => {
        if (!serviceToDelete) return;
        try {
            await api.deleteService(serviceToDelete.id);
            setServices(services.filter(s => s.id !== serviceToDelete.id));
            toast({ title: "🔥 Servicio Eliminado Permanentemente" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el servicio. Es posible que esté asociado a citas existentes." });
        } finally {
            setIsConfirmOpen(false);
            setServiceToDelete(null);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const cat = await api.createCategory({ name: newCategoryName.trim() });
            setDbCategories(prev => [...prev, cat]);
            setNewCategoryName('');
            toast({ title: "Categoría creada" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleUpdateCategory = async (id) => {
        if (!editingCategoryName.trim()) return;
        try {
            const cat = await api.updateCategory(id, { name: editingCategoryName.trim() });
            setDbCategories(prev => prev.map(c => c.id === id ? cat : c));
            setEditingCategoryId(null);
            toast({ title: "Categoría actualizada" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await api.deleteCategory(id);
            setDbCategories(prev => prev.filter(c => c.id !== id));
            toast({ title: "Categoría eliminada" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const EmptyState = () => (
        <motion.div
            className="text-center py-20 text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Scissors className="w-24 h-24 mx-auto mb-6 opacity-30" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">
                {showInactive ? "No hay servicios inactivos" : "Tu catálogo está vacío"}
            </h3>
            <p className="mb-6 max-w-md mx-auto">
                {searchTerm || selectedCategory !== 'Todos'
                    ? "No se encontraron servicios que coincidan con tu búsqueda."
                    : (showInactive ? "Todos tus servicios están activos." : "¡Es hora de empezar! Agrega tu primer servicio.")
                }
            </p>
            {!showInactive && (
                <Button onClick={() => handleOpenModal()} variant="primary" size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Crear mi Primer Servicio
                </Button>
            )}
        </motion.div>
    );

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando servicios...</div>;
    }

    return (
        <>
            <Helmet>
                <title>{`Servicios - ${config.appName}`}</title>
                <meta name="description" content="Catálogo completo de servicios y precios de la barbería" />
            </Helmet>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                {isModalOpen && <ServiceForm service={selectedService} onSave={handleSaveService} onClose={handleCloseModal} categories={dbCategories} />}
            </Dialog>

            <ConfirmationDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmPermanentDelete}
                title="¿Eliminar Permanentemente?"
                description={`Estás a punto de borrar "${serviceToDelete?.name}" para siempre. Esta acción no se puede deshacer.`}
            />

            <div className="space-y-8">
                <motion.div
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Servicios Ofrecidos</h1>
                        <p className="text-muted-foreground mt-1">Gestiona tu oferta de servicios profesionales.</p>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => setShowCategoryPanel(!showCategoryPanel)} variant="secondary" size="lg">
                            <Tag className="w-5 h-5 mr-2" />
                            Categorías
                        </Button>
                        <Button onClick={() => handleOpenModal()} variant="primary" size="lg">
                            <Plus className="w-5 h-5 mr-2" />
                            Nuevo Servicio
                        </Button>
                    </div>
                </motion.div>

                {showCategoryPanel && (
                        <div className="premium-card p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground flex items-center gap-2"><Tag className="w-4 h-4" /> Categorías</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowCategoryPanel(false)}><XIcon className="w-4 h-4" /></Button>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Nueva categoría..."
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                />
                                <Button variant="primary" size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                                    <Plus className="w-4 h-4 mr-1" />Agregar
                                </Button>
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {dbCategories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group">
                                        {editingCategoryId === cat.id ? (
                                            <div className="flex gap-2 flex-1">
                                                <Input
                                                    value={editingCategoryName}
                                                    onChange={(e) => setEditingCategoryName(e.target.value)}
                                                    className="flex-1 h-8 text-sm"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                                                    autoFocus
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUpdateCategory(cat.id)}>
                                                    <Check className="w-3 h-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCategoryId(null)}>
                                                    <XIcon className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-sm text-foreground">{cat.name}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}>
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {dbCategories.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-2">No hay categorías. Crea la primera.</p>
                                )}
                            </div>
                        </div>
                    )}

                <motion.div
                    className="premium-card p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <CategoryFilter
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        serviceCounts={serviceCounts}
                    />

                    <div className="flex flex-col md:flex-row gap-4 mb-6 border-t pt-6">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && <XIcon onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" />}
                        </div>
                        <div className="flex items-center gap-4">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Ordenar por..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="popular">Más Populares</SelectItem>
                                    <SelectItem value="price_asc">Precio (menor a mayor)</SelectItem>
                                    <SelectItem value="price_desc">Precio (mayor a menor)</SelectItem>
                                    <SelectItem value="duration_asc">Duración (corta a larga)</SelectItem>
                                    <SelectItem value="duration_desc">Duración (larga a corta)</SelectItem>
                                    <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="hidden md:flex items-center gap-1 bg-muted p-1 rounded-lg">
                                <Button variant={viewMode === 'grid' ? 'primary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')}>
                                    <LayoutGrid className="h-5 w-5"/>
                                </Button>
                                 <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}>
                                    <List className="h-5 w-5"/>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-6">
                        <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
                        <Label htmlFor="show-inactive">Mostrar inactivos</Label>
                    </div>

                    <motion.div
                        layout
                        className={cn("grid gap-6", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}
                    >
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service, index) => (
                                    viewMode === 'grid' ? (
                                        <ServiceCard
                                            key={service.id}
                                            service={service}
                                            index={index}
                                            onEdit={handleOpenModal}
                                            onTogglePopular={togglePopular}
                                            onDeactivate={handleDeactivateService}
                                            onReactivate={handleReactivateService}
                                            onDelete={handleDeleteService}
                                        />
                                    ) : (
                                        <ServiceListRow
                                            key={service.id}
                                            service={service}
                                            onEdit={handleOpenModal}
                                            onTogglePopular={togglePopular}
                                            onDeactivate={handleDeactivateService}
                                            onReactivate={handleReactivateService}
                                            onDelete={handleDeleteService}
                                        />
                                    )
                                ))
                            ) : (
                                <EmptyState />
                            )}
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
};

export default Productos;