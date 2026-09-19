import axios from "axios";
import { resolveApiBaseUrl } from "../config/apiBaseUrl";

declare const __NIGHTASAUR_DEPLOYMENT_ENV__: string;

const API_BASE_URL = resolveApiBaseUrl({
  isDevelopment: import.meta.env.DEV,
  deploymentEnvironment:
    typeof __NIGHTASAUR_DEPLOYMENT_ENV__ === "string"
      ? __NIGHTASAUR_DEPLOYMENT_ENV__
      : undefined,
  developmentApiUrl: import.meta.env.VITE_API_URL,
  previewApiUrl: import.meta.env.VITE_PREVIEW_API_URL,
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nightasaur_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("nightasaur_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const spiritsAPI = {
  create: (data: { name: string; element: string; personality?: string; appearance?: string }) =>
    api.post("/spirits", data),
  list: () => api.get("/spirits"),
  getById: (id: string) => api.get(`/spirits/${id}`),
  evolve: (id: string) => api.post(`/spirits/${id}/evolve`),
  rename: (id: string, name: string) => api.patch(`/spirits/${id}/rename`, { name }),
  delete: (id: string) => api.delete(`/spirits/${id}`),
  updateCustomization: (id: string, customization: any) =>
    api.patch(`/spirits/${id}/customization`, { customization }),
};

export const dialogueAPI = {
  chat: (spiritId: string, message: string) =>
    api.post("/dialogue", { spiritId, message }),
};

export const socialAPI = {
  createPost: (data: any) => api.post("/social/posts", data),
  publishPost: (id: string) => api.post(`/social/posts/${id}/publish`),
  getUserPosts: () => api.get("/social/posts"),
  getAllPosts: () => api.get("/social/posts/admin/posts"),
};

export const assistantAPI = {
  chat: (message: string, history: { role: string; content: string }[] = []) =>
    api.post("/assistant/chat", { message, history }),
  code: (code: string, language: string, task: string = "explain") =>
    api.post("/assistant/code", { code, language, task }),
  translate: (text: string, targetLang: string = "zh-TW", sourceLang: string = "auto") =>
    api.post("/assistant/translate", { text, source_lang: sourceLang, target_lang: targetLang }),
  document: (content: string, task: string = "summarize", docType: string = "text") =>
    api.post("/assistant/document", { content, task, doc_type: docType }),
};

export const battleAPI = {
  encounter: (spiritId: string) => api.get(`/battle/encounter/${spiritId}`),
  action: (player: any, enemy: any, action: { type: string }) =>
    api.post("/battle/action", { player, enemy, action }),
};

export const languageAPI = {
  getUserPreference: () => api.get("/language/preference"),
  updatePreference: (data: any) => api.patch("/language/preference", data),
  autoDetect: () => api.post("/language/auto-detect"),
  getTranslation: (module: string, key: string, language?: string) =>
    api.get(`/language/translation/${module}/${key}`, { params: { language } }),
  getBatchTranslations: (module: string, keys: string[], language?: string) =>
    api.post(`/language/translations/${module}/batch`, { keys, language }),
  getInterfaceTranslations: (language?: string) =>
    api.get("/language/interface-translations", { params: { language } }),
  getSettingsMenu: () => api.get("/language/settings-menu"),
  resetSettings: () => api.post("/language/reset"),
};

export type IeltsDiagnosticQuestionType = "main-idea" | "detail" | "vocabulary" | "inference";

export interface IeltsDiagnosticStartResponse {
  sessionId: string;
  status: "in-progress";
  currentQuestion: number;
  diagnostic: {
    id: string;
    version: string;
    skill: "reading";
    source: "original-ielts-style";
    title: string;
    instructions: string;
    scorePolicy: {
      type: "objective-accuracy";
      bandEstimate: null;
      notice: string;
    };
    passages: Array<{ id: string; title: string; content: string }>;
    questions: Array<{
      id: string;
      passageId: string;
      prompt: string;
      options: string[];
      questionType: IeltsDiagnosticQuestionType;
    }>;
  };
}

export interface IeltsDiagnosticAnswerResponse {
  feedback: {
    questionId: string;
    answerIndex: number;
    correct: boolean;
    correctAnswerIndex: number;
    explanation: string;
  };
  progress: {
    answered: number;
    total: number;
    completed: boolean;
  };
  result: null | {
    skill: "reading";
    scoreType: "objective-accuracy";
    correct: number;
    total: number;
    accuracyPercent: number;
    bandEstimate: null;
    notice: string;
  };
}

export type IeltsReadingFocusLevel =
  | "foundation"
  | "consolidation"
  | "maintenance";

export interface IeltsObjectiveEvidence {
  sessionId: string;
  scoreType: "objective-accuracy";
  correct: number;
  total: number;
  accuracyPercent: number;
  completedAt: string | null;
}

interface IeltsSkillProfile {
  status: "evidence-ready" | "not-assessed";
  evidenceCount: number;
  latestEvidence: IeltsObjectiveEvidence | null;
  bestAccuracyPercent: number | null;
  bandEstimate: null;
}

export interface IeltsLearningProfileResponse {
  profileVersion: "ielts-learning-profile-v1";
  evidencePolicy: "completed-diagnostic-sessions-only";
  skills: {
    reading: IeltsSkillProfile;
    listening: IeltsSkillProfile;
    writing: IeltsSkillProfile;
    speaking: IeltsSkillProfile;
  };
  notice: string;
}

export interface IeltsDailyPlanResponse {
  planVersion: "ielts-daily-plan-v1";
  status: "diagnostic-required" | "ready";
  evidencePolicy: "latest-completed-diagnostic-only";
  scope: ["reading"];
  generatedFrom: IeltsObjectiveEvidence | null;
  focusLevel: IeltsReadingFocusLevel | null;
  totalMinutes: number;
  tasks: Array<{
    id: string;
    type: "review" | "practice";
    skill: "reading";
    minutes: number;
    targetQuestionCount?: number;
    sourceSessionId?: string;
    focus?: IeltsReadingFocusLevel;
  }>;
  bandEstimate: null;
  notice: string;
}

export interface IeltsPracticeStartResponse {
  sessionId: string;
  status: "in-progress";
  currentQuestion: number;
  generatedFrom: IeltsObjectiveEvidence;
  practice: {
    id: string;
    version: "reading-practice-v1";
    skill: "reading";
    source: "original-ielts-style";
    focusLevel: IeltsReadingFocusLevel;
    title: string;
    instructions: string;
    scorePolicy: {
      type: "practice-accuracy";
      profileEvidence: false;
      bandEstimate: null;
      notice: string;
    };
    passages: Array<{ id: string; title: string; content: string }>;
    questions: Array<{
      id: string;
      passageId: string;
      prompt: string;
      options: string[];
      questionType: IeltsDiagnosticQuestionType;
    }>;
  };
}

export interface IeltsPracticeAnswerResponse {
  feedback: IeltsDiagnosticAnswerResponse["feedback"];
  progress: IeltsDiagnosticAnswerResponse["progress"];
  result: null | {
    skill: "reading";
    scoreType: "practice-accuracy";
    focusLevel: IeltsReadingFocusLevel;
    correct: number;
    total: number;
    accuracyPercent: number;
    profileEvidence: false;
    bandEstimate: null;
    notice: string;
  };
}

export const ieltsAssessmentAPI = {
  startDiagnostic: () =>
    api.post<IeltsDiagnosticStartResponse>("/academy/ielts/diagnostic/start"),
  submitAnswer: (sessionId: string, questionId: string, answerIndex: number) =>
    api.post<IeltsDiagnosticAnswerResponse>(
      `/academy/ielts/diagnostic/${sessionId}/answer`,
      { questionId, answerIndex },
    ),
  getProfile: () =>
    api.get<IeltsLearningProfileResponse>("/academy/ielts/profile"),
  getDailyPlan: () =>
    api.get<IeltsDailyPlanResponse>("/academy/ielts/daily-plan"),
  startPractice: () =>
    api.post<IeltsPracticeStartResponse>("/academy/ielts/practice/start"),
  submitPracticeAnswer: (
    sessionId: string,
    questionId: string,
    answerIndex: number,
  ) =>
    api.post<IeltsPracticeAnswerResponse>(
      `/academy/ielts/practice/${sessionId}/answer`,
      { questionId, answerIndex },
    ),
};

export const userAPI = {
  register: async (userData: { email: string; username: string; password: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('nightasaur_token', response.data.token);
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (userData: { username?: string; avatarUrl?: string; bio?: string }) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('nightasaur_token');
  },
};
