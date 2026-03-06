import axios from 'axios'

const BACKEND_URL = 'https://mistress-bedford-terrain-williams.trycloudflare.com'

// ─── Token helpers ────────────────────────────────────────────────────────────
export function setTokens(access, refresh) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
  // Set on axios defaults so ALL future requests automatically carry it
  axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
  axios.defaults.headers.common['X-Auth-Token'] = access
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  delete axios.defaults.headers.common['Authorization']
  delete axios.defaults.headers.common['X-Auth-Token']
}

export function loadStoredToken() {
  const token = localStorage.getItem('access_token')
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    axios.defaults.headers.common['X-Auth-Token'] = token
  }
}

// Load token immediately on app start (before any request fires)
loadStoredToken()

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Response interceptor — auto refresh on 401 ──────────────────────────────
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${BACKEND_URL}/api/v1/auth/refresh`,
            {},
            { headers: { 'Authorization': `Bearer ${refresh}`, 'X-Auth-Token': refresh } }
          )
          setTokens(data.access_token, refresh)
          original.headers['Authorization'] = `Bearer ${data.access_token}`
          original.headers['X-Auth-Token'] = data.access_token
          return api(original)
        } catch {
          clearTokens()
          window.location.href = '/login'
        }
      } else {
        clearTokens()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.delete('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clientsAPI = {
  list:     (params)   => api.get('/clients/', { params }),
  create:   (data)     => api.post('/clients/', data),
  get:      (id)       => api.get(`/clients/${id}`),
  update:   (id, data) => api.put(`/clients/${id}`, data),
  delete:   (id)       => api.delete(`/clients/${id}`),
  invoices: (id)       => api.get(`/clients/${id}/invoices`),
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoicesAPI = {
  list:        (params)   => api.get('/invoices/', { params }),
  create:      (data)     => api.post('/invoices/', data),
  get:         (id)       => api.get(`/invoices/${id}`),
  update:      (id, data) => api.put(`/invoices/${id}`, data),
  delete:      (id)       => api.delete(`/invoices/${id}`),
  send:        (id)       => api.post(`/invoices/${id}/send`),
  duplicate:   (id)       => api.post(`/invoices/${id}/duplicate`),
  downloadPdf: (id)       => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  createOrder: (invoiceId) => api.post(`/payments/create-order/${invoiceId}`),
  verify:      (data)      => api.post('/payments/verify', data),
  record:      (data)      => api.post('/payments/record', data),
  getPayments: (invoiceId) => api.get(`/payments/${invoiceId}`),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  summary:      (period) => api.get('/dashboard/summary', { params: { period } }),
  monthlyChart: ()       => api.get('/dashboard/chart/monthly'),
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiAPI = {
  status:              ()             => api.get('/ai/status'),
  generateDescription: (description)  => api.post('/ai/generate-description', { description }),
  paymentReminder:     (id, tone)     => api.post(`/ai/payment-reminder/${id}`, { tone }),
  invoiceSummary:      (id)           => api.get(`/ai/invoice-summary/${id}`),
}

export default api
