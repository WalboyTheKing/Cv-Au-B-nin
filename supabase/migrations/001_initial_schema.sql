-- ===================================================================
-- CV PRO BÉNIN — SCHÉMA DE PRODUCTION SUPABASE / POSTGRESQL (RLS SÉCURISÉ)
-- Conforme aux exigences de sécurité, protection APDP et Moov Money Bénin
-- ===================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE PROFILES (Liée à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT DEFAULT '+229 ',
  country_code TEXT DEFAULT 'BJ',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index de recherche
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. TABLE ABONNEMENTS (SUBSCRIPTIONS)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('free', 'premium_7d', 'plus_30d')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 4. TABLE CVS
CREATE TABLE IF NOT EXISTS public.cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Mon CV Professionnel',
  personal_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  profile_summary TEXT DEFAULT '',
  experiences JSONB NOT NULL DEFAULT '[]'::jsonb,
  educations JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{"templateId":"moderne","primaryColor":"#047857","fontFamily":"Inter"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvs_user ON public.cvs(user_id);

-- 5. TABLE COMMANDES MOOV MONEY (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('premium_7d', 'plus_30d')),
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

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- Index unique partiel : empêche la réutilisation d'une référence Moov déjà approuvée
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_approved_txref
ON public.orders ((submission->>'transactionRef'))
WHERE status = 'approved' AND submission IS NOT NULL;

-- 6. TABLE PAIEMENTS COMPTABILISÉS (PAYMENTS)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'moov_money',
  provider_reference TEXT NOT NULL,
  amount_xof INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);

-- 7. TABLE LOGS D'AUDIT SÉCURITÉ
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ===================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ===================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper : vérifie si l'utilisateur connecté est administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- Politiques PROFILES ---
CREATE POLICY "Les utilisateurs peuvent lire leur propre profil"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Les utilisateurs peuvent modifier leur profil (sauf rôle)"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Seul admin peut modifier les rôles"
ON public.profiles FOR UPDATE
USING (public.is_admin());

-- --- Politiques CVS ---
CREATE POLICY "Accès complet aux CV personnels"
ON public.cvs FOR ALL
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- --- Politiques COMMANDES (ORDERS) ---
CREATE POLICY "Le client peut voir ses commandes"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Le client peut créer une commande en attente"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending_payment');

CREATE POLICY "Le client peut soumettre sa déclaration Moov"
ON public.orders FOR UPDATE
USING (auth.uid() = user_id AND status IN ('pending_payment', 'pending_verification'))
WITH CHECK (
  auth.uid() = user_id AND
  status = 'pending_verification' AND
  decision IS NULL
);

CREATE POLICY "Seul l'admin peut approuver ou rejeter une commande"
ON public.orders FOR UPDATE
USING (public.is_admin());

-- --- Politiques ABONNEMENTS ---
CREATE POLICY "Lecture de ses abonnements"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Seul l'admin ou le système peut attribuer un abonnement"
ON public.subscriptions FOR INSERT
WITH CHECK (public.is_admin());

-- --- Politiques AUDIT LOGS ---
CREATE POLICY "Lecture réservée aux administrateurs"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "Écriture des logs système"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- ===================================================================
-- FONCTION & TRIGGER : CRÉATION AUTOMATIQUE DU PROFIL CANDIDAT
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  v_first_name := COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1));
  v_last_name := COALESCE(new.raw_user_meta_data->>'last_name', 'Bénin');

  INSERT INTO public.profiles (id, email, first_name, last_name, phone_number, role)
  VALUES (
    new.id,
    new.email,
    v_first_name,
    v_last_name,
    COALESCE(new.raw_user_meta_data->>'phone_number', '+229 '),
    CASE WHEN new.email = 'admin@cvprobenin.bj' THEN 'admin' ELSE 'user' END
  );

  -- Création automatique de l'offre Découverte gratuite (1 an)
  INSERT INTO public.subscriptions (user_id, plan_code, status, starts_at, expires_at)
  VALUES (
    new.id,
    'free',
    'active',
    now(),
    now() + INTERVAL '1 year'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
