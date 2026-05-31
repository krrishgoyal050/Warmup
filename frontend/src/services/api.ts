import axios from 'axios';

// Vite dev server handles proxying of '/api' to 'http://localhost:8080/api'
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to append Authorization Token
apiClient.interceptors.request.use(
  async (config) => {
    // Attempt to load token from localStorage (set by AuthContext)
    const token = localStorage.getItem('travel_planner_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for uniform error parsing
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.error || error.message || 'API request failed';
    console.error('[API CLIENT ERROR]', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

export default apiClient;
