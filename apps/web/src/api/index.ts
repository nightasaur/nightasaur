// 前端 API 客戶端
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
    if (error.response?.status === 401) {
      // 處理未授權
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 用戶相關 API
export const userAPI = {
  // 註冊
  register: async (userData: {
    email: string;
    username: string;
    password: string;
  }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // 登入
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // 獲取當前用戶信息
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // 更新用戶信息
  updateProfile: async (userData: {
    username?: string;
    avatarUrl?: string;
    bio?: string;
  }) => {
    const response = await apiClient.put('/auth/profile', userData);
    return response.data;
  },

  // 登出
  logout: () => {
    localStorage.removeItem('token');
  },
};

// 精靈相關 API
export const spiritAPI = {
  // 獲取用戶的所有精靈
  getUserSpirits: async () => {
    const response = await apiClient.get('/spirits');
    return response.data;
  },

  // 獲取單個精靈
  getSpirit: async (id: string) => {
    const response = await apiClient.get(`/spirits/${id}`);
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

  // 更新精靈
  updateSpirit: async (id: string, spiritData: any) => {
    const response = await apiClient.put(`/spirits/${id}`, spiritData);
    return response.data;
  },

  // 刪除精靈
  deleteSpirit: async (id: string) => {
    const response = await apiClient.delete(`/spirits/${id}`);
    return response.data;
  },

  // 與精靈對話
  converseWithSpirit: async (spiritId: string, message: string) => {
    const response = await apiClient.post(`/spirits/${spiritId}/converse`, {
      message,
    });
    return response.data;
  },
};

// 物品相關 API
export const itemAPI = {
  // 獲取所有物品
  getAllItems: async () => {
    const response = await apiClient.get('/items');
    return response.data;
  },

  // 獲取用戶的物品
  getUserItems: async () => {
    const response = await apiClient.get('/items/user');
    return response.data;
  },

  // 購買物品
  purchaseItem: async (itemId: string, quantity: number = 1) => {
    const response = await apiClient.post('/items/purchase', {
      itemId,
      quantity,
    });
    return response.data;
  },

  // 使用物品
  useItem: async (userItemId: string, targetId?: string) => {
    const response = await apiClient.post('/items/use', {
      userItemId,
      targetId,
    });
    return response.data;
  },
};

// 任務相關 API
export const questAPI = {
  // 獲取所有任務
  getAllQuests: async () => {
    const response = await apiClient.get('/quests');
    return response.data;
  },

  // 獲取用戶的任務進度
  getUserQuests: async () => {
    const response = await apiClient.get('/quests/user');
    return response.data;
  },

  // 開始任務
  startQuest: async (questId: string) => {
    const response = await apiClient.post(`/quests/${questId}/start`);
    return response.data;
  },

  // 更新任務進度
  updateQuestProgress: async (questId: string, progress: number) => {
    const response = await apiClient.put(`/quests/${questId}/progress`, {
      progress,
    });
    return response.data;
  },

  // 完成任務
  completeQuest: async (questId: string) => {
    const response = await apiClient.post(`/quests/${questId}/complete`);
    return response.data;
  },

  // 領取任務獎勵
  claimQuestReward: async (questId: string) => {
    const response = await apiClient.post(`/quests/${questId}/claim`);
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

  // 更新用戶設定
  updateUserSettings: async (settings: {
    musicVolume?: number;
    soundVolume?: number;
    musicEnabled?: boolean;
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    vibrationStrength?: number;
  }) => {
    const response = await apiClient.put('/settings', settings);
    return response.data;
  },

  // 獲取語言設定
  getLanguageSettings: async () => {
    const response = await apiClient.get('/settings/language');
    return response.data;
  },

  // 更新語言設定
  updateLanguageSettings: async (settings: {
    primaryLang?: string;
    secondaryLang?: string;
    displayMode?: string;
    fontSize?: number;
    theme?: string;
    autoDetect?: boolean;
  }) => {
    const response = await apiClient.put('/settings/language', settings);
    return response.data;
  },
};

// 健康檢查
export const healthAPI = {
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'error', message: 'API 服務不可用' };
    }
  },
};

// 匯出所有 API
export default {
  user: userAPI,
  spirit: spiritAPI,
  item: itemAPI,
  quest: questAPI,
  settings: settingsAPI,
  health: healthAPI,
};