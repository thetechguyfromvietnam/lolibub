import axios from 'axios';

// Auto-detect API URL based on environment
const getApiUrl = () => {
  // If custom API URL is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production (Vercel), use relative URLs
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // In development, use localhost
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMenu = async () => {
  const response = await api.get('/menu');
  return response.data;
};

export const submitOrder = async (orderFormData) => {
  const isFormData = typeof FormData !== 'undefined' && orderFormData instanceof FormData;
  const config = isFormData
    ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    : {};

  const response = await axios.post(`${API_BASE_URL}/orders`, orderFormData, config);
  return response.data;
};

export default api;

