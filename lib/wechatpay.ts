export function isWechatPayMock(): boolean {
  return process.env.WECHATPAY_MOCK !== "0";
}

export function buildMockCodeUrl(orderId: string): string {
  return `weixin://mockpay/qr/${encodeURIComponent(orderId)}`;
}
