// frontend/src/services/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:5000/api';
const API_TIMEOUT = 30000;

const api = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    // attach auth token here if needed later
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: return successes, normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize the error into a predictable object
    if (error.response) {
      const { status, data } = error.response;
      return Promise.reject({
        success: false,
        status,
        message: data?.message || data?.error || `HTTP ${status}`
      });
    }
    if (error.request) {
      return Promise.reject({
        success: false,
        status: 0,
        message: 'Network error. Please check your connection.'
      });
    }
    return Promise.reject({
      success: false,
      status: 0,
      message: 'Unexpected error occurred.'
    });
  }
);

// API methods (all return response.data)
export const fetchSensors = async () => (await api.get('/sensors')).data;
export const fetchSensorReadings = async (sensorId, hours = 24) =>
  (await api.get('/sensors/readings', { params: { sensor_id: sensorId, hours } })).data;
export const fetchComplaints = async (params = {}) =>
  (await api.get('/complaints', { params })).data;

// submitComplaint returns backend response body:
// { success: true, complaintId, ticketId, message }
export const submitComplaint = async (complaintData) => {
  const response = await api.post('/complaints', complaintData);
  return response.data;
};

export const fetchTickets = async (params = {}) =>
  (await api.get('/tickets', { params })).data;

export const fetchHighPriorityTickets = async () =>
  (await api.get('/tickets/priority')).data;

export const updateTicket = async (ticketId, updates) =>
  (await api.patch(`/tickets/${ticketId}`, updates)).data;

export const fetchAnalytics = async (type = 'equity') => {
  let endpoint = '/analytics/equity';
  if (type === 'performance') endpoint = '/analytics/performance';
  if (type === 'water-loss') endpoint = '/analytics/water-loss';
  return (await api.get(endpoint)).data;
};

export const fetchWardAnalytics = async (wardId) =>
  (await api.get(`/analytics/ward/${wardId}`)).data;

export const fetchSensorAnomalies = async () =>
  (await api.get('/sensors/anomalies')).data;

export const startDemo = async () => (await api.post('/demo/start')).data;
export const nextDemoStep = async () => (await api.post('/demo/next')).data;
export const getDemoStatus = async () => (await api.get('/demo/status')).data;
export const resetDemo = async () => (await api.post('/demo/reset')).data;

export const checkHealth = async () => (await api.get('/health')).data;

export default api;
