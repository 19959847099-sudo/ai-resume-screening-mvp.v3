import crypto from "node:crypto";

const WECHATPAY_BASE_URL = "https://api.mch.weixin.qq.com";

export type NativeOrderParams = {
  orderId: string;
  description: string;
  amount: number;
};

export type NativeOrderResult = {
  code_url: string;
};

export type WechatPayNotifyResource = {
  algorithm: string;
  ciphertext: string;
  associated_data?: string;
  nonce: string;
};

export type WechatPayNotifyPayload = {
  id: string;
  create_time: string;
  event_type: string;
  resource_type: string;
  summary: string;
  resource: WechatPayNotifyResource;
};

export type WechatPayTransaction = {
  mchid: string;
  appid?: string;
  out_trade_no: string;
  transaction_id: string;
  trade_state:
    | "SUCCESS"
    | "REFUND"
    | "NOTPAY"
    | "CLOSED"
    | "REVOKED"
    | "USERPAYING"
    | "PAYERROR";
  amount?: {
    total: number;
  };
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }
  return value;
}

function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n");
}

function getWechatConfig() {
  return {
    appid: requireEnv("WECHATPAY_APPID"),
    mchid: requireEnv("WECHATPAY_MCHID"),
    apiV3Key: requireEnv("WECHATPAY_API_V3_KEY"),
    privateKey: normalizePem(requireEnv("WECHATPAY_PRIVATE_KEY")),
    certSerialNo: requireEnv("WECHATPAY_CERT_SERIAL_NO"),
    notifyUrl: requireEnv("WECHATPAY_NOTIFY_URL"),
    platformPublicKey: normalizePem(requireEnv("WECHATPAY_PLATFORM_PUBLIC_KEY")),
    platformSerial: requireEnv("WECHATPAY_PLATFORM_SERIAL")
  };
}

export function isWechatPayMock(): boolean {
  return process.env.WECHATPAY_MOCK !== "0";
}

export function buildMockCodeUrl(orderId: string): string {
  return `weixin://mockpay/qr/${encodeURIComponent(orderId)}`;
}

function buildMessage(
  method: string,
  urlPathWithQuery: string,
  timestamp: string,
  nonce: string,
  body: string
): string {
  return `${method}\n${urlPathWithQuery}\n${timestamp}\n${nonce}\n${body}\n`;
}

function signMessage(message: string, privateKeyPem: string): string {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(message);
  signer.end();
  return signer.sign(privateKeyPem, "base64");
}

function buildAuthorization(
  method: string,
  urlPathWithQuery: string,
  body: string
): string {
  const { mchid, certSerialNo, privateKey } = getWechatConfig();

  const nonceStr = crypto.randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const message = buildMessage(method, urlPathWithQuery, timestamp, nonceStr, body);
  const signature = signMessage(message, privateKey);

  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${certSerialNo}",signature="${signature}"`;
}

async function wechatFetch<T>(
  method: "POST" | "GET",
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const rawBody = body ? JSON.stringify(body) : "";
  const authorization = buildAuthorization(method, path, rawBody);

  const response = await fetch(`${WECHATPAY_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authorization
    },
    body: method === "GET" ? undefined : rawBody,
    cache: "no-store"
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      data?.message ||
      data?.detail ||
      data?.code ||
      `微信支付请求失败：HTTP ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export async function createNativeTransaction(
  params: NativeOrderParams
): Promise<NativeOrderResult> {
  const { appid, mchid, notifyUrl } = getWechatConfig();

  const body = {
    appid,
    mchid,
    description: params.description,
    out_trade_no: params.orderId,
    notify_url: notifyUrl,
    amount: {
      total: params.amount,
      currency: "CNY"
    }
  };

  return wechatFetch<NativeOrderResult>(
    "POST",
    "/v3/pay/transactions/native",
    body
  );
}

export function verifyNotifySignature(rawBody: string, headers: Headers): boolean {
  const { platformPublicKey, platformSerial } = getWechatConfig();

  const timestamp = headers.get("Wechatpay-Timestamp") || "";
  const nonce = headers.get("Wechatpay-Nonce") || "";
  const signature = headers.get("Wechatpay-Signature") || "";
  const serial = headers.get("Wechatpay-Serial") || "";

  if (!timestamp || !nonce || !signature || !serial) {
    return false;
  }

  if (platformSerial && serial !== platformSerial) {
    return false;
  }

  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(message);
  verifier.end();

  return verifier.verify(platformPublicKey, signature, "base64");
}

export function decryptNotifyResource(resource: WechatPayNotifyResource): string {
  const { apiV3Key } = getWechatConfig();

  if (resource.algorithm !== "AEAD_AES_256_GCM") {
    throw new Error(`不支持的加密算法：${resource.algorithm}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const keyBytes = encoder.encode(apiV3Key);
  const iv = encoder.encode(resource.nonce);
  const aad = encoder.encode(resource.associated_data || "");

  const ciphertextBytes = Uint8Array.from(
    Buffer.from(resource.ciphertext, "base64")
  );

  const authTag = ciphertextBytes.slice(ciphertextBytes.length - 16);
  const encrypted = ciphertextBytes.slice(0, ciphertextBytes.length - 16);

  const key = crypto.createSecretKey(keyBytes);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAAD(aad);
  decipher.setAuthTag(authTag);

  const part1 = decipher.update(encrypted);
  const part2 = decipher.final();

  const merged = new Uint8Array(part1.length + part2.length);
  merged.set(part1);
  merged.set(part2, part1.length);

  return decoder.decode(merged);
}