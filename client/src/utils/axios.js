import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api', // adjust if your backend uses a different port
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


export default instance;
