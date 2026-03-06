CREATE TABLE IF NOT EXISTS orders (
order_id TEXT PRIMARY KEY,
plan TEXT NOT NULL,
amount INTEGER NOT NULL,
status TEXT NOT NULL,
created_at TEXT NOT NULL,
paid_at TEXT,
membership_expires_at TEXT,
wx_transaction_id TEXT,
code_url TEXT
);

CREATE TABLE IF NOT EXISTS memberships (
membership_token TEXT PRIMARY KEY,
short_code TEXT NOT NULL UNIQUE,
expires_at TEXT NOT NULL,
source_order_id TEXT NOT NULL,
created_at TEXT NOT NULL,
last_used_at TEXT
);
