// services/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:5000/api';

export const submitComplaint = async (payload) => {
  const res = await axios.post(`${API_BASE}/complaints`, payload);
  return res.data;
};

export const fetchTickets = async () => {
  const res = await axios.get(`${API_BASE}/tickets`);
  return res.data;
};
