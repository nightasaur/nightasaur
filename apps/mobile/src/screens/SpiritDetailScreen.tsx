import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { spiritsAPI, dialogueAPI } from "../services/api";

const EMOJI: Record<string, string> = { FIRE: "🔥", WATER: "💧", SHADOW: "🌑", STAR: "⭐", MOON: "🌙", LIGHT: "✨", ILLUSION: "🦊", NATURE: "🌿", THUNDER: "⚡", ICE: "❄️" };

export default function SpiritDetailScreen({ route }: any) {
  const { id } = route.params;
  const [spirit, setSpirit] = useState<any>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    spiritsAPI.getById(id).then((data) => {
      setSpirit(data);
      const history = (data.conversations || []).slice().reverse().flatMap((c: any) => [
        { role: "user", content: c.userMessage },
        { role: "spirit", content: c.aiResponse },
      ]);
      setMessages(history);
    }).catch(console.error);
  }, [id]);

  const send = async () => {
    if (!input.trim()) return;
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    const msg = input;
    setInput("");
    try {
      const res = await dialogueAPI.chat(id, msg);
      setMessages((prev) => [...prev, { role: "spirit", content: res.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: "spirit", content: "通訊中斷 🥺" }]);
    } finally { setSending(false); }
  };

  if (!spirit) return null;
  const emoji = EMOJI[spirit.element] || "✨";

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View style={s.infoBar}>
        <Text style={s.emoji}>{emoji}</Text>
        <View>
          <Text style={s.name}>{spirit.name}</Text>
          <Text style={s.stage}>{spirit.stage} · Lv.{spirit.level}</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        style={s.chatList}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === "user" ? s.userBubble : s.spiritBubble]}>
            {item.role === "spirit" && <Text style={{ marginRight: 4 }}>{emoji}</Text>}
            <Text style={[s.bubbleText, item.role === "user" ? s.userText : s.spiritText]}>{item.content}</Text>
          </View>
        )}
      />

      <View style={s.inputRow}>
        <TextInput style={s.input} placeholder={`跟 ${spirit.name} 說點什麼...`} placeholderTextColor="#555"
          value={input} onChangeText={setInput} />
        <TouchableOpacity style={s.sendBtn} onPress={send} disabled={sending}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>送出</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1a" },
  infoBar: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "rgba(255,255,255,0.03)", borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  emoji: { fontSize: 40, marginRight: 12 },
  name: { fontSize: 20, fontWeight: "900", color: "#fff" },
  stage: { fontSize: 13, color: "#666" },
  chatList: { flex: 1, padding: 12 },
  bubble: { flexDirection: "row", maxWidth: "80%", padding: 10, borderRadius: 16, marginBottom: 8 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#7c3aed", borderBottomRightRadius: 4 },
  spiritBubble: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.08)", borderBottomLeftRadius: 4 },
  userText: { color: "#fff" },
  spiritText: { color: "#ddd" },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  inputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center" },
  input: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", marginRight: 8 },
  sendBtn: { padding: 12, borderRadius: 10, backgroundColor: "#7c3aed" },
});