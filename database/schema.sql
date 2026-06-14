CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Colombia',
  business_type TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  plan TEXT NOT NULL DEFAULT 'go',
  monthly_goal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  data_source TEXT NOT NULL DEFAULT 'Excel/CSV',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS access_blocked_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS access_blocked_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS access_block_reason TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

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

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'lectura' CHECK (role IN ('super_admin', 'soporte', 'finanzas', 'operaciones', 'lectura')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

UPDATE admin_users SET role = CASE role
  WHEN 'admin' THEN 'super_admin'
  WHEN 'admin_soporte' THEN 'soporte'
  WHEN 'support' THEN 'soporte'
  WHEN 'finance' THEN 'finanzas'
  WHEN 'operations' THEN 'operaciones'
  WHEN 'operaciones_admin' THEN 'operaciones'
  WHEN 'viewer' THEN 'lectura'
  WHEN 'read_only' THEN 'lectura'
  ELSE role
END;

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

CREATE TABLE IF NOT EXISTS payment_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Colombia',
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'disabled')),
  supports_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  supports_cash BOOLEAN NOT NULL DEFAULT FALSE,
  supports_pse BOOLEAN NOT NULL DEFAULT FALSE,
  supports_cards BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO payment_providers (id, name, category, supports_recurring, supports_cash, supports_pse, supports_cards, description)
VALUES
  ('wompi', 'Wompi', 'Pasarela principal Colombia', TRUE, TRUE, TRUE, TRUE, 'Pagos con tarjeta, PSE, Nequi, Bancolombia y efectivo en corresponsales. Recomendada como pasarela principal para Colombia.'),
  ('bold', 'Bold', 'Links y API de pagos', FALSE, FALSE, TRUE, TRUE, 'Links de pago y API para cobrar con tarjetas, PSE, Nequi y otros medios locales. Útil como alternativa comercial.'),
  ('mercado_pago', 'Mercado Pago', 'Checkout y billetera', TRUE, TRUE, TRUE, TRUE, 'Checkout Pro, Checkout API, pagos con tarjetas, PSE, Efecty y cuenta Mercado Pago. Buena pasarela de respaldo.'),
  ('efecty', 'Efecty', 'Pago en efectivo', FALSE, TRUE, FALSE, FALSE, 'Pago offline para clientes que prefieren pagar en efectivo. Puede operar por convenio directo o como medio offline mediante Mercado Pago.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  supports_recurring = EXCLUDED.supports_recurring,
  supports_cash = EXCLUDED.supports_cash,
  supports_pse = EXCLUDED.supports_pse,
  supports_cards = EXCLUDED.supports_cards,
  description = EXCLUDED.description,
  status = 'available',
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  provider_id TEXT NOT NULL REFERENCES payment_providers(id),
  amount_cop INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'configuration_required', 'redirect_created', 'paid', 'failed', 'expired', 'canceled')),
  external_reference TEXT NOT NULL UNIQUE,
  external_checkout_url TEXT,
  provider_transaction_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  person_type TEXT NOT NULL DEFAULT 'company' CHECK (person_type IN ('person', 'company')),
  id_type TEXT NOT NULL DEFAULT '31',
  identification TEXT NOT NULL DEFAULT '',
  check_digit TEXT,
  legal_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT 'CO',
  state_code TEXT NOT NULL DEFAULT '',
  city_code TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  fiscal_responsibility_code TEXT NOT NULL DEFAULT 'R-99-PN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS siigo_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payment_transaction_id UUID NOT NULL UNIQUE REFERENCES payment_transactions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting_payment' CHECK (status IN ('waiting_payment', 'configuration_required', 'billing_profile_required', 'ready', 'sent', 'accepted', 'rejected', 'failed')),
  siigo_invoice_id TEXT,
  siigo_invoice_name TEXT,
  siigo_invoice_number TEXT,
  siigo_cufe TEXT,
  siigo_pdf_url TEXT,
  siigo_xml_url TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS siigo_invoice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siigo_invoice_id UUID REFERENCES siigo_invoices(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  action TEXT NOT NULL DEFAULT 'create_invoice',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  can_retry BOOLEAN NOT NULL DEFAULT FALSE,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opened_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'landing_chatbot',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  company_name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  estimated_response TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_client_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  channel TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  target_type TEXT NOT NULL DEFAULT 'company',
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_client_actions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE admin_client_actions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE admin_client_actions ADD COLUMN IF NOT EXISTS request_path TEXT;
ALTER TABLE admin_client_actions ADD COLUMN IF NOT EXISTS request_method TEXT;
ALTER TABLE admin_client_actions ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'company';
ALTER TABLE admin_client_actions ADD COLUMN IF NOT EXISTS target_id UUID;

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

ALTER TABLE onboarding_progress DROP CONSTRAINT IF EXISTS onboarding_progress_status_check;
ALTER TABLE onboarding_progress
  ADD CONSTRAINT onboarding_progress_status_check
  CHECK (status IN ('waitlist', 'pending', 'in_progress', 'completed'));

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

CREATE TABLE IF NOT EXISTS legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  legal_version TEXT NOT NULL,
  accepted_documents JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'registration' CHECK (source IN ('registration', 'login_update', 'admin_import')),
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id, legal_version, source)
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

