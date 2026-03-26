export const APP_CONFIG = {
  businessName: import.meta.env.VITE_BUSSINES_NAME || 'N-Pilar',
  tenantSlug: import.meta.env.VITE_TENANT_SLUG || 'demo',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3020',
};

export default APP_CONFIG;
