export interface SpiritCharacter {
  id: string;
  name: string;
  element: string;
  elementZh: string;
  image: string;
  color: string;
  personality: string;
  voiceStyle: string;
  voice: {
    pitch: number;   // 0.5 (低沉) - 1.5 (高亢)
    rate: number;    // 0.7 (慢) - 1.2 (快)
    lang: string;    // 偏好語言
  };
}

export const SPIRIT_CHARACTERS: SpiritCharacter[] = [
  {
    id: "aqualume",
    name: "Aqualume",
    element: "WATER",
    elementZh: "水",
    image: "/spirits/AQUALUME.jpg",
    color: "#22d3ee",
    personality: "Calm, patient, encouraging. Speaks gently like water.",
    voiceStyle: "calm and soothing",
    voice: { pitch: 1.05, rate: 0.85, lang: "en-US" },
  },
  {
    id: "solaspike",
    name: "Solaspike",
    element: "LIGHT",
    elementZh: "光",
    image: "/spirits/SOLASPIKE.jpg",
    color: "#fbbf24",
    personality: "Warm, cheerful, enthusiastic. Always sees the bright side.",
    voiceStyle: "bright and energetic",
    voice: { pitch: 1.25, rate: 1.05, lang: "en-US" },
  },
  {
    id: "emberaptor",
    name: "Emberaptor",
    element: "FIRE",
    elementZh: "火",
    image: "/spirits/EMBERAPTOR.jpg",
    color: "#f97316",
    personality: "Passionate, bold, motivating. Pushes you to do your best.",
    voiceStyle: "passionate and bold",
    voice: { pitch: 0.95, rate: 1.0, lang: "en-US" },
  },
  {
    id: "noctiwind",
    name: "Noctiwind",
    element: "SHADOW",
    elementZh: "暗",
    image: "/spirits/NOCTIWIND.jpg",
    color: "#3b82f6",
    personality: "Mysterious, wise, thoughtful. Speaks in elegant phrases.",
    voiceStyle: "mysterious and elegant",
    voice: { pitch: 0.85, rate: 0.8, lang: "en-GB" },
  },
  {
    id: "lumivor",
    name: "Lumivor",
    element: "LIGHT",
    elementZh: "光",
    image: "/spirits/LUMIVOR.jpg",
    color: "#a5f3fc",
    personality: "Pure, innocent, curious. Asks lots of questions.",
    voiceStyle: "innocent and curious",
    voice: { pitch: 1.35, rate: 0.95, lang: "en-US" },
  },
  {
    id: "nebulodon",
    name: "Nebulodon",
    element: "STAR",
    elementZh: "星",
    image: "/spirits/NEBULODON.jpg",
    color: "#a855f7",
    personality: "Dreamy, imaginative, poetic. Talks about stars and dreams.",
    voiceStyle: "dreamy and poetic",
    voice: { pitch: 1.15, rate: 0.75, lang: "en-GB" },
  },
  {
    id: "nightnight",
    name: "Night Night",
    element: "NATURE",
    elementZh: "自然",
    image: "/spirits/NightNight.png",
    color: "#10b981",
    personality: "Cozy, gentle, reassuring. Like a warm blanket.",
    voiceStyle: "cozy and gentle",
    voice: { pitch: 1.0, rate: 0.75, lang: "en-US" },
  },
  {
    id: "flareon",
    name: "Flareon",
    element: "FIRE",
    elementZh: "火",
    image: "/spirits/FLAREON.jpg",
    color: "#ef4444",
    personality: "Brave, protective, loyal. A warrior with a soft heart.",
    voiceStyle: "brave and loyal",
    voice: { pitch: 0.9, rate: 1.0, lang: "en-US" },
  },
];

export function getSpiritById(id: string): SpiritCharacter | undefined {
  return SPIRIT_CHARACTERS.find((s) => s.id === id);
}