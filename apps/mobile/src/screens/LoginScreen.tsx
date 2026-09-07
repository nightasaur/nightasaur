import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { authAPI, setToken, API_BASE } from "../services/api";

export default function LoginScreen({ navigation, onLogin }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");

  const handleLogin = async () => {
    setLoading(true); setError(""); setDebug("");
    try {
      setDebug(`Connecting to ${API_BASE}/auth/login...`);
      const res = await authAPI.login(email, password);
      setDebug(`✅ Login OK: ${res.user?.username}`);
      await setToken(res.token);
      onLogin();
    } catch (e: any) {
      setDebug(`❌ Error: ${e.message}`);
      setError(e.message || "登入失敗");
    } finally { setLoading(false); }
  };

  const quickCreate = async () => {
    const randEmail = `test${Date.now()}@night.com`;
    const randName = `訓練家${Math.floor(Math.random() * 9999)}`;
    setLoading(true); setError(""); setDebug("");
    try {
      setDebug(`Creating account: ${randEmail}`);
      const res = await authAPI.register(randEmail, randName, "test1234");
      setDebug(`✅ Created! Token: ${res.token?.slice(0,20)}...`);
      await setToken(res.token);
      onLogin();
    } catch (e: any) {
      setDebug(`❌ Create failed: ${e.message}`);
      setError(e.message || "註冊失敗");
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Text style={s.emoji}>🌙🦕</Text>
      <Text style={s.title}>Nightasaur</Text>
      <Text style={s.sub}>AI 數位精靈平台</Text>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {debug ? <Text style={s.debug}>{debug}</Text> : null}

      <TextInput style={s.input} placeholder="Email" placeholderTextColor="#666"
        value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} />
      <TextInput style={s.input} placeholder="密碼" placeholderTextColor="#666"
        value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>登入</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={s.link}>還沒有帳號？註冊 →</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, width: '100%' }}>
        <Text style={{ color: '#888', textAlign: 'center', marginBottom: 8, fontSize: 12 }}>或直接快速開始</Text>
        <TouchableOpacity style={s.quickBtn} onPress={quickCreate} disabled={loading}>
          <Text style={s.quickBtnText}>⚡ 一鍵創建帳號</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#0a0a1a" },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 36, fontWeight: "900", color: "#a855f7", marginBottom: 4 },
  sub: { fontSize: 16, color: "#666", marginBottom: 24 },
  error: { color: "#f87171", marginBottom: 8, textAlign: "center", fontSize: 13 },
  debug: { color: "#fbbf24", marginBottom: 12, textAlign: "center", fontSize: 11, backgroundColor: "rgba(251,191,36,0.1)", padding: 8, borderRadius: 8, width: "100%" },
  input: { width: "100%", padding: 16, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", marginBottom: 12, fontSize: 16 },
  btn: { width: "100%", padding: 16, borderRadius: 12, backgroundColor: "#7c3aed", alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  link: { color: "#a78bfa", marginTop: 24, fontSize: 14 },
  quickBtn: { width: "100%", padding: 14, borderRadius: 12, backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", alignItems: "center" },
  quickBtnText: { color: "#10b981", fontSize: 16, fontWeight: "700" },
});