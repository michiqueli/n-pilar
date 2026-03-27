import { Scissors, Sparkles, Eye, Hand } from 'lucide-react';

// Tipos de negocio con sus íconos por defecto
export const BUSINESS_TYPES = {
  barbershop: {
    label: 'Peluquería / Barbería',
    icon: Scissors,
    bgImage: 'https://images.unsplash.com/photo-1582483720544-4068701c073d?auto=format&fit=crop&w=1920&q=80',
  },
  beauty_salon: {
    label: 'Salón de Belleza',
    icon: Sparkles,
    bgImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1920&q=80',
  },
  aesthetics: {
    label: 'Centro de Estética',
    icon: Eye,
    bgImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1920&q=80',
  },
  spa: {
    label: 'Spa / Bienestar',
    icon: Hand,
    bgImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1920&q=80',
  },
};

const businessType = import.meta.env.VITE_BUSINESS_TYPE || 'barbershop';
const businessConfig = BUSINESS_TYPES[businessType] || BUSINESS_TYPES.barbershop;

export const APP_CONFIG = {
  businessName: import.meta.env.VITE_BUSSINES_NAME || 'N-Pilar',
  appName: import.meta.env.VITE_BUSSINES_NAME || 'N-Pilar',
  businessSubtitle: import.meta.env.VITE_BUSINESS_SUBTITLE || '',
  tenantSlug: import.meta.env.VITE_TENANT_SLUG || 'demo',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3020',
  businessType,
  BusinessIcon: businessConfig.icon,
  businessLabel: businessConfig.label,
  logoUrl: import.meta.env.VITE_LOGO_URL || null,
  bgImage: businessConfig.bgImage,
  defaultPalette: import.meta.env.VITE_PALETTE || 'default',
};

export default APP_CONFIG;
