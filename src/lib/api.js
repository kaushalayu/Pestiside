import axios from 'axios';
import { store } from '../store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial for httpOnly refresh cookies
});

api.interceptors.request.use(
  (config) => {
    // Dynamically inject JWT token from Redux state on every request
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor to intercept unauthenticated requests and try auto-refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If it's 401 Unauthorized, and we haven't already retried this original request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Ping refresh endpoint implicitly containing httpOnly refresh cookie
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        
        // Grab new token and update state securely without losing context
        const newToken = res.data.accessToken;
        store.dispatch({ type: 'auth/updateToken', payload: newToken });
        
        // Re-attempt exact same original network call with new credentials mapped
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // If refresh fails (Token completely expired after 7 days) log out entirely
        store.dispatch({ type: 'auth/logout' });
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
