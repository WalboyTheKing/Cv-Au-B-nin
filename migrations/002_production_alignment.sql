-- ===================================================================
-- CV PRO BÉNIN — MIGRATION 002 : ALIGNEMENT PRODUCTION & SÉCURITÉ
-- Harmonise le schéma PostgreSQL avec le backend Express, les forfaits
-- Découverte / Candidature 24h / Pack Carrière 30j, et la sécurité RLS.
-- ===================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_code_check;
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_code_check
      CHECK (plan_code IN ('free', 'cand_24h', 'career_30d', 'premium_7d', 'plus_30d'));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_plan_code_check;
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_plan_code_check
      CHECK (plan_code IN ('cand_24h', 'career_30d', 'premium_7d', 'plus_30d'));
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cv_id TEXT;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cv_title TEXT DEFAULT 'Mon CV Professionnel';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cvs') THEN
    ALTER TABLE public.cvs ADD COLUMN IF NOT EXISTS access JSONB DEFAULT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS "Écriture des logs système" ON public.audit_logs;
    CREATE POLICY "Seul le backend ou admin écrit les logs"
      ON public.audit_logs FOR INSERT
      WITH CHECK (public.is_admin());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cvpro_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'BJ',
  phone_number TEXT NOT NULL DEFAULT '+229 ',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  subscription JSONB NOT NULL DEFAULT '{}'::jsonb,
  auth_token TEXT DEFAULT NULL,
  token_expires_at TIMESTAMPTZ DEFAULT NULL,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_reason TEXT DEFAULT NULL,
  suspended_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvpro_users_email ON public.cvpro_users (lower(email));
CREATE INDEX IF NOT EXISTS idx_cvpro_users_token ON public.cvpro_users (auth_token) WHERE auth_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.cvpro_cvs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.cvpro_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Mon CV Professionnel',
  personal_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  profile_summary TEXT NOT NULL DEFAULT '',
  experiences JSONB NOT NULL DEFAULT '[]'::jsonb,
  educations JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  access JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvpro_cvs_user ON public.cvpro_cvs (user_id);

CREATE TABLE IF NOT EXISTS public.cvpro_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.cvpro_users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  cv_id TEXT NOT NULL,
  cv_title TEXT NOT NULL DEFAULT 'Mon CV Professionnel',
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('cand_24h', 'career_30d', 'premium_7d', 'plus_30d')),
  amount_xof INTEGER NOT NULL CHECK (amount_xof IN (500, 1000)),
  currency TEXT NOT NULL DEFAULT 'XOF',
  operator TEXT NOT NULL DEFAULT 'moov_money',
  beneficiary_name TEXT NOT NULL DEFAULT 'Waaliyou Z Labouda',
  beneficiary_phone TEXT NOT NULL DEFAULT '0194537741',
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'pending_verification', 'approved', 'rejected')),
  submission JSONB DEFAULT NULL,
  decision JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvpro_orders_user ON public.cvpro_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_cvpro_orders_status ON public.cvpro_orders (status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cvpro_orders_unique_approved_txref
ON public.cvpro_orders ((upper(submission->>'transactionRef')))
WHERE status = 'approved' AND submission IS NOT NULL AND submission->>'transactionRef' IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.cvpro_payments (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.cvpro_orders(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL REFERENCES public.cvpro_users(id) ON DELETE CASCADE,
  cv_id TEXT NOT NULL DEFAULT '',
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_code TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'moov_money',
  provider_reference TEXT NOT NULL,
  amount_xof INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'confirmed',
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cvpro_payments_unique_ref
ON public.cvpro_payments (upper(provider_reference));

CREATE INDEX IF NOT EXISTS idx_cvpro_payments_user ON public.cvpro_payments (user_id);

CREATE TABLE IF NOT EXISTS public.cvpro_audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvpro_audit_created ON public.cvpro_audit_logs (created_at DESC);

ALTER TABLE public.cvpro_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvpro_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvpro_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvpro_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvpro_audit_logs ENABLE ROW LEVEL SECURITY;
