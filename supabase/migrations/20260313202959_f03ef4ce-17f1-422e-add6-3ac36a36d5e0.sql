
-- Security Events
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'info',
  description text NOT NULL DEFAULT '',
  source text NULL DEFAULT '',
  user_id uuid NULL,
  user_email text NULL DEFAULT '',
  ip_address text NULL DEFAULT '',
  entity_type text NULL DEFAULT '',
  entity_id text NULL DEFAULT '',
  metadata jsonb NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read security_events" ON public.security_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert security_events" ON public.security_events FOR INSERT TO authenticated WITH CHECK (true);

-- Security Alerts
CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'novo',
  source text NULL DEFAULT '',
  event_id uuid NULL REFERENCES public.security_events(id),
  assigned_to text NULL DEFAULT '',
  resolved_by text NULL DEFAULT '',
  resolved_at timestamptz NULL,
  notas text NULL DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read security_alerts" ON public.security_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert security_alerts" ON public.security_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update security_alerts" ON public.security_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Security Incidents
CREATE TABLE public.security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  incident_type text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'medium',
  description text NOT NULL DEFAULT '',
  source text NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aberto',
  containment_action text NULL DEFAULT '',
  corrective_action text NULL DEFAULT '',
  responsible text NULL DEFAULT '',
  alert_id uuid NULL REFERENCES public.security_alerts(id),
  notas text NULL DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL
);
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read security_incidents" ON public.security_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert security_incidents" ON public.security_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update security_incidents" ON public.security_incidents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Role Permissions
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL DEFAULT '',
  module text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT '',
  allowed boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_name, module, action)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert role_permissions" ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update role_permissions" ON public.role_permissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete role_permissions" ON public.role_permissions FOR DELETE TO authenticated USING (true);
