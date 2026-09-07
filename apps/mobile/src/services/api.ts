export const API_BASE = "http://192.168.0.83:3000/api"; // 本機開發 IP

import AsyncStorage from "@react-native-async-storage/async-storage";

// Token 管理
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("nightasaur_token");
}

export async function setToken(token: string) {
  await AsyncStorage.setItem("nightasaur_token", token);
}

export async function removeToken() {
  await AsyncStorage.removeItem("nightasaur_token");
}

// 基礎請求
async function request(method: string, path: string, body?: any) {
  const token = await getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    request("POST", "/auth/login", { email, password }),
  register: (email: string, username: string, password: string) =>
    request("POST", "/auth/register", { email, username, password }),
  me: () => request("GET", "/auth/me"),
};

// Spirits API
export const spiritsAPI = {
  list: () => request("GET", "/spirits"),
  getById: (id: string) => request("GET", `/spirits/${id}`),
  create: (data: { name: string; element: string; personality?: string }) =>
    request("POST", "/spirits", data),
  evolve: (id: string) => request("POST", `/spirits/${id}/evolve`),
};

// Dialogue API
export const dialogueAPI = {
  chat: (spiritId: string, message: string) =>
    request("POST", "/dialogue", { spiritId, message }),
};