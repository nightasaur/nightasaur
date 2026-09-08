// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * IELTS 雅思閱讀文章題庫
 * 原創雅思風格短文 + 閱讀理解題
 */

export interface IeltsArticle {
  id: string;
  title: string;
  titleZH: string;
  content: string;
  contentZH: string;
  questions: IeltsReadingQuestion[];
  topic: string;
  band: number;
}

export interface IeltsReadingQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  questionType: "main-idea" | "detail" | "vocabulary" | "inference";
}

export const IELTS_ARTICLES: IeltsArticle[] = [
  {
    id: "env-1", title: "The Rise of Renewable Energy",
    titleZH: "可再生能源的崛起",
    content: `The global energy landscape is transforming. Renewable sources like solar and wind power generated 30% of global electricity in 2023, expected to reach 50% by 2030. Solar panel costs have fallen 80% in a decade. However, energy storage remains a challenge since renewables are intermittent. Grid infrastructure also needs upgrading. Despite these issues, the benefits include reduced emissions and energy independence.`,
    contentZH: `全球能源格局正在轉型。太陽能和風能等可再生能源在2023年發電佔比達30%，預計2030年達50%。太陽能板成本在十年間下降了80%。然而，由於可再生能源具有間歇性，能源儲存仍是挑戰。電網基礎設施也需要升級。儘管有這些問題，好處包括減少排放和能源獨立。`,
    topic: "environment", band: 7,
    questions: [
      { question: "What share of electricity did renewables provide in 2023?", options: ["10%", "20%", "30%", "50%"], answer: 2, explanation: "文中提到可再生能源佔2023年發電量30%", questionType: "detail" },
      { question: "The word 'intermittent' (line 5) most nearly means?", options: ["持續的", "間歇的", "強大的", "稀有的"], answer: 1, explanation: "intermittent = 間歇的，不持續的", questionType: "vocabulary" },
      { question: "What is a benefit mentioned for renewable energy?", options: ["更高成本", "更依賴進口", "減少排放", "間歇性"], answer: 2, explanation: "好處包括減少碳排放和能源獨立", questionType: "detail" },
      { question: "What is the main idea of this passage?", options: ["化石燃料最好", "可再生能源有前景但也有挑戰", "儲存技術完美", "太陽能太貴"], answer: 1, explanation: "文章主要討論可再生能源的發展和挑戰", questionType: "main-idea" },
    ],
  },
];
// 更多文章
  {
    id: "ai-health-1", title: "AI in Healthcare",
    titleZH: "人工智慧與醫療",
    content: `AI is transforming healthcare through improved diagnostics and drug discovery. Deep learning can identify cancers earlier than humans. In breast cancer screening, AI reduces false positives by 30%, avoiding unnecessary biopsies. For drug development, AI analyzes molecular data to find candidates faster than traditional methods. However, concerns about data privacy, algorithmic bias, and the doctor-patient relationship remain. The future likely involves AI augmenting, not replacing, human doctors.`,
    contentZH: `AI正通過改善診斷和藥物發現來改變醫療。深度學習能比人類更早識別癌症。在乳癌篩查中，AI可將偽陽性降低30%，避免不必要的切片檢查。在藥物開發方面，AI分析分子數據，比傳統方法更快找到候選藥物。然而，數據隱私、演算法偏見和醫病關係的擔憂仍然存在。未來AI很可能增強而不是取代醫生的能力。`,
    topic: "health", band: 8,
    questions: [
      { question: "How much can AI reduce false positives in breast cancer screening?", options: ["10%", "20%", "30%", "50%"], answer: 2, explanation: "AI reduces false positives by up to 30%", questionType: "detail" },
      { question: "What is 'algorithmic bias' (line 6) concerned with?", options: ["演算法偏見", "演算法速度", "資料儲存", "醫療成本"], answer: 0, explanation: "algorithmic bias = 演算法偏見", questionType: "vocabulary" },
      { question: "What is the author's view on AI replacing doctors?", options: ["It will happen soon", "AI will replace most doctors", "AI will augment doctors", "AI is too dangerous"], answer: 2, explanation: "AI will augment, not replace doctors", questionType: "inference" },
    ],
  },
  {
    id: "edu-1", title: "Online Learning Revolution",
    titleZH: "線上學習革命",
    content: `Online education has experienced explosive growth, accelerated by recent global events. MOOCs (Massive Open Online Courses) now reach millions worldwide. Research shows that blended learning combining online and face-to-face instruction often outperforms purely traditional methods. However, the digital divide remains a critical issue — many students lack internet access or suitable devices. Successful online learning also requires strong self-motivation and time management skills.`,
    contentZH: `線上教育經歷了爆炸性增長，受到近期全球事件的加速。大型開放式線上課程（MOOC）現在觸及全球數百萬人。研究顯示，結合線上和面對面教學的混合式學習通常優於純傳統方法。然而，數位鴻溝仍然是一個關鍵問題——許多學生缺乏網路連接或合適的設備。成功的線上學習也需要強大的自我動力和時間管理能力。`,
    topic: "education", band: 7,
    questions: [
      { question: "What is 'blended learning' described as?", options: ["純線上學習", "純面對面", "線上+面對面結合", "自學"], answer: 2, explanation: "blended learning = 混合式學習，線上+面對面", questionType: "detail" },
      { question: "What is a key challenge mentioned for online learning?", options: ["老師不夠", "數位鴻溝", "費用太貴", "考試太難"], answer: 1, explanation: "digital divide (數位鴻溝) 是關鍵問題", questionType: "detail" },
      { question: "What skills does successful online learning require?", options: ["語言能力", "自我動力和時間管理", "程式設計", "繪畫技巧"], answer: 1, explanation: "需要強大的自我動力和時間管理能力", questionType: "detail" },
    ],
  },
  {
    id: "society-1", title: "Urbanization and Its Effects",
    titleZH: "都市化及其影響",
    content: `More than half of the world's population now lives in cities, and this proportion is growing. Urbanization brings economic opportunities, better access to services, and cultural exchange. However, rapid urban growth also creates problems: housing shortages, traffic congestion, pollution, and strain on infrastructure. Sustainable urban planning is essential to maximize benefits while minimizing negative impacts. Green spaces, efficient public transport, and affordable housing are key priorities for modern cities.`,
    contentZH: `全球超過一半人口現在居住在城市，且比例持續增長。都市化帶來經濟機會、更好的服務獲取和文化交流。然而，快速的城市增長也帶來了問題：住房短缺、交通擁堵、污染和基礎設施壓力。永續城市規劃對於最大化好處同時最小化負面影響至關重要。綠地、高效的公共交通和可負擔的住房是現代城市的關鍵優先事項。`,
    topic: "society", band: 7,
    questions: [
      { question: "What percentage of people now live in cities?", options: ["不到一半", "超過一半", "幾乎全部", "三分之一"], answer: 1, explanation: "超過一半人口現在居住在城市", questionType: "detail" },
      { question: "Which is NOT mentioned as a problem from urbanization?", options: ["住房短缺", "交通擁堵", "糧食過剩", "基礎設施壓力"], answer: 2, explanation: "糧食過剩 (food surplus) 未被提及", questionType: "detail" },
      { question: "What does 'strain on infrastructure' (line 5) imply?", options: ["基礎設施壓力大", "基礎設施新", "基礎設施便宜", "基礎設施美觀"], answer: 0, explanation: "strain on infrastructure = 基礎設施壓力", questionType: "vocabulary" },
    ],
  },
  {
    id: "eco-1", title: "Global Trade in the Digital Age",
    titleZH: "數位時代的全球貿易",
    content: `International trade has been reshaped by digital technologies. E-commerce allows even small businesses to reach customers worldwide. Digital services like cloud computing and streaming now account for a growing share of trade. However, data protection regulations differ between countries, creating barriers. The rise of protectionist policies in some nations threatens the free flow of goods and services. Finding a balance between open trade and national interests remains a key challenge.`,
    contentZH: `國際貿易已被數位科技重新塑造。電子商務讓即使是小型企業也能觸及全球客戶。雲端運算和串流等數位服務現在佔貿易的比重越來越大。然而，各國的數據保護法規不同，形成了障礙。一些國家保護主義政策的興起威脅了商品和服務的自由流通。在開放貿易和國家利益之間找到平衡仍然是一個關鍵挑戰。`,
    topic: "economy", band: 7,
    questions: [
      { question: "How have digital technologies affected small businesses?", options: ["讓它們倒閉", "讓它們能接觸全球客戶", "沒有影響", "只影響大公司"], answer: 1, explanation: "e-commerce helps small businesses reach global customers", questionType: "detail" },
      { question: "What creates barriers in digital trade?", options: ["語言", "運費", "數據保護法規差異", "天氣"], answer: 2, explanation: "不同國家的data protection regulations不同", questionType: "detail" },
      { question: "What does 'protectionist policies' (line 6) refer to?", options: ["環保政策", "保護主義政策", "教育政策", "健康政策"], answer: 1, explanation: "protectionist policies = 保護主義政策", questionType: "vocabulary" },
    ],
  },
];