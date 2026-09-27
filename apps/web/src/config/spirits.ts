export interface SpiritCharacter {
  id: string;
  name: string;
  element: string;
  elementZh: string;
  image: string;
  color: string;
  personality: string;
  voiceStyle: string;
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
  },
];

export function getSpiritById(id: string): SpiritCharacter | undefined {
  return SPIRIT_CHARACTERS.find((s) => s.id === id);
}