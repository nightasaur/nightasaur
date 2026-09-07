// React Hook 用於 API 調用
import { useState, useEffect, useCallback } from 'react';
import api, { userAPI, spiritAPI, itemAPI, questAPI, settingsAPI, healthAPI } from '../api';

// 使用狀態的類型
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 初始狀態
const initialApiState = {
  data: null,
  loading: false,
  error: null,
};

// 自定義 Hook: 使用 API 數據
export function useApi<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  autoFetch: boolean = true
) {
  const [state, setState] = useState<ApiState<T>>(initialApiState);

  const fetchData = useCallback(async () => {
    setState({ ...initialApiState, loading: true });
    try {
      const data = await fetchFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '發生未知錯誤';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [fetchFunction]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, dependencies);

  // Hook: 使用用戶數據
export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await userAPI.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error: any) {
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await userAPI.login({ email, password });
      await fetchUser();
      return result;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  const logout = useCallback(() => {
    userAPI.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profileData: any) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await userAPI.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    updateProfile,
    refetch: fetchUser,
    isAuthenticated: !!user,
  };
}