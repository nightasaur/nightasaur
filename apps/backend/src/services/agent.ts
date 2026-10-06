import { getLLMProvider, type LLMMessage } from "./llm/index.js";
import axios from "axios";
import {
  listProducts,
  listOrders,
  getLowStockProducts,
  getSalesStats,
  resolveCredentials,
} from "./woocommerce.js";

export interface ToolContext {
  userId: string;
  spiritId: string;
  userRole: string;
  message?: string;
}

export interface Tool {
  name: string;
  description: string;
  keywords: string[];
  requiresWoo?: boolean;
  execute: (ctx: ToolContext) => Promise<string>;
}

const OLLAMA_INTERNAL = process.env.OLLAMA_INTERNAL_URL || "http://ollama:11434";

// 從用戶訊息抽出搜尋關鍵字
function extractSearchKeyword(message: string): string | null {
  if (!message) return null;
  // 移除常見的問句詞
  const kw = message
    .replace(/有賣|有卖|有嗎|有吗|有沒有|有没有|我想找|想找|搜尋|搜索|找一下|請找|请找/g, "")
    .replace(/嗎|吗|\?|？|。|，|,|的|商品|产品|產品|product|item/g, "")
    .trim();
  // 只保留有效長度
  if (kw.length < 2) return null;
  // 如果剩下太長（>20 字），截斷
  return kw.slice(0, 20);
}

export const TOOLS: Tool[] = [
  {
    name: "get_system_time",
    description: "取得系統目前時間（台北時區）。當用戶問現在幾點、今天日期時使用。",
    keywords: ["時間", "时间", "幾點", "几点", "日期", "今天", "現在", "现在", "time", "date", "clock"],
    execute: async () => {
      const now = new Date();
      return now.toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        weekday: "long",
      });
    },
  },
  {
    name: "list_ollama_models",
    description: "列出本地 Ollama 已安裝的模型清單。當用戶問有哪些模型時使用。",
    keywords: ["模型", "model", "ollama", "llama", "qwen", "gemma", "mistral", "什麼模型", "什么模型"],
    execute: async () => {
      try {
        const res = await axios.get(`${OLLAMA_INTERNAL}/api/tags`, { timeout: 5000 });
        const models = res.data?.models || [];
        if (models.length === 0) return "目前沒有已安裝的模型";
        return models
          .map((m: any) => `${m.name} (${(m.size / 1e9).toFixed(1)}GB)`)
          .join("\n");
      } catch (e: any) {
        return "無法取得模型清單：" + e.message;
      }
    },
  },
  {
    name: "list_woo_products",
    description: "列出商家商店的商品。當用戶問有哪些商品、庫存、價格時使用。",
    keywords: ["商品", "产品", "產品", "product", "shop", "商店", "庫存", "库存", "stock", "價格", "价格", "price"],
    requiresWoo: true,
    execute: async (ctx) => {
      const creds = await resolveCredentials(ctx.userId, ctx.userRole);
      if (!creds) return "您尚未設定 WooCommerce 商店，或無權限使用此功能";
      try {
        const result = await listProducts(creds, { limit: 20 });
        if (result.products.length === 0) return "目前沒有商品";
        const header = `共 ${result.total} 個商品，顯示第 ${result.page}/${result.totalPages} 頁的前 ${result.products.length} 個：`;
        const list = result.products
          .map((p) => `[${p.id}] ${p.name} - ${p.price} TWD (庫存: ${p.stock_quantity ?? "未管理"})`)
          .join("\n");
        return `${header}\n${list}`;
      } catch (e: any) {
        return "無法取得商品：" + e.message;
      }
    },
  },
  {
    name: "search_woo_products",
    description: "用關鍵字搜尋商品。當用戶問「有賣 X 嗎」「找 X 商品」「有沒有 X」時使用。",
    keywords: ["有賣", "有卖", "有嗎", "有吗", "有沒有", "有没有", "找商品", "搜尋商品", "搜索商品", "我想找", "想找"],
    requiresWoo: true,
    execute: async (ctx) => {
      const creds = await resolveCredentials(ctx.userId, ctx.userRole);
      if (!creds) return "您尚未設定 WooCommerce 商店，或無權限使用此功能";

      const keyword = extractSearchKeyword(ctx.message || "");
      if (!keyword) {
        return "請告訴我要搜尋什麼關鍵字（例如「滑鼠」「LOGITECH」）";
      }

      try {
        const result = await listProducts(creds, { limit: 20, search: keyword });
        if (result.products.length === 0) {
          return `找不到含「${keyword}」的商品`;
        }
        const header = `找到 ${result.total} 個含「${keyword}」的商品，顯示前 ${result.products.length} 個：`;
        const list = result.products
          .map((p) => `[${p.id}] ${p.name} - ${p.price} TWD (庫存: ${p.stock_quantity ?? "未管理"})`)
          .join("\n");
        return `${header}\n${list}`;
      } catch (e: any) {
        return "搜尋失敗：" + e.message;
      }
    },
  },
  {
    name: "list_woo_orders",
    description: "列出商家最近的訂單。當用戶問最近訂單、銷售狀況時使用。",
    keywords: ["訂單", "订单", "order", "銷售", "销售", "sales", "買家", "买家", "customer"],
    requiresWoo: true,
    execute: async (ctx) => {
      const creds = await resolveCredentials(ctx.userId, ctx.userRole);
      if (!creds) return "您尚未設定 WooCommerce 商店，或無權限使用此功能";
      try {
        const orders = await listOrders(creds, 10);
        if (orders.length === 0) return "目前沒有訂單";
        return orders
          .map((o) => `#${o.id} ${o.customer_name} - ${o.total} ${o.currency} (${o.status})`)
          .join("\n");
      } catch (e: any) {
        return "無法取得訂單：" + e.message;
      }
    },
  },
  {
    name: "get_woo_low_stock",
    description: "列出低庫存商品。當用戶問哪些商品快賣完時使用。",
    keywords: ["低庫存", "低库存", "快賣完", "快卖完", "庫存不足", "库存不足", "補貨", "补货", "low stock", "restock"],
    requiresWoo: true,
    execute: async (ctx) => {
      const creds = await resolveCredentials(ctx.userId, ctx.userRole);
      if (!creds) return "您尚未設定 WooCommerce 商店，或無權限使用此功能";
      try {
        const products = await getLowStockProducts(creds, 10);
        if (products.length === 0) return "沒有低庫存商品";
        return products
          .map((p) => `${p.name} - 剩 ${p.stock_quantity} 件`)
          .join("\n");
      } catch (e: any) {
        return "無法取得低庫存商品：" + e.message;
      }
    },
  },
  {
    name: "get_woo_sales_stats",
    description: "取得銷售統計（營收、平均客單價）。當用戶問業績、銷售數字時使用。",
    keywords: ["業績", "业绩", "營收", "营收", "銷售統計", "销售统计", "revenue", "stats", "報表", "报表"],
    requiresWoo: true,
    execute: async (ctx) => {
      const creds = await resolveCredentials(ctx.userId, ctx.userRole);
      if (!creds) return "您尚未設定 WooCommerce 商店，或無權限使用此功能";
      try {
        return await getSalesStats(creds);
      } catch (e: any) {
        return "無法取得統計：" + e.message;
      }
    },
  },
];

