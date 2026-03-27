import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, BarChart3, Scissors, Wallet, LogOut, X, ChevronsLeft, ChevronsRight, Settings } from 'lucide-react';
import BusinessLogo from '@/components/BusinessLogo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import config from '@/config';

// Grupos del menú con separadores entre ellos
const menuGroups = [
    {
        label: 'Negocio',
        items: [
            { icon: LayoutDashboard, label: 'Panel del Día', path: '/' },
            { icon: CalendarDays, label: 'Agenda', path: '/calendario' },
            { icon: Users, label: 'Mis Clientes', path: '/clientes' },
            { icon: Scissors, label: 'Servicios Ofrecidos', path: '/productos' },
        ],
    },
    {
        label: 'Finanzas',
        items: [
            { icon: BarChart3, label: 'Analítica', path: '/analitica' },
            { icon: Wallet, label: 'Ingresos y Gastos', path: '/caja' },
        ],
    },
];

const configItem = { icon: Settings, label: 'Configuración', path: '/configuracion' };

const NavButton = ({ item, isActive, isOpen, isMobile, onClick }) => {
    const Icon = item.icon;
    return (
        <Button
            variant={isActive ? 'primary' : 'ghost'}
            className={cn(
                'w-full flex items-center',
                (isOpen || isMobile) ? 'justify-start text-base' : 'justify-center px-0'
            )}
            onClick={onClick}
            title={item.label}
            aria-label={item.label}
        >
            <Icon className={cn("w-5 h-5 flex-shrink-0", (isOpen || isMobile) && "mr-3")} />
            {(isOpen || isMobile) && (
                <span className="font-medium tracking-wide whitespace-nowrap overflow-hidden">
                    {item.label}
                </span>
            )}
        </Button>
    );
};

const Separator = ({ isOpen }) => (
    <div className={cn("border-t border-border/40", isOpen ? "mx-2 my-2" : "mx-1 my-2")} />
);

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleNavigation = path => {
        navigate(path);
        if (isMobile) setIsOpen(false);
    };

    const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.user_metadata?.username || "Usuario Anónimo";
    const displayInitial = displayName?.charAt(0).toUpperCase() || "U";
    const displayEmail = user?.email || "No email provided";

    // Mobile
    if (isMobile) {
        return (
            <motion.div
                className="bg-background flex flex-col h-full border-r overflow-hidden fixed z-50"
                animate={isOpen ? { x: 0, width: 250 } : { x: '-100%', width: 250 }}
                transition={{ type: 'spring', stiffness: 500, damping: 40, duration: 0.3 }}
                initial={false}
            >
                <div className="p-6 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <BusinessLogo size="md" />
                        <div className="overflow-hidden">
                            <h1 className="text-xl font-semibold text-foreground tracking-tight whitespace-nowrap">{config.appName}</h1>
                            <p className="text-xs text-muted-foreground font-medium whitespace-nowrap">X-PILAR</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <nav className="px-4 flex-1 overflow-y-auto flex flex-col gap-1">
                    {menuGroups.map((group, gi) => (
                        <React.Fragment key={group.label}>
                            {gi > 0 && <Separator isOpen={true} />}
                            {group.items.map(item => (
                                <NavButton
                                    key={item.path}
                                    item={item}
                                    isActive={location.pathname === item.path}
                                    isOpen={true}
                                    isMobile={true}
                                    onClick={() => handleNavigation(item.path)}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Configuración + Usuario */}
                <div className="flex-shrink-0 border-t px-4 py-3 space-y-1">
                    <NavButton
                        item={configItem}
                        isActive={location.pathname === configItem.path}
                        isOpen={true}
                        isMobile={true}
                        onClick={() => handleNavigation(configItem.path)}
                    />
                </div>

                <div className="p-4 flex-shrink-0 border-t space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                            <span className="text-sm font-bold text-primary-foreground">{displayInitial}</span>
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-sm truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-primary hover:text-destructive" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                    </Button>
                </div>
            </motion.div>
        );
    }

    // Desktop
    return (
        <motion.div
            className="bg-background flex flex-col h-full border-r overflow-hidden relative flex-shrink-0"
            animate={{ width: isOpen ? 270 : 72 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            initial={false}
        >
            {/* Logo */}
            <div className={cn("flex-shrink-0 flex items-center", isOpen ? "p-6 justify-between" : "p-4 justify-center")}>
                <div className="flex items-center space-x-3">
                    <BusinessLogo size="md" />
                    {isOpen && (
                        <div className="overflow-hidden">
                            <h1 className="text-xl font-semibold text-foreground tracking-tight whitespace-nowrap">{config.appName}</h1>
                            <p className="text-xs text-muted-foreground font-medium whitespace-nowrap">X-PILAR</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Nav principal con grupos */}
            <nav className={cn("flex-1 overflow-y-auto flex flex-col gap-1", isOpen ? "px-4" : "px-2")}>
                {menuGroups.map((group, gi) => (
                    <React.Fragment key={group.label}>
                        {gi > 0 && <Separator isOpen={isOpen} />}
                        {group.items.map(item => (
                            <NavButton
                                key={item.path}
                                item={item}
                                isActive={location.pathname === item.path}
                                isOpen={isOpen}
                                onClick={() => handleNavigation(item.path)}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </nav>

            {/* Configuración — arriba del usuario */}
            <div className={cn("flex-shrink-0 border-t", isOpen ? "px-4 py-2" : "px-2 py-2")}>
                <NavButton
                    item={configItem}
                    isActive={location.pathname === configItem.path}
                    isOpen={isOpen}
                    onClick={() => handleNavigation(configItem.path)}
                />
            </div>

            {/* Perfil de usuario */}
            <div className={cn("flex-shrink-0 border-t", isOpen ? "p-4" : "p-2")}>
                {isOpen ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                <span className="text-sm font-bold text-primary-foreground">{displayInitial}</span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="w-full justify-start text-primary hover:text-destructive" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar sesión
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-primary-foreground">{displayInitial}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Botón de colapso */}
            <div className={cn("flex-shrink-0 border-t", isOpen ? "p-2 flex justify-end" : "p-2 flex justify-center")}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(!isOpen)}
                    title={isOpen ? "Colapsar menú" : "Expandir menú"}
                    aria-label={isOpen ? "Colapsar menú" : "Expandir menú"}
                    className="text-muted-foreground hover:text-foreground"
                >
                    {isOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
                </Button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
