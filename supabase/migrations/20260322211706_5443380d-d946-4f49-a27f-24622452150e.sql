
-- ═══════════════════════════════════════════════════════════════════
-- RBAC Tables: user_profiles, user_role_assignments, role_permissions
-- ═══════════════════════════════════════════════════════════════════

-- 1. User Profiles (extends auth.users with app-level data)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  email text DEFAULT '',
  role_name text DEFAULT 'somente_leitura',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. User Role Assignments (links users to roles)
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name text NOT NULL DEFAULT 'somente_leitura',
  is_active boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_name)
);

ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- 3. Role Permissions (granular module+action permissions per role)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  allowed boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_name, module, action)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- Security Definer Functions (avoid recursive RLS)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_role_names(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(role_name),
    ARRAY['somente_leitura']::text[]
  )
  FROM public.user_role_assignments
  WHERE user_id = _user_id AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = _user_id
      AND is_active = true
      AND role_name IN ('super_admin', 'dev_admin')
  );
$$;

-- ═══════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════

-- user_profiles: users can read their own, admins can read all
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert profiles"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- user_role_assignments: authenticated can read (needed for RBAC checks), only admins can modify
CREATE POLICY "Authenticated can read role assignments"
  ON public.user_role_assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert role assignments"
  ON public.user_role_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update role assignments"
  ON public.user_role_assignments FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete role assignments"
  ON public.user_role_assignments FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- role_permissions: everyone authenticated can read, only admins can modify
CREATE POLICY "Authenticated can read permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert permissions"
  ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update permissions"
  ON public.role_permissions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete permissions"
  ON public.role_permissions FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ═══════════════════════════════════════════════════════════════════
-- Auto-create profile on user signup
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- First user gets super_admin, others get somente_leitura
  IF (SELECT count(*) FROM public.user_role_assignments) = 0 THEN
    INSERT INTO public.user_role_assignments (user_id, role_name, is_active)
    VALUES (NEW.id, 'super_admin', true)
    ON CONFLICT (user_id, role_name) DO NOTHING;
  ELSE
    INSERT INTO public.user_role_assignments (user_id, role_name, is_active)
    VALUES (NEW.id, 'somente_leitura', true)
    ON CONFLICT (user_id, role_name) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
