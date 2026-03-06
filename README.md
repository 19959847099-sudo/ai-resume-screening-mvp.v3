# AI Resume Screening MVP v3

## Requirements

- Node.js 20 LTS
- npm 10+
- On Windows, `better-sqlite3` may require Visual Studio Build Tools during installation

## Install

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env.local` and adjust values if needed.

- `DATABASE_PATH`: SQLite file path. Default is `./data/app.db`
- `DEEPSEEK_API_KEY`: Optional. If empty, analysis uses built-in mock fallback
- `WECHATPAY_MOCK`: `1` enables mock payment behavior, `0` for real integration mode
- `WECHATPAY_*`: Real WeChat Pay credentials when `WECHATPAY_MOCK=0`

## SQLite Auto Initialization

The database is initialized automatically on first API call.

- The app creates `./data` if it does not exist
- SQL schema is loaded from `lib/schema.sql`
- Initialization is idempotent and can run repeatedly

## Run

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Mock Payment (Mode A)

1. Start from `/analyze`
2. Generate a free result
3. Click unlock and enter `/pay?order_id=...`
4. Trigger payment success by calling:

```bash
curl -X POST http://localhost:3000/api/pay/notify \
  -H "Content-Type: application/json" \
  -d '{"order_id":"xxx","wx_transaction_id":"MOCK_TX"}'
```

## Real WeChat Pay Configuration

Set:

- `WECHATPAY_MOCK=0`
- `WECHATPAY_APPID`
- `WECHATPAY_MCHID`
- `WECHATPAY_API_V3_KEY`
- `WECHATPAY_PRIVATE_KEY`
- `WECHATPAY_CERT_SERIAL_NO`

Then replace mock payment logic in `app/api/pay/native/route.ts` and webhook verification in `app/api/pay/notify/route.ts` with production logic.

## Deploy Notes

- Persist SQLite storage (`data` directory) in your deployment platform
- Ensure environment variables are configured in runtime settings

## End-to-End Acceptance Steps

1. Install dependencies with `npm install`
2. Start server with `npm run dev`
3. Open `/analyze`
4. Submit resume and JD text
5. Confirm free result appears on `/result`
6. Click unlock to go to `/pay?order_id=...`
7. Execute notify curl command with that order id
8. Confirm redirect to `/success` and then return to `/result` with full content unlocked
