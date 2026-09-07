// 簡化的儀表板組件
import React from 'react';
import { useUser } from '../hooks/useApi';

function Dashboard() {
  const { user, loading, error, logout } = useUser();

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤: {error}</div>;
  if (!user) {
    return (
      <div>
        <h1>請登入</h1>
        <a href="/login">登入</a> | <a href="/register">註冊</a>
      </div>
    );
  }

  return (
    <div>
      <h1>歡迎，{user.username}！</h1>
      <p>等級: {user.trainerLevel}</p>
      <p>寶石: {user.gems}</p>
      <p>金幣: {user.coins}</p>
      <button onClick={logout}>登出</button>
      
      <div>
        <h2>快速連結</h2>
        <a href="/spirits">我的精靈</a>
        <a href="/quests">任務</a>
        <a href="/shop">商店</a>
        <a href="/settings">設定</a>
      </div>
    </div>
  );
}

export default Dashboard;