CREATE TABLE IF NOT EXISTS sales_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT,
  document_number TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, document_number)
);

CREATE TABLE IF NOT EXISTS sales_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  type TEXT NOT NULL DEFAULT 'producto' CHECK (type IN ('producto', 'servicio')),
  category TEXT,
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, sku)
);

CREATE TABLE IF NOT EXISTS sales_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS sales_reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, email)
);

CREATE TABLE IF NOT EXISTS sales_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('cash', 'bank_transfer', 'card', 'digital_wallet', 'credit', 'manual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  import_batch_id UUID REFERENCES imported_data_batches(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES sales_customers(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES sales_channels(id) ON DELETE SET NULL,
  sales_rep_id UUID REFERENCES sales_reps(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES sales_payment_methods(id) ON DELETE SET NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pagada', 'pendiente', 'anulada')),
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES imported_data_batches(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES sales_products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  related_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  related_decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'copiloto_ai',
  category TEXT NOT NULL CHECK (category IN ('ventas', 'caja', 'inventario', 'precios', 'costos', 'clientes', 'reportes', 'integraciones', 'general')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  impact_type TEXT NOT NULL DEFAULT 'ventas_adicionales' CHECK (impact_type IN ('ventas_adicionales', 'margen', 'ahorro', 'riesgo_evitado')),
  impact_label TEXT NOT NULL DEFAULT '',
  impact_value_cop NUMERIC(14, 2),
  confidence NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  status TEXT NOT NULL DEFAULT 'nueva' CHECK (status IN ('nueva', 'vista', 'asignada', 'en_progreso', 'aplicada', 'descartada')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_for_date DATE NOT NULL DEFAULT CURRENT_DATE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_suggestions ALTER COLUMN status SET DEFAULT 'nueva';
ALTER TABLE ai_suggestions ADD COLUMN IF NOT EXISTS impact_type TEXT NOT NULL DEFAULT 'ventas_adicionales';
ALTER TABLE ai_suggestions DROP CONSTRAINT IF EXISTS ai_suggestions_impact_type_check;
UPDATE ai_suggestions SET impact_type = CASE
  WHEN category = 'precios' THEN 'margen'
  WHEN category = 'costos' THEN 'ahorro'
  WHEN category = 'caja' THEN 'ahorro'
  WHEN category = 'inventario' THEN 'riesgo_evitado'
  ELSE impact_type
END;
ALTER TABLE ai_suggestions ADD CONSTRAINT ai_suggestions_impact_type_check
  CHECK (impact_type IN ('ventas_adicionales', 'margen', 'ahorro', 'riesgo_evitado'));
ALTER TABLE ai_suggestions DROP CONSTRAINT IF EXISTS ai_suggestions_status_check;
UPDATE ai_suggestions SET status = CASE status
  WHEN 'open' THEN 'nueva'
  WHEN 'accepted' THEN 'aplicada'
  WHEN 'dismissed' THEN 'descartada'
  WHEN 'converted' THEN 'asignada'
  WHEN 'archived' THEN 'descartada'
  ELSE status
END;
ALTER TABLE ai_suggestions ADD CONSTRAINT ai_suggestions_status_check
  CHECK (status IN ('nueva', 'vista', 'asignada', 'en_progreso', 'aplicada', 'descartada'));

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

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'ai_suggestion_created',
    'ai_suggestion_viewed',
    'ai_suggestion_assigned',
    'ai_suggestion_updated',
    'ai_suggestion_applied',
    'ai_suggestion_dismissed',
    'decision_created',
    'decision_updated',
    'alert_created',
    'alert_resolved',
    'integration_connected',
    'integration_synced',
    'report_generated',
    'payment_created',
    'payment_paid',
    'user_invited',
    'user_login',
    'onboarding_completed',
    'system'
  )),
  entity_type TEXT NOT NULL DEFAULT 'system',
  entity_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'danger')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'ai_suggestion',
    'alert',
    'decision',
    'integration',
    'report',
    'payment',
    'billing',
    'team',
    'system'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'danger')),
  action_url TEXT,
  entity_type TEXT NOT NULL DEFAULT 'system',
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imported_rows_company_date ON imported_data_rows(company_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_company_status ON alerts(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customers_company_name ON sales_customers(company_id, name);
CREATE INDEX IF NOT EXISTS idx_sales_products_company_name ON sales_products(company_id, name);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company_date ON sales_orders(company_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company_status ON sales_orders(company_id, status, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_orders_import_batch ON sales_orders(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product ON sales_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_company_status ON ai_suggestions(company_id, status, priority, suggested_for_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_company_category ON ai_suggestions(company_id, category, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_assigned_to ON ai_suggestions(assigned_to, status, suggested_for_date DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_company_status ON decisions(company_id, status, decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_company_created ON reports(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_company_time ON activity_events(company_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_company_type ON activity_events(company_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_entity ON activity_events(entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_actor ON activity_events(actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_company_created ON notifications(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_company_unread ON notifications(company_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role, status);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_status ON admin_users(role, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_status ON subscriptions(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_company_status ON payment_transactions(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_status ON payment_transactions(provider_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_profiles_company ON billing_profiles(company_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_siigo_invoices_company_status ON siigo_invoices(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_siigo_invoice_logs_invoice_time ON siigo_invoice_logs(siigo_invoice_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_siigo_invoice_logs_company_status ON siigo_invoice_logs(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_access_blocked ON companies(access_blocked_at, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_cases_company_status ON support_cases(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_support_tickets_status ON public_support_tickets(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_client_actions_company_time ON admin_client_actions(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_client_actions_admin_time ON admin_client_actions(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_client_actions_action_time ON admin_client_actions(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_client_actions_target ON admin_client_actions(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_company_created ON sessions(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_invitations_company_status ON team_invitations(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_company_time ON legal_acceptances(company_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_version ON legal_acceptances(user_id, legal_version, accepted_at DESC);

CREATE TABLE IF NOT EXISTS admin_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by_admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  template_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed', 'configuration_required')),
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_by_admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO admin_email_templates (template_key, name, subject, preheader, body_text)
VALUES
  (
    'product_update',
    'Actualización de producto',
    'Novedades de Copiloto Pyme para tu empresa',
    'Novedades importantes para administrar mejor tu PYME.',
    'Hola {{nombre}},

Queríamos contarte una novedad importante de Copiloto Pyme para {{empresa}}.

Tu equipo puede entrar al dashboard y revisar ventas, caja, inventario y decisiones recomendadas para hoy.

Estamos atentos para acompañarte.'
  ),
  (
    'onboarding_followup',
    'Seguimiento onboarding',
    'Completa tu onboarding en Copiloto Pyme',
    'Completa tu configuración y recibe mejores decisiones diarias.',
    'Hola {{nombre}},

Vimos que {{empresa}} todavía puede completar algunos pasos para aprovechar mejor Copiloto Pyme.

Te recomendamos cargar tus datos de ventas, caja e inventario para recibir un resumen diario más útil.

Si necesitas ayuda, responde este correo y te acompañamos.'
  ),
  (
    'payment_reminder',
    'Recordatorio de pago',
    'Recordatorio de pago de Copiloto Pyme',
    'Mantén activo el acceso al dashboard de Copiloto Pyme.',
    'Hola {{nombre}},

Tu cuenta de {{empresa}} tiene un pago pendiente. Para mantener activo el dashboard después del mes gratis, realiza el pago del plan contratado.

Si ya pagaste, responde este correo para ayudarte a validar el estado.'
  ),
  (
    'welcome',
    'Bienvenida',
    'Bienvenido a Copiloto Pyme',
    'Tu mes gratis ya está activo.',
    'Hola {{nombre}},

Bienvenido a Copiloto Pyme. Tu empresa {{empresa}} ya tiene activa su cuenta y su mes gratis.

Tu usuario quedó como administrador maestro de la empresa. Desde el dashboard podrás configurar datos, invitar integrantes, asignar roles y empezar a cargar ventas, caja e inventario.'
  )
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  preheader = EXCLUDED.preheader,
  body_text = EXCLUDED.body_text,
  status = 'active',
  updated_at = NOW();

CREATE INDEX IF NOT EXISTS idx_admin_email_templates_status ON admin_email_templates(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_email_logs_company_time ON admin_email_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_email_logs_status_time ON admin_email_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_email_logs_recipient ON admin_email_logs(recipient_email, created_at DESC);
