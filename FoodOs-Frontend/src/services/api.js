import axios from 'axios';
import API_BASE_URL from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Don't add token for refresh endpoint
    if (token && !config.url.includes('refresh-token')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (Auto-Refresh Logic)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Check for new token in response headers
    const newToken = response.headers['authorization'];
    if (newToken && newToken.startsWith('Bearer ')) {
      // Logic to auto-update token if backend rotates it on every request
      // But we should act cautiously if we only expect rotation on refresh/login
      // FoodOs implementation had this, so preserving it might be safer, 
      // but typically you only want this from specific endpoints.
      // Keeping it as it was in previous FoodOs code:
      localStorage.setItem('token', newToken.substring(7));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error for debugging (could use toast here if available)
    if (error.response?.status === 403) {
      console.warn("Permission denied:", error.response.data);
    }
    
    // Check if error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            originalRequest._retry = true;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call Refresh API
        const response = await axios.post(
          `${API_BASE_URL}/refresh-token`,
          {},
          { withCredentials: true }
        );

        // Extract new token from header
        const authHeader = response.headers['authorization'];
        let newToken = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            newToken = authHeader.substring(7);
        }

        if (newToken) {
          localStorage.setItem('token', newToken);

          // Update default header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Update original request
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

          processQueue(null, newToken);
          isRefreshing = false;

          return api(originalRequest);
        } else {
             throw new Error("No token found in refresh response");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (userData) => api.post('/api/auth/sign-up', userData),
  
  // Login returns the Promise so authSlice can handle the response data
  login: (credentials) => api.post('/genrate-token', credentials),
  
};

export default api;
