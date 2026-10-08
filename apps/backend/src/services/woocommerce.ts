import axios from "axios";
import prisma from "../config/prisma.js";
import { isAuthorizedAdmin } from "../config/admin.js";

export interface WooCredentials {
  url: string;
  key: string;
  secret: string;
}

export interface WooProduct {
  id: number;
  name: string;
  price: string;
  stock_quantity: number | null;
  stock_status: string;
  sku: string;
  categories: Array<{ id: number; name: string }>;
}

export interface WooProductList {
  products: WooProduct[];
  total: number;
  totalPages: number;
  page: number;
}

export async function resolveCredentials(
  userId: string,
  _userRole: string
): Promise<WooCredentials | null> {
  try {
    const userWoo = await prisma.userWoocommerce.findUnique({
      where: { userId },
    });
    if (userWoo && userWoo.isActive) {
      return {
        url: userWoo.wooUrl,
        key: userWoo.wooKey,
        secret: userWoo.wooSecret,
      };
    }
  } catch (e) {
    console.warn("[Woo] 查詢用戶憑證失敗:", e);
  }

  // 後臺共用商店憑證 fallback：只信任即時資料庫查詢，不信任呼叫端傳入的 role 字串。
  const user = await prisma.user.findUnique({ where: { id: userId },
    select: { email: true, role: true, isActive: true } });
  if (user?.isActive && isAuthorizedAdmin(user)) {
    const url = process.env.WOO_URL;
    const key = process.env.WOO_KEY;
    const secret = process.env.WOO_SECRET;
    if (url && key && secret) {
      return { url, key, secret };
    }
  }

  return null;
}

function authHeader(creds: WooCredentials) {
  const auth = Buffer.from(`${creds.key}:${creds.secret}`).toString("base64");
  return { Authorization: `Basic ${auth}` };
}

// 分頁 + 搜尋
export async function listProducts(
  creds: WooCredentials,
  options: {
    limit?: number;
    page?: number;
    search?: string;
    category?: number;
  } = {}
): Promise<WooProductList> {
  const limit = Math.min(options.limit || 20, 100);
  const params: any = {
    per_page: limit,
    page: options.page || 1,
    orderby: "date",
    order: "desc",
  };
  if (options.search) params.search = options.search;
  if (options.category) params.category = options.category;

  const res = await axios.get(`${creds.url}/wp-json/wc/v3/products`, {
    headers: authHeader(creds),
    params,
    timeout: 15000,
  });

  const products: WooProduct[] = res.data.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock_quantity: p.stock_quantity,
    stock_status: p.stock_status,
    sku: p.sku,
    categories: p.categories || [],
  }));

  return {
    products,
    total: parseInt(res.headers["x-wp-total"] || "0", 10),
    totalPages: parseInt(res.headers["x-wp-totalpages"] || "1", 10),
    page: params.page,
  };
}

export async function listOrders(creds: WooCredentials, limit = 10): Promise<any[]> {
  const res = await axios.get(`${creds.url}/wp-json/wc/v3/orders`, {
    headers: authHeader(creds),
    params: { per_page: limit, orderby: "date", order: "desc" },
    timeout: 15000,
  });

  return res.data.map((o: any) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    currency: o.currency,
    date_created: o.date_created,
    customer_name: `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim(),
    items_count: o.line_items?.length || 0,
  }));
}

export async function getLowStockProducts(
  creds: WooCredentials,
  threshold = 10
): Promise<WooProduct[]> {
  const result = await listProducts(creds, { limit: 100 });
  return result.products.filter(
    (p) =>
      p.stock_quantity !== null &&
      p.stock_quantity <= threshold &&
      p.stock_quantity > 0
  );
}

export async function getSalesStats(creds: WooCredentials): Promise<string> {
  const orders = await listOrders(creds, 50);
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

  return [
    `最近 ${orders.length} 筆訂單`,
    `總營收：${totalRevenue.toFixed(0)} TWD`,
    `平均客單價：${avgOrder.toFixed(0)} TWD`,
    `最新訂單：${orders[0]?.date_created || "無"}`,
  ].join("\n");
}