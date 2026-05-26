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

-- ── App releases (APK download page) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_releases (
  id           SERIAL PRIMARY KEY,
  version_name VARCHAR(50)  NOT NULL,              -- "1.2.3"
  version_code INTEGER      NOT NULL,              -- monotonically increasing
  apk_url      TEXT         NOT NULL,              -- direct APK download link
  changelog    JSONB        NOT NULL DEFAULT '[]', -- ["Fix A", "Add B"]
  features     JSONB        NOT NULL DEFAULT '[]', -- feature bullet points
  screenshots  JSONB        NOT NULL DEFAULT '[]', -- image URLs
  min_android  VARCHAR(100) NOT NULL DEFAULT 'Android 7.0+',
  file_size    VARCHAR(50),                        -- "28 MB"
  is_published BOOLEAN      NOT NULL DEFAULT FALSE,
  release_date TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Add missing columns if they don't exist yet
ALTER TABLE app_releases ADD COLUMN IF NOT EXISTS apk_url_arm64 TEXT;
ALTER TABLE app_releases ADD COLUMN IF NOT EXISTS apk_url_arm32 TEXT;
ALTER TABLE app_releases ADD COLUMN IF NOT EXISTS apk_url_x86 TEXT;

CREATE INDEX IF NOT EXISTS idx_releases_published ON app_releases(is_published, release_date DESC);

-- ── Products & Services ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(50)  NOT NULL,   -- 'rental' | 'development'
  description TEXT,
  price       NUMERIC(12,0) NOT NULL DEFAULT 0,  -- IDR, no decimal
  duration    VARCHAR(100),            -- e.g. "1 bulan", "Seumur hidup", NULL for project-based
  features    JSONB        NOT NULL DEFAULT '[]', -- array of feature strings
  image_url   TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- ── Admin users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt(12)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Announcements (pengumuman dari admin ke pengguna aplikasi) ────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'info',  -- info | warning | promo
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  starts_at  TIMESTAMPTZ,   -- NULL = always active from creation
  ends_at    TIMESTAMPTZ,   -- NULL = no expiry
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, ends_at);

-- ── App Users (pengguna aplikasi untuk sistem lisensi) ─────────────────────
CREATE TABLE IF NOT EXISTS app_users (
  id               SERIAL PRIMARY KEY,
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  active_device_id VARCHAR(255),
  status           VARCHAR(50)  NOT NULL DEFAULT 'trial',
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_device ON app_users(active_device_id);

-- ── License Requests (pengajuan perpanjangan/pembelian) ───────────────────
CREATE TABLE IF NOT EXISTS license_requests (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  requested_months INTEGER NOT NULL,
  proof_image      TEXT,
  status           VARCHAR(50) NOT NULL DEFAULT 'pending',
  admin_note       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_license_req_status ON license_requests(status);
