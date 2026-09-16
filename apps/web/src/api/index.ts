// 前端 API 客戶端 - 簡化版本
import axios from 'axios';

// API 基礎 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒超時
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nightasaur_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 處理未授權
    if (error.response?.status === 401) {
      localStorage.removeItem('nightasaur_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 健康檢查 API
export const healthAPI = {
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error: any) {
      // 如果網絡錯誤，返回 fallback 狀態
      if (!error.response) {
        return {
          status: 'offline',
          message: '伺服器離線，使用本地模式',
          timestamp: new Date().toISOString(),
          service: 'Nightasaur (Local Fallback)',
          version: '1.0.0-local',
        };
      }
      throw error;
    }
  },
};

// 用戶相關 API
export const userAPI = {
  // 註冊
  register: async (userData: { email: string; username: string; password: string }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // 登入
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('nightasaur_token', response.data.token);
    }
    return response.data;
  },

  // 獲取當前用戶信息
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // 更新用戶信息
  updateProfile: async (userData: { username?: string; avatarUrl?: string; bio?: string }) => {
    const response = await apiClient.put('/auth/profile', userData);
    return response.data;
  },

  // 登出
  logout: () => {
    localStorage.removeItem('nightasaur_token');
  },
};

// 精靈相關 API
export const spiritAPI = {
  // 獲取用戶的所有精靈
  getUserSpirits: async () => {
    const response = await apiClient.get('/spirits');
    return response.data;
  },

  // 創建精靈
  createSpirit: async (spiritData: {
    name: string;
    element: string;
    species?: string;
    personality?: string;
    appearance?: string;
  }) => {
    const response = await apiClient.post('/spirits', spiritData);
    return response.data;
  },
};

// 設定相關 API
export const settingsAPI = {
  // 獲取用戶設定
  getUserSettings: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },
};

// 匯出所有 API
export default {
  user: userAPI,
  spirit: spiritAPI,
  settings: settingsAPI,
  health: healthAPI,
};