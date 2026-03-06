import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle token expiry — auto refresh
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refresh}` }
          })
          localStorage.setItem('access_token', data.access_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.delete('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ─── Clients ─────────────────────────────────────────────────
export const clientsAPI = {
  list: (params) => api.get('/clients/', { params }),
  create: (data) => api.post('/clients/', data),
  get: (id) => api.get(`/clients/${id}`),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  invoices: (id) => api.get(`/clients/${id}/invoices`),
}

// ─── Invoices ─────────────────────────────────────────────────
export const invoicesAPI = {
  list: (params) => api.get('/invoices/', { params }),
  create: (data) => api.post('/invoices/', data),
  get: (id) => api.get(`/invoices/${id}`),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  send: (id) => api.post(`/invoices/${id}/send`),
  duplicate: (id) => api.post(`/invoices/${id}/duplicate`),
  downloadPdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
}

// ─── Payments ─────────────────────────────────────────────────
export const paymentsAPI = {
  createOrder: (invoiceId) => api.post(`/payments/create-order/${invoiceId}`),
  verify: (data) => api.post('/payments/verify', data),
  record: (data) => api.post('/payments/record', data),
  getPayments: (invoiceId) => api.get(`/payments/${invoiceId}`),
}

// ─── Dashboard ────────────────────────────────────────────────
export const dashboardAPI = {
  summary: (period) => api.get('/dashboard/summary', { params: { period } }),
  monthlyChart: () => api.get('/dashboard/chart/monthly'),
}

// ─── AI ───────────────────────────────────────────────────────
export const aiAPI = {
  status: () => api.get('/ai/status'),
  generateDescription: (description) => api.post('/ai/generate-description', { description }),
  paymentReminder: (id, tone) => api.post(`/ai/payment-reminder/${id}`, { tone }),
  invoiceSummary: (id) => api.get(`/ai/invoice-summary/${id}`),
}

export default api
