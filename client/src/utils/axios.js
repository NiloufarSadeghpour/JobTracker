// src/utils/axios.js
import axios from 'axios';

// Simple in-memory access token (safe from XSS scraping)
let accessToken = null;
export const tokenStore = {
  get: () => accessToken,
  set: (t) => { accessToken = t; },
  clear: () => { accessToken = null; }
};

const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // send/receive HttpOnly refresh cookie
});

// Attach access token
instance.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

let refreshing = null;

instance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err?.config || {};

    if (!err.response) {
      return Promise.reject(err);
    }

    const status = err.response.status;

    const url = (original.url || '');
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout');

    if ((status === 401 || status === 403) && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      try {
        // De-dupe refresh calls
        refreshing = refreshing || instance.post('/auth/refresh').then(r => r.data).finally(() => (refreshing = null));

        const data = await refreshing;

        // Save the new access token
        tokenStore.set(data.accessToken);

        // Retry the original request with the new token
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;

        return instance(original);
      } catch (e) {
        // Refresh failed -> clear token and propagate
        tokenStore.clear();
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default instance;
