
-- 1. Audit logs: admin-only read; only service role inserts (drop permissive insert)
DROP POLICY IF EXISTS "Auth read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Auth insert audit_logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- 2. Security events / alerts / incidents: admin-only
DROP POLICY IF EXISTS "Auth read security_events" ON public.security_events;
DROP POLICY IF EXISTS "Auth insert security_events" ON public.security_events;
CREATE POLICY "Admins read security_events" ON public.security_events
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth insert security_events" ON public.security_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read security_alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "Auth insert security_alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "Auth update security_alerts" ON public.security_alerts;
CREATE POLICY "Admins manage security_alerts" ON public.security_alerts
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth read security_incidents" ON public.security_incidents;
DROP POLICY IF EXISTS "Auth insert security_incidents" ON public.security_incidents;
DROP POLICY IF EXISTS "Auth update security_incidents" ON public.security_incidents;
CREATE POLICY "Admins manage security_incidents" ON public.security_incidents
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 3. project_accesses: admin-only (contains credentials)
DROP POLICY IF EXISTS "Authenticated users can read project_accesses" ON public.project_accesses;
DROP POLICY IF EXISTS "Authenticated users can insert project_accesses" ON public.project_accesses;
DROP POLICY IF EXISTS "Authenticated users can update project_accesses" ON public.project_accesses;
DROP POLICY IF EXISTS "Authenticated users can delete project_accesses" ON public.project_accesses;
CREATE POLICY "Admins manage project_accesses" ON public.project_accesses
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 4. delivered_systems: admin-only (internal urls + commercial)
DROP POLICY IF EXISTS "Authenticated users can read delivered_systems" ON public.delivered_systems;
DROP POLICY IF EXISTS "Authenticated users can insert delivered_systems" ON public.delivered_systems;
DROP POLICY IF EXISTS "Authenticated users can update delivered_systems" ON public.delivered_systems;
DROP POLICY IF EXISTS "Authenticated users can delete delivered_systems" ON public.delivered_systems;
CREATE POLICY "Admins manage delivered_systems" ON public.delivered_systems
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 5. user_role_assignments: self-read or admin
DROP POLICY IF EXISTS "Authenticated can read role assignments" ON public.user_role_assignments;
CREATE POLICY "Users read own role assignments" ON public.user_role_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 6. role_permissions: remove permissive duplicates
DROP POLICY IF EXISTS "Auth delete role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Auth insert role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Auth update role_permissions" ON public.role_permissions;

-- 7. orcamento_assets: anon insert must reference a valid orcamento
DROP POLICY IF EXISTS "Anyone can insert orcamento_assets" ON public.orcamento_assets;
CREATE POLICY "Anyone can insert orcamento_assets with valid orcamento" ON public.orcamento_assets
  FOR INSERT TO anon, authenticated
  WITH CHECK (orcamento_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_assets.orcamento_id));

-- 8. Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.orcamentos;
ALTER PUBLICATION supabase_realtime DROP TABLE public.propostas;
ALTER PUBLICATION supabase_realtime DROP TABLE public.project_accesses;
ALTER PUBLICATION supabase_realtime DROP TABLE public.delivered_systems;

-- 9. Lock down SECURITY DEFINER helper functions (callable only via server-side/service role)
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role_names(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
