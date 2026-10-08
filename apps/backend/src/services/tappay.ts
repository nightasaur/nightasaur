import axios from "axios";
import crypto from "crypto";

const ENV = process.env.TAPPAY_ENV || "sandbox";
const BASE_URL =
  ENV === "production"
    ? "https://prod.tappaysdk.com"
    : "https://sandbox.tappaysdk.com";

const PARTNER_KEY = process.env.TAPPAY_PARTNER_KEY || "";
const MERCHANT_ID = process.env.TAPPAY_MERCHANT_ID || "";

if (!PARTNER_KEY || !MERCHANT_ID) {
  console.warn("[TapPay] TAPPAY_PARTNER_KEY / TAPPAY_MERCHANT_ID 未設定");
}

interface TappayCardholder {
  phone_number: string;
  name: string;
  email: string;
}

interface PayByPrimeInput {
  prime: string;
  amount: number;
  details: string;
  cardholder: TappayCardholder;
  orderNumber?: string;
}

interface PayByTokenInput {
  cardKey: string;
  cardToken: string;
  amount: number;
  details: string;
  cardholder: TappayCardholder;
  orderNumber?: string;
}

interface TappayResponse {
  status: number;
  msg: string;
  rec_trade_id?: string;
  order_number?: string;
  card_secret?: {
    card_key: string;
    card_token: string;
  };
  bank_transaction_id?: string;
  [key: string]: unknown;
}

async function post<T extends TappayResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const payload = {
    partner_key: PARTNER_KEY,
    merchant_id: MERCHANT_ID,
    ...body,
  };
  const res = await axios.post<T>(url, payload, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": PARTNER_KEY,
    },
    timeout: 30000,
  });
  return res.data;
}

/** 首次訂閱：帶 remember: true 取得 card_key / card_token */
export async function payByPrime(input: PayByPrimeInput): Promise<TappayResponse> {
  return post("/tpc/payment/pay-by-prime", {
    prime: input.prime,
    amount: input.amount,
    currency: "TWD",
    details: input.details,
    cardholder: input.cardholder,
    remember: true,
    order_number: input.orderNumber || `SUB-${Date.now()}`,
  });
}

/** 定期扣款：用已存的 card_key / card_token */
export async function payByToken(input: PayByTokenInput): Promise<TappayResponse> {
  return post("/tpc/payment/pay-by-token", {
    card_key: input.cardKey,
    card_token: input.cardToken,
    amount: input.amount,
    currency: "TWD",
    details: input.details,
    cardholder: input.cardholder,
    order_number: input.orderNumber || `REC-${Date.now()}`,
  });
}

/** TapPay 回傳驗證用（若之後接 backend_notify_url 需要） */
export function verifySignature(
  partnerKey: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  const hash = crypto
    .createHmac("sha256", partnerKey)
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}

export const TAPPAY_ENV = ENV;
