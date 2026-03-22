
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  category text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  is_sensitive boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, version)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings (key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings (category);
CREATE INDEX IF NOT EXISTS idx_system_settings_active ON public.system_settings (is_active);
CREATE INDEX IF NOT EXISTS idx_system_settings_key_active ON public.system_settings (key) WHERE is_active = true;

CREATE TRIGGER set_updated_at_system_settings
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read system_settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin write system_settings"
  ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'dev_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'dev_admin'
  );

CREATE POLICY "Admin update system_settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'dev_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'dev_admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'dev_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'dev_admin'
  );

CREATE POLICY "Admin delete system_settings"
  ON public.system_settings
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'dev_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'dev_admin'
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
