-- Security hardening: gate admin-only commercial, event, financial, and project child tables

-- ============================================================
-- 1. addon_extensions: commercial add-on pricing — admin-only
-- ============================================================
DROP POLICY IF EXISTS "Auth read addon_extensions" ON public.addon_extensions;
DROP POLICY IF EXISTS "Auth insert addon_extensions" ON public.addon_extensions;
DROP POLICY IF EXISTS "Auth update addon_extensions" ON public.addon_extensions;
DROP POLICY IF EXISTS "Auth delete addon_extensions" ON public.addon_extensions;

CREATE POLICY "Admins read addon_extensions" ON public.addon_extensions
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert addon_extensions" ON public.addon_extensions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update addon_extensions" ON public.addon_extensions
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete addon_extensions" ON public.addon_extensions
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================
-- 2. Event/tag tables for admin-only parent entities — admin-only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read delivered_system_events" ON public.delivered_system_events;
DROP POLICY IF EXISTS "Authenticated users can insert delivered_system_events" ON public.delivered_system_events;
CREATE POLICY "Admins read delivered_system_events" ON public.delivered_system_events
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert delivered_system_events" ON public.delivered_system_events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can read delivered_system_tags" ON public.delivered_system_tags;
DROP POLICY IF EXISTS "Authenticated users can insert delivered_system_tags" ON public.delivered_system_tags;
DROP POLICY IF EXISTS "Authenticated users can delete delivered_system_tags" ON public.delivered_system_tags;
CREATE POLICY "Admins read delivered_system_tags" ON public.delivered_system_tags
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert delivered_system_tags" ON public.delivered_system_tags
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete delivered_system_tags" ON public.delivered_system_tags
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can read project_change_events" ON public.project_change_events;
DROP POLICY IF EXISTS "Authenticated users can insert project_change_events" ON public.project_change_events;
CREATE POLICY "Admins read project_change_events" ON public.project_change_events
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert project_change_events" ON public.project_change_events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can read portfolio_item_events" ON public.portfolio_item_events;
DROP POLICY IF EXISTS "Authenticated users can insert portfolio_item_events" ON public.portfolio_item_events;
CREATE POLICY "Admins read portfolio_item_events" ON public.portfolio_item_events
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert portfolio_item_events" ON public.portfolio_item_events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth read project_model_events" ON public.project_model_events;
DROP POLICY IF EXISTS "Auth insert project_model_events" ON public.project_model_events;
CREATE POLICY "Admins read project_model_events" ON public.project_model_events
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert project_model_events" ON public.project_model_events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 3. Financial metrics tables — admin-only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read project_profitability_metrics" ON public.project_profitability_metrics;
DROP POLICY IF EXISTS "Authenticated can insert project_profitability_metrics" ON public.project_profitability_metrics;
DROP POLICY IF EXISTS "Authenticated can update project_profitability_metrics" ON public.project_profitability_metrics;
DROP POLICY IF EXISTS "Authenticated can delete project_profitability_metrics" ON public.project_profitability_metrics;
CREATE POLICY "Admins manage project_profitability_metrics" ON public.project_profitability_metrics
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read portfolio_performance_metrics" ON public.portfolio_performance_metrics;
DROP POLICY IF EXISTS "Authenticated can insert portfolio_performance_metrics" ON public.portfolio_performance_metrics;
DROP POLICY IF EXISTS "Authenticated can update portfolio_performance_metrics" ON public.portfolio_performance_metrics;
CREATE POLICY "Admins read portfolio_performance_metrics" ON public.portfolio_performance_metrics
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert portfolio_performance_metrics" ON public.portfolio_performance_metrics
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update portfolio_performance_metrics" ON public.portfolio_performance_metrics
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read niche_metrics" ON public.niche_metrics;
DROP POLICY IF EXISTS "Authenticated can insert niche_metrics" ON public.niche_metrics;
DROP POLICY IF EXISTS "Authenticated can update niche_metrics" ON public.niche_metrics;
DROP POLICY IF EXISTS "Authenticated can delete niche_metrics" ON public.niche_metrics;
CREATE POLICY "Admins manage niche_metrics" ON public.niche_metrics
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can read project_model_performance_metrics" ON public.project_model_performance_metrics;
DROP POLICY IF EXISTS "Authenticated users can insert project_model_performance_metrics" ON public.project_model_performance_metrics;
DROP POLICY IF EXISTS "Authenticated users can update project_model_performance_metrics" ON public.project_model_performance_metrics;
DROP POLICY IF EXISTS "Authenticated users can delete project_model_performance_metrics" ON public.project_model_performance_metrics;
CREATE POLICY "Admins manage project_model_performance_metrics" ON public.project_model_performance_metrics
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 4. Project child tables — admin-only
-- ============================================================
DROP POLICY IF EXISTS "Auth read project_modules" ON public.project_modules;
DROP POLICY IF EXISTS "Auth insert project_modules" ON public.project_modules;
DROP POLICY IF EXISTS "Auth update project_modules" ON public.project_modules;
DROP POLICY IF EXISTS "Auth delete project_modules" ON public.project_modules;
CREATE POLICY "Admins manage project_modules" ON public.project_modules
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth read project_milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Auth insert project_milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Auth update project_milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Auth delete project_milestones" ON public.project_milestones;
CREATE POLICY "Admins manage project_milestones" ON public.project_milestones
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth read project_events" ON public.project_events;
DROP POLICY IF EXISTS "Auth insert project_events" ON public.project_events;
CREATE POLICY "Admins manage project_events" ON public.project_events
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth read project_module_events" ON public.project_module_events;
DROP POLICY IF EXISTS "Auth insert project_module_events" ON public.project_module_events;
CREATE POLICY "Admins manage project_module_events" ON public.project_module_events
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 5. Public marketing content: keep public SELECT, restrict writes to admins
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert portfolio_items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Authenticated users can update portfolio_items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Authenticated users can delete portfolio_items" ON public.portfolio_items;
CREATE POLICY "Admins insert portfolio_items" ON public.portfolio_items
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update portfolio_items" ON public.portfolio_items
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete portfolio_items" ON public.portfolio_items
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth insert project_models" ON public.project_models;
DROP POLICY IF EXISTS "Auth update project_models" ON public.project_models;
DROP POLICY IF EXISTS "Auth delete project_models" ON public.project_models;
CREATE POLICY "Admins insert project_models" ON public.project_models
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update project_models" ON public.project_models
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete project_models" ON public.project_models
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth insert project_model_tiers" ON public.project_model_tiers;
DROP POLICY IF EXISTS "Auth update project_model_tiers" ON public.project_model_tiers;
DROP POLICY IF EXISTS "Auth delete project_model_tiers" ON public.project_model_tiers;
CREATE POLICY "Admins insert project_model_tiers" ON public.project_model_tiers
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update project_model_tiers" ON public.project_model_tiers
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete project_model_tiers" ON public.project_model_tiers
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth insert project_model_modules" ON public.project_model_modules;
DROP POLICY IF EXISTS "Auth update project_model_modules" ON public.project_model_modules;
DROP POLICY IF EXISTS "Auth delete project_model_modules" ON public.project_model_modules;
CREATE POLICY "Admins insert project_model_modules" ON public.project_model_modules
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update project_model_modules" ON public.project_model_modules
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete project_model_modules" ON public.project_model_modules
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================
-- 6. role_permissions: restrict read to admins (writes already admin-only)
-- ============================================================
DROP POLICY IF EXISTS "Auth read role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated can read permissions" ON public.role_permissions;
CREATE POLICY "Admins read role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================
-- 7. Remove project child tables from realtime to prevent broadcast leaks
-- ============================================================
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.project_modules; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.project_milestones; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.project_events; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================================
-- 8. Ensure grants match admin-only access for sensitive tables
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addon_extensions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivered_system_events TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.delivered_system_tags TO authenticated;
GRANT SELECT, INSERT ON public.project_change_events TO authenticated;
GRANT SELECT, INSERT ON public.portfolio_item_events TO authenticated;
GRANT SELECT, INSERT ON public.project_model_events TO authenticated;
GRANT ALL ON public.project_profitability_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.portfolio_performance_metrics TO authenticated;
GRANT ALL ON public.niche_metrics TO authenticated;
GRANT ALL ON public.project_model_performance_metrics TO authenticated;
GRANT ALL ON public.project_modules TO authenticated;
GRANT ALL ON public.project_milestones TO authenticated;
GRANT ALL ON public.project_events TO authenticated;
GRANT ALL ON public.project_module_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_models TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_model_tiers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_model_modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
