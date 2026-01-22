import axios from 'axios';

// API Configuration
const API_BASE = process.env.REACT_APP_API || 'http://localhost:5000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
  (config) => {
    // You can add authentication tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error.message);
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.error('Authentication required');
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error(`API error: ${status}`);
      }
      
      return Promise.reject(data?.error || `HTTP ${status}: ${data?.message || 'Unknown error'}`);
    } else if (error.request) {
      // Request made but no response
      console.error('No response received:', error.request);
      return Promise.reject('Network error. Please check your connection.');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      return Promise.reject('Request failed. Please try again.');
    }
  }
);

// API Methods
export const fetchSensors = async () => {
  try {
    const response = await api.get('/sensors');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sensors:', error);
    throw error;
  }
};

export const fetchSensorReadings = async (sensorId, hours = 24) => {
  try {
    const response = await api.get('/sensors/readings', {
      params: { sensor_id: sensorId, hours }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sensor readings:', error);
    throw error;
  }
};

export const fetchComplaints = async (params = {}) => {
  try {
    const response = await api.get('/complaints', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch complaints:', error);
    throw error;
  }
};

export const submitComplaint = async (complaintData) => {
  try {
    const response = await api.post('/complaints', complaintData);
    return response.data;
  } catch (error) {
    console.error('Failed to submit complaint:', error);
    throw error;
  }
};

export const fetchTickets = async (params = {}) => {
  try {
    const response = await api.get('/tickets', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    throw error;
  }
};

export const fetchHighPriorityTickets = async () => {
  try {
    const response = await api.get('/tickets/priority');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch high priority tickets:', error);
    throw error;
  }
};

export const updateTicket = async (ticketId, updates) => {
  try {
    const response = await api.patch(`/tickets/${ticketId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update ticket:', error);
    throw error;
  }
};

export const fetchAnalytics = async (type = 'equity') => {
  try {
    let endpoint = '/analytics/equity';
    switch (type) {
      case 'performance':
        endpoint = '/analytics/performance';
        break;
      case 'water-loss':
        endpoint = '/analytics/water-loss';
        break;
      default:
        endpoint = '/analytics/equity';
    }
    
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    throw error;
  }
};

export const fetchWardAnalytics = async (wardId) => {
  try {
    const response = await api.get(`/analytics/ward/${wardId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch ward analytics:', error);
    throw error;
  }
};

export const fetchSensorAnomalies = async () => {
  try {
    const response = await api.get('/sensors/anomalies');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sensor anomalies:', error);
    throw error;
  }
};

// Demo Control APIs
export const startDemo = async () => {
  try {
    const response = await api.post('/demo/start');
    return response.data;
  } catch (error) {
    console.error('Failed to start demo:', error);
    throw error;
  }
};

export const nextDemoStep = async () => {
  try {
    const response = await api.post('/demo/next');
    return response.data;
  } catch (error) {
    console.error('Failed to execute next demo step:', error);
    throw error;
  }
};

export const getDemoStatus = async () => {
  try {
    const response = await api.get('/demo/status');
    return response.data;
  } catch (error) {
    console.error('Failed to get demo status:', error);
    throw error;
  }
};

export const resetDemo = async () => {
  try {
    const response = await api.post('/demo/reset');
    return response.data;
  } catch (error) {
    console.error('Failed to reset demo:', error);
    throw error;
  }
};

// Health check
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default api;