import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { spiritsAPI } from "../services/api";

const ELEMENTS = [
  { v: "FIRE", l: "🔥 火" }, { v: "WATER", l: "💧 水" },
  { v: "LIGHT", l: "✨ 光" }, { v: "SHADOW", l: "🌑 暗" },
  { v: "STAR", l: "⭐ 星" }, { v: "ILLUSION", l: "🦊 幻" },
  { v: "MOON", l: "🌙 月" }, { v: "NATURE", l: "🌿 自然" },
  { v: "THUNDER", l: "⚡ 雷" }, { v: "ICE", l: "❄️ 冰" },
];

export default function CreateSpiritScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [element, setElement] = useState("");
  const [personality, setPersonality] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!element) { setError("請選擇屬性！"); return; }
    setLoading(true); setError("");
    try {
      const res = await spiritsAPI.create({ name: name || "未命名", element, personality });
      navigation.replace("SpiritDetail", { id: res.id });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.title}>孵化你的精靈 🥚</Text>
      <Text style={s.sub}>AI 將為你生成獨特精靈</Text>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Text style={s.label}>精靈名字</Text>
      <TextInput style={s.input} placeholder="取名..." placeholderTextColor="#555" value={name} onChangeText={setName} />

      <Text style={s.label}>選擇屬性</Text>
      <View style={s.grid}>
        {ELEMENTS.map((el) => (
          <TouchableOpacity key={el.v} style={[s.elemBtn, element === el.v && s.elemActive]} onPress={() => setElement(el.v)}>
            <Text style={s.elemText}>{el.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>性格（選填）</Text>
      <TextInput style={s.input} placeholder="例：勇敢、溫柔、神秘..." placeholderTextColor="#555" value={personality} onChangeText={setPersonality} />

      <TouchableOpacity style={s.btn} onPress={create} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>🥚 孵化！</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1a" },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", marginBottom: 4 },
  sub: { fontSize: 14, color: "#666", marginBottom: 24 },
  error: { color: "#f87171", marginBottom: 16, textAlign: "center" },
  label: { fontSize: 14, color: "#888", marginBottom: 8, marginTop: 16 },
  input: { padding: 14, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  elemBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  elemActive: { backgroundColor: "rgba(124,58,237,0.2)", borderColor: "#7c3aed" },
  elemText: { color: "#ccc", fontSize: 14 },
  btn: { marginTop: 32, padding: 16, borderRadius: 12, backgroundColor: "#7c3aed", alignItems: "center" },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});