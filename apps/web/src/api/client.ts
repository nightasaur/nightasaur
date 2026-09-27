import axios from "axios";
import { clearRejectedSession } from "../utils/authSession";

// Production always uses the same-origin /api proxy so the browser does not depend
// on a stale VITE_API_URL or cross-origin CORS configuration.
const getApiBaseUrl = () => {
   const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured;
  if (import.meta.env.DEV) return 'http://localhost:3002/api';
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nightasaur_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isCredentialRequest = ["/auth/login", "/auth/register"].includes(error.config?.url || "");
    if (error.response?.status === 401 && !isCredentialRequest) {
      clearRejectedSession(error.config?.headers?.Authorization);
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data, { timeout: 45000 }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me", { timeout: 30000 }),
};

export const spiritsAPI = {
  create: (data: { name: string; element: string; personality?: string; appearance?: string }) =>
    api.post("/spirits", data),
  list: () => api.get("/spirits"),
  getById: (id: string) => api.get(`/spirits/${id}`),
  evolve: (id: string) => api.post(`/spirits/${id}/evolve`),
  rename: (id: string, name: string) => api.patch(`/spirits/${id}/rename`, { name }),
  delete: (id: string) => api.delete(`/spirits/${id}`),
  updateCustomization: (id: string, customization: any) =>
    api.patch(`/spirits/${id}/customization`, { customization }),

  // Memory management
  listMemories: (id: string, limit = 100) =>
    api.get(`/spirits/${id}/memories`, { params: { limit } }),
  deleteMemory: (id: string, memoryId: string) =>
    api.delete(`/spirits/${id}/memories/${memoryId}`),
};

export interface SpiritMemory {
  id: string;
  content: string;
  category: "fact" | "preference" | "event" | "relationship" | "goal";
  importance: number;
  createdAt: string;
  lastUsedAt: string | null;
}

export const dialogueAPI = {
  chat: (spiritId: string, message: string) =>
    // The backend permits 120s for inference; leave time for the proxy response.
    api.post("/dialogue", { spiritId, message }, { timeout: 36000 }),
};

export const socialAPI = {
  createPost: (data: any) => api.post("/social/posts", data),
  publishPost: (id: string) => api.post(`/social/posts/${id}/publish`),
  getUserPosts: () => api.get("/social/posts"),
  getAllPosts: () => api.get("/social/posts/admin/posts"),
};

// Backend AI requests have a 60-second deadline; allow time for the proxy response.
export const assistantAPI = {
  chat: (message: string, history: { role: string; content: string }[] = []) =>
    api.post("/assistant/chat", { message, history }, { timeout: 75000 }),
  code: (code: string, language: string, task: string = "explain") =>
    api.post("/assistant/code", { code, language, task }, { timeout: 75000 }),
  translate: (text: string, targetLang: string = "zh-TW", sourceLang: string = "auto") =>
    api.post("/assistant/translate", { text, source_lang: sourceLang, target_lang: targetLang }, { timeout: 75000 }),
  document: (content: string, task: string = "summarize", docType: string = "text") =>
    api.post("/assistant/document", { content, task, doc_type: docType }, { timeout: 75000 }),
};

export const battleAPI = {
  encounter: (spiritId: string) => api.get(`/battle/encounter/${spiritId}`),
  action: (player: any, enemy: any, action: { type: string }) =>
    api.post("/battle/action", { player, enemy, action }),
};

export const languageAPI = {
  getUserPreference: () => api.get("/language/preference"),
  updatePreference: (data: any) => api.put("/language/preference", data),
  autoDetect: () => api.post("/language/auto-detect"),
  getTranslation: (module: string, key: string, language?: string) =>
    api.get(`/language/translation/${module}/${key}`, { params: { language } }),
  getBatchTranslations: (module: string, keys: string[], language?: string) =>
    api.post(`/language/translations/${module}/batch`, { keys, language }),
  getInterfaceTranslations: (language?: string) =>
    api.get("/language/interface-translations", { params: { language } }),
  getSettingsMenu: () => api.get("/language/settings-menu"),
  resetSettings: () => api.post("/language/reset"),
};

export const userAPI = {
  register: async (userData: { email: string; username: string; password: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('nightasaur_token', response.data.token);
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (userData: { username?: string; avatarUrl?: string; bio?: string }) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('nightasaur_token');
  },
};

export const generationAPI = {
  get: (id: string) => api.get(`/generate/spirit/${id}`),
  generate: (id: string) => api.post(`/generate/spirit/${id}`, {}, {timeout: 45000}),
};

export const adminAccountsAPI = {
 list: (params: {q:string;status:string;page:number}) => api.get("/admin/accounts",{params}),
 action: (id:string,data:{action:"BAN"|"RESTORE"|"REVOKE_SESSIONS";reason:string}) => api.post(`/admin/accounts/${encodeURIComponent(id)}/actions`,data),
 history: (id:string) => api.get(`/admin/accounts/${encodeURIComponent(id)}/history`),
};
