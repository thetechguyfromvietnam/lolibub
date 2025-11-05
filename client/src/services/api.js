import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  const response = await axios.post(`${API_BASE_URL}/orders`, orderFormData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;

