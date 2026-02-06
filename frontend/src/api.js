import axios from 'axios';

const raw = import.meta.env.VITE_API_URL;
const BASE_URL = raw
  ? (/\/api\/?$/.test(raw) ? raw.replace(/\/+$/, '') : raw.replace(/\/+$/, '') + '/api')
  : 'http://127.0.0.1:3001/api';

export const api = axios.create({
  baseURL: BASE_URL
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
