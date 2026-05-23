-- ArStore API — NeonDB Schema
-- Run via: psql $DATABASE_URL -f db/schema.sql
-- Or paste into Neon Console SQL Editor

-- ── Devices (registered mobile app installations) ────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
  id              SERIAL PRIMARY KEY,
  device_id       VARCHAR(255) UNIQUE NOT NULL,   -- ANDROID_ID or UUID fallback
  device_model    VARCHAR(255) NOT NULL DEFAULT '',
  status          VARCHAR(50)  NOT NULL DEFAULT 'trial', -- trial | active | expired
  user_name       VARCHAR(255),
  user_email      VARCHAR(255),
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date     TIMESTAMPTZ,                    -- NULL = permanent
  is_permanent    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_email  ON devices(user_email);

-- ── License codes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS license_codes (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(255) UNIQUE NOT NULL,  -- ARST-XXXX-XXXX-XXXX
  type             VARCHAR(50)  NOT NULL,          -- monthly|6months|yearly|2years|lifetime
  duration_months  INTEGER,                        -- NULL for lifetime
  used             BOOLEAN      NOT NULL DEFAULT FALSE,
  used_by_device_id VARCHAR(255) REFERENCES devices(device_id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  used_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_codes_used ON license_codes(used);
CREATE INDEX IF NOT EXISTS idx_codes_type ON license_codes(type);

-- ── Payment / contact info (single row, id = 1) ───────────────────────────────
CREATE TABLE IF NOT EXISTS payment_info (
  id           INTEGER PRIMARY KEY DEFAULT 1,
  whatsapp     VARCHAR(255),
  email        VARCHAR(255),
  bank_name    VARCHAR(255),
  bank_account VARCHAR(255),
  bank_holder  VARCHAR(255),
  qris_url     TEXT,
  note         TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Ensure the single row exists
INSERT INTO payment_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── Feature requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_requests (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  VARCHAR(255),
  message    TEXT         NOT NULL,
  read       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_requests_read ON feature_requests(read);

-- ── Admin users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt(12)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
