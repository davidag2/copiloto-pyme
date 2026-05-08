CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Colombia',
  business_type TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  plan TEXT NOT NULL DEFAULT 'Crecimiento',
  monthly_goal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  data_source TEXT NOT NULL DEFAULT 'Excel/CSV',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'propietario',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cop INTEGER NOT NULL,
  trial_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plans (id, name, price_cop, trial_days, features)
VALUES
  ('go', 'Go', 20000, 30, '["Lectura diaria con IA", "Ventas, caja e inventario", "Alertas básicas"]'::jsonb),
  ('basic', 'Basic', 50000, 30, '["Todo lo del plan Go", "Proyección de caja", "Alertas inteligentes", "Soporte estándar"]'::jsonb),
  ('pro', 'Pro', 100000, 30, '["Todo lo del plan Basic", "Roles de equipo", "Reporte semanal", "Prioridad en soporte"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_cop = EXCLUDED.price_cop,
  trial_days = EXCLUDED.trial_days,
  status = 'active',
  features = EXCLUDED.features,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  trial_starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_company_active
  ON subscriptions(company_id)
  WHERE status IN ('trial', 'active', 'past_due');

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  current_step TEXT NOT NULL DEFAULT 'connect_data',
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

UPDATE users SET role = CASE role
  WHEN 'dueno' THEN 'propietario'
  WHEN 'owner' THEN 'propietario'
  WHEN 'admin' THEN 'administrador'
  WHEN 'finance' THEN 'contador'
  WHEN 'sales' THEN 'ventas'
  WHEN 'operaciones' THEN 'administrador'
  WHEN 'operations' THEN 'administrador'
  WHEN 'viewer' THEN 'ventas'
  ELSE role
END;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ventas',
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, email)
);

UPDATE team_invitations SET role = CASE role
  WHEN 'dueno' THEN 'propietario'
  WHEN 'owner' THEN 'propietario'
  WHEN 'admin' THEN 'administrador'
  WHEN 'finance' THEN 'contador'
  WHEN 'sales' THEN 'ventas'
  WHEN 'operaciones' THEN 'administrador'
  WHEN 'operations' THEN 'administrador'
  WHEN 'viewer' THEN 'ventas'
  ELSE role
END;

CREATE TABLE IF NOT EXISTS imported_data_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'CSV',
  file_name TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  valid_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processed',
  column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reversed_at TIMESTAMPTZ
);

ALTER TABLE imported_data_batches ADD COLUMN IF NOT EXISTS valid_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE imported_data_batches ADD COLUMN IF NOT EXISTS error_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE imported_data_batches ADD COLUMN IF NOT EXISTS duplicate_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE imported_data_batches ADD COLUMN IF NOT EXISTS column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE imported_data_batches ADD COLUMN IF NOT EXISTS validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE imported_data_batches ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS imported_data_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES imported_data_batches(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL DEFAULT 0,
  sale_date DATE,
  product_name TEXT NOT NULL,
  sales NUMERIC(14, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  cash NUMERIC(14, 2),
  expenses NUMERIC(14, 2),
  margin NUMERIC(8, 2),
  duplicate_key TEXT,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE imported_data_rows ADD COLUMN IF NOT EXISTS row_number INTEGER NOT NULL DEFAULT 0;
ALTER TABLE imported_data_rows ADD COLUMN IF NOT EXISTS duplicate_key TEXT;
ALTER TABLE imported_data_rows ADD COLUMN IF NOT EXISTS validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  threshold NUMERIC(14, 2) NOT NULL,
  comparator TEXT NOT NULL DEFAULT 'below',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, metric)
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('positive', 'warning', 'danger')),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Disponible',
  sync_label TEXT NOT NULL DEFAULT 'Manual',
  last_sync_at TIMESTAMPTZ,
  credentials_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, provider)
);

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  owner TEXT NOT NULL,
  impact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En curso', 'Completada')),
  decision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_imported_rows_company_date ON imported_data_rows(company_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_company_status ON alerts(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_company_status ON decisions(company_id, status, decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_company_created ON reports(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_status ON subscriptions(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_company_created ON sessions(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_invitations_company_status ON team_invitations(company_id, status, created_at DESC);
