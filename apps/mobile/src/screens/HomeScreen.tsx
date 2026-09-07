import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { spiritsAPI, removeToken } from "../services/api";

const EMOJI: Record<string, string> = { FIRE: "🔥", WATER: "💧", SHADOW: "🌑", STAR: "⭐", MOON: "🌙", LIGHT: "✨", ILLUSION: "🦊", NATURE: "🌿", THUNDER: "⚡", ICE: "❄️" };

export default function HomeScreen({ navigation }: any) {
  const [spirits, setSpirits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    spiritsAPI.list().then(setSpirits).catch(console.error).finally(() => setLoading(false));
  }, []));

  const logout = async () => { await removeToken(); navigation.reset({ index: 0, routes: [{ name: "Login" }] }); };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>我的精靈小隊</Text>
        <TouchableOpacity onPress={logout}><Text style={s.logout}>登出</Text></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#a855f7" size="large" style={{ marginTop: 80 }} /> : spirits.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 64 }}>🥚</Text>
          <Text style={{ color: "#666", marginTop: 12 }}>還沒有精靈！</Text>
        </View>
      ) : (
        <FlatList
          data={spirits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => navigation.navigate("SpiritDetail", { id: item.id })}>
              <Text style={s.emoji}>{EMOJI[item.element] || "✨"}</Text>
              <View style={s.cardInfo}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.meta}>Lv.{item.level} · {item.stage}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate("CreateSpirit")}>
        <Text style={{ color: "#fff", fontSize: 28 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0a0a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "900", color: "#fff" },
  logout: { color: "#666", fontSize: 14 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { flexDirection: "row", alignItems: "center", padding: 16, marginBottom: 8, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  emoji: { fontSize: 48, marginRight: 16 },
  cardInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: "700", color: "#fff" },
  meta: { fontSize: 13, color: "#666", marginTop: 2 },
  fab: { position: "absolute", bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3 },
});