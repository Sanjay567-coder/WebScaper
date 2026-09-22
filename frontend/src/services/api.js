import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

export const dashboardApi = {
  getMetrics: async () => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};

export const tasksApi = {
  getTasks: async (params = {}) => {
    const res = await apiClient.get('/tasks', { params });
    return res.data;
  },
  getTask: async (id) => {
    const res = await apiClient.get(`/tasks/${id}`);
    return res.data;
  },
  createTask: async (taskData) => {
    const res = await apiClient.post('/tasks', taskData);
    return res.data;
  },
  updateTask: async (id, taskData) => {
    const res = await apiClient.put(`/tasks/${id}`, taskData);
    return res.data;
  },
  deleteTask: async (id) => {
    const res = await apiClient.delete(`/tasks/${id}`);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await apiClient.patch(`/tasks/${id}/status`, { status });
    return res.data;
  },
  testScrapeAdHoc: async (testData) => {
    const res = await apiClient.post('/tasks/test', testData);
    return res.data;
  },
  testScrapeTask: async (id, limit = 5) => {
    const res = await apiClient.post(`/tasks/${id}/test?limit=${limit}`);
    return res.data;
  },
  runTaskNow: async (id) => {
    const res = await apiClient.post(`/tasks/${id}/run`);
    return res.data;
  },
  getTaskRuns: async (id, params = {}) => {
    const res = await apiClient.get(`/tasks/${id}/runs`, { params });
    return res.data;
  },
};

export const dataApi = {
  getRecords: async (params = {}) => {
    const res = await apiClient.get('/data', { params });
    return res.data;
  },
  getRecord: async (id) => {
    const res = await apiClient.get(`/data/${id}`);
    return res.data;
  },
  deleteRecord: async (id) => {
    const res = await apiClient.delete(`/data/${id}`);
    return res.data;
  },
};

export const runsApi = {
  getRuns: async (params = {}) => {
    const res = await apiClient.get('/runs', { params });
    return res.data;
  },
  getRun: async (id) => {
    const res = await apiClient.get(`/runs/${id}`);
    return res.data;
  },
};

export const settingsApi = {
  getSettings: async () => {
    const res = await apiClient.get('/settings');
    return res.data;
  },
  updateProfile: async (profileData) => {
    const res = await apiClient.put('/settings/profile', profileData);
    return res.data;
  },
  getSystemHealth: async () => {
    const res = await apiClient.get('/system/health');
    return res.data;
  },
};

export default apiClient;
