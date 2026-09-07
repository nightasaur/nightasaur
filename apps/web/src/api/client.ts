import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Token 攔截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nightasaur_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth API
export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// Spirits API
export const spiritsAPI = {
  create: (data: { name: string; element: string; personality?: string; appearance?: string }) =>
    api.post("/spirits", data),
  list: () => api.get("/spirits"),
  getById: (id: string) => api.get(`/spirits/${id}`),
  evolve: (id: string) => api.post(`/spirits/${id}/evolve`),
  rename: (id: string, name: string) => api.patch(`/spirits/${id}/rename`, { name }),
  updateCustomization: (id: string, customization: any) => 
    api.patch(`/spirits/${id}/customization`, { customization }),
};

// Dialogue API
export const dialogueAPI = {
  chat: (spiritId: string, message: string) =>
    api.post("/dialogue", { spiritId, message }),
};

// Social API
export const socialAPI = {
  createPost: (data: any) => api.post("/social/posts", data),
  publishPost: (id: string) => api.post(`/social/posts/${id}/publish`),
  getUserPosts: () => api.get("/social/posts"),
  getAllPosts: () => api.get("/social/posts/admin/posts"),
};

// Language API
export const languageAPI = {
  getUserPreference: () => api.get("/language/preference"),
  updatePreference: (data: any) => api.patch("/language/preference", data),
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