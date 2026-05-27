import axios from 'axios';

const baseURL = import.meta.env?.VITE_API_URL || 'http://localhost:4000';

// Create axios instance with custom config
const instance = axios.create({
  baseURL,
  // Render's free tier spins the API down when idle; the first request after a
  // cold start can take ~30-50s, so allow generous headroom before timing out.
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // Get token from sessionStorage (per-window session)
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;