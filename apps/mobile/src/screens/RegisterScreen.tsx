import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { authAPI, setToken } from "../services/api";

export default function RegisterScreen({ navigation, onRegister }: any) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setLoading(true); setError("");
    try {
      const res = await authAPI.register(email, username, password);
      await setToken(res.token);
      onRegister();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Text style={s.emoji}>🥚</Text>
      <Text style={s.title}>孵化你的精靈</Text>
      <Text style={s.sub}>註冊即可生成專屬 AI 精靈！</Text>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TextInput style={s.input} placeholder="Email" placeholderTextColor="#666"
        value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={s.input} placeholder="使用者名稱" placeholderTextColor="#666"
        value={username} onChangeText={setUsername} />
      <TextInput style={s.input} placeholder="密碼 (至少 8 字)" placeholderTextColor="#666"
        value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>孵化精靈 🥚</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.link}>← 返回登入</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#0a0a1a" },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "900", color: "#a855f7", marginBottom: 4 },
  sub: { fontSize: 14, color: "#666", marginBottom: 32 },
  error: { color: "#f87171", marginBottom: 16, textAlign: "center" },
  input: { width: "100%", padding: 16, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", marginBottom: 12, fontSize: 16 },
  btn: { width: "100%", padding: 16, borderRadius: 12, backgroundColor: "#7c3aed", alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  link: { color: "#a78bfa", marginTop: 24, fontSize: 14 },
});