export async function decideTools(userMessage: string): Promise<string[]> {
  const lower = userMessage.toLowerCase();

  const quickMatches = TOOLS.filter((tool) =>
    tool.keywords.some((kw) => lower.includes(kw.toLowerCase()))
  ).map((t) => t.name);

  if (quickMatches.length > 0) {
    return [...new Set(quickMatches)];
  }

  try {
    const provider = getLLMProvider();
    const toolList = TOOLS.map((t) => `- ${t.name}: ${t.description}`).join("\n");

    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `你是工具決策器。判斷用戶訊息是否需要呼叫工具。

可用工具：
${toolList}

只回傳 JSON，不要其他文字：
{"tools": ["tool1"]}
或
{"tools": []}`,
      },
      { role: "user", content: userMessage },
    ];

    const raw = await provider.chat(messages, {
      format: "json",
      maxTokens: 100,
      temperature: 0.1,
    });

    const parsed = JSON.parse(raw);
    const tools = Array.isArray(parsed.tools) ? parsed.tools : [];
    return tools.filter((t: string) => TOOLS.some((tool) => tool.name === t));
  } catch (e) {
    console.warn("[Agent] decideTools failed:", e);
    return [];
  }
}

export async function executeTools(
  ctx: ToolContext,
  toolNames: string[]
): Promise<Array<{ name: string; result: string }>> {
  const results: Array<{ name: string; result: string }> = [];

  for (const name of toolNames) {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) continue;

    try {
      const result = await tool.execute(ctx);
      results.push({ name, result });
    } catch (e: any) {
      results.push({ name, result: "執行失敗：" + e.message });
    }
  }

  return results;
}

export function formatToolResults(
  results: Array<{ name: string; result: string }>
): string {
  if (results.length === 0) return "";

  const lines = results.map((r) => `【${r.name}】\n${r.result}`).join("\n\n");

  return `\n\n=== 系統工具執行結果（真實數據） ===\n${lines}\n=== 請根據以上真實數據回答使用者 ===`;
}