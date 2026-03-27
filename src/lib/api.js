const API_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  constructor() {
    this.baseUrl = API_URL ? `${API_URL}/api` : '/api';
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  setTokens(access_token, refresh_token) {
    this.token = access_token;
    this.refreshToken = refresh_token;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Try refresh if 401
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.token}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Error en la solicitud');
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async tryRefresh() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.access_token, data.refresh_token);
        return true;
      }
    } catch {}
    this.clearTokens();
    return false;
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getProfile() {
    return this.request('/auth/profile');
  }

  // Clients
  getClients(search) {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/clients${params}`);
  }

  getClient(id) {
    return this.request(`/clients/${id}`);
  }

  createClient(data) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateClient(id, data) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteClient(id) {
    return this.request(`/clients/${id}`, { method: 'DELETE' });
  }

  // Services
  getServices(category) {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request(`/services${params}`);
  }

  getActiveServices() {
    return this.request('/services/active');
  }

  getService(id) {
    return this.request(`/services/${id}`);
  }

  createService(data) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateService(id, data) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteService(id) {
    return this.request(`/services/${id}`, { method: 'DELETE' });
  }

  // Appointments
  getAppointments(from, to) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params}` : '';
    return this.request(`/appointments${qs}`);
  }

  getAppointmentStats(from, to) {
    return this.request(`/appointments/stats?from=${from}&to=${to}`);
  }

  getAppointment(id) {
    return this.request(`/appointments/${id}`);
  }

  createAppointment(data) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateAppointment(id, data) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteAppointment(id) {
    return this.request(`/appointments/${id}`, { method: 'DELETE' });
  }

  // Payments
  getPayments(from, to) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params}` : '';
    return this.request(`/payments${qs}`);
  }

  createPayment(data) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updatePayment(id, data) {
    return this.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deletePayment(id) {
    return this.request(`/payments/${id}`, { method: 'DELETE' });
  }

  // Expenses
  getExpenses(from, to) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params}` : '';
    return this.request(`/expenses${qs}`);
  }

  createExpense(data) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateExpense(id, data) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteExpense(id) {
    return this.request(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${this.baseUrl}/upload`;
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Error al subir archivo');
    }
    return response.json();
  }

  // Schedules
  getWorkSchedules() {
    return this.request('/schedules/work');
  }

  setWorkSchedules(schedules) {
    return this.request('/schedules/work', {
      method: 'PUT',
      body: JSON.stringify(schedules),
    });
  }

  getScheduleExceptions(from, to) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params}` : '';
    return this.request(`/schedules/exceptions${qs}`);
  }

  createScheduleException(data) {
    return this.request('/schedules/exceptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteScheduleException(id) {
    return this.request(`/schedules/exceptions/${id}`, { method: 'DELETE' });
  }

  // Tenant
  getTenantConfig() {
    return this.request('/tenants/current');
  }

  updateTenantConfig(data) {
    return this.request('/tenants/current', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Public (no auth needed)
  getPublicServices(slug) {
    return this.request(`/public/${slug}/services`);
  }

  sendVerificationCode(phone, tenant_slug) {
    return this.request('/public/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone, tenant_slug }),
    });
  }

  verifyAndBook(data) {
    return this.request('/public/verify-and-book', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  forgotPassword(email, tenant_slug) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, tenant_slug }),
    });
  }

  resetPassword(token, new_password) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    });
  }

  sendConsent(client_id) {
    return this.request('/consent/send', {
      method: 'POST',
      body: JSON.stringify({ client_id }),
    });
  }

  acceptConsent(token) {
    return this.request('/consent/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  getConsentStatus(client_id) {
    return this.request(`/consent/status?client_id=${client_id}`);
  }
}

export const api = new ApiClient();
export default api;
