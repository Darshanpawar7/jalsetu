import axios from 'axios';

// ================================
// API Configuration
// ================================
const API_BASE = process.env.REACT_APP_API || 'http://localhost:5000/api';
const API_TIMEOUT = 30000; // 30 seconds

// ================================
// Axios instance
// ================================
const api = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================================
// Request Interceptor
// ================================
api.interceptors.request.use(
  (config) => {
    // Add auth token here if needed in future
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================================
// Response Interceptor (FIXED)
// ================================
api.interceptors.response.use(
  (response) => {
    // ✅ Always resolve successful HTTP responses
    return response;
  },
  (error) => {
    console.error('API Error:', error);

    // Normalize error object (IMPORTANT)
    if (error.response) {
      const { status, data } = error.response;

      return Promise.reject({
        success: false,
        status,
        message:
          data?.message ||
          data?.error ||
          `Request failed with status ${status}`,
      });
    }

    if (error.request) {
      return Promise.reject({
        success: false,
        status: 0,
        message: 'Network error. Please check your connection.',
      });
    }

    return Promise.reject({
      success: false,
      status: 0,
      message: 'Unexpected error occurred.',
    });
  }
);

// ================================
// API METHODS
// ================================

export const fetchSensors = async () => {
  const response = await api.get('/sensors');
  return response.data;
};

export const fetchSensorReadings = async (sensorId, hours = 24) => {
  const response = await api.get('/sensors/readings', {
    params: { sensor_id: sensorId, hours },
  });
  return response.data;
};

export const fetchComplaints = async (params = {}) => {
  const response = await api.get('/complaints', { params });
  return response.data;
};

// 🔥 MOST IMPORTANT FIX
export const submitComplaint = async (complaintData) => {
  const response = await api.post('/complaints', complaintData);

  /**
   * Backend returns:
   * {
   *   success: true,
   *   complaintId,
   *   ticketId,
   *   message
   * }
   */
  return response.data;
};

export const fetchTickets = async (params = {}) => {
  const response = await api.get('/tickets', { params });
  return response.data;
};

export const fetchHighPriorityTickets = async () => {
  const response = await api.get('/tickets/priority');
  return response.data;
};

export const updateTicket = async (ticketId, updates) => {
  const response = await api.patch(`/tickets/${ticketId}`, updates);
  return response.data;
};

export const fetchAnalytics = async (type = 'equity') => {
  let endpoint = '/analytics/equity';

  if (type === 'performance') endpoint = '/analytics/performance';
  if (type === 'water-loss') endpoint = '/analytics/water-loss';

  const response = await api.get(endpoint);
  return response.data;
};

export const fetchWardAnalytics = async (wardId) => {
  const response = await api.get(`/analytics/ward/${wardId}`);
  return response.data;
};

export const fetchSensorAnomalies = async () => {
  const response = await api.get('/sensors/anomalies');
  return response.data;
};

// ================================
// DEMO CONTROL
// ================================
export const startDemo = async () => {
  const response = await api.post('/demo/start');
  return response.data;
};

export const nextDemoStep = async () => {
  const response = await api.post('/demo/next');
  return response.data;
};

export const getDemoStatus = async () => {
  const response = await api.get('/demo/status');
  return response.data;
};

export const resetDemo = async () => {
  const response = await api.post('/demo/reset');
  return response.data;
};

// ================================
// HEALTH CHECK
// ================================
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
