
-- 1. Remove anonymous insert on ai_executions
DROP POLICY IF EXISTS "Anon insert ai_executions" ON public.ai_executions;

-- 2. Restrict ai_executions SELECT to admins only
DROP POLICY IF EXISTS "Auth read ai_executions" ON public.ai_executions;
CREATE POLICY "Admins read ai_executions" ON public.ai_executions
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth update ai_executions" ON public.ai_executions;
CREATE POLICY "Admins update ai_executions" ON public.ai_executions
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth insert ai_executions" ON public.ai_executions;
CREATE POLICY "Admins insert ai_executions" ON public.ai_executions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- 3. Restrict orcamentos SELECT/UPDATE/DELETE to admins (keep anon INSERT for lead intake)
DROP POLICY IF EXISTS "Authenticated users can read orcamentos" ON public.orcamentos;
CREATE POLICY "Admins read orcamentos" ON public.orcamentos
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update orcamentos" ON public.orcamentos;
CREATE POLICY "Admins update orcamentos" ON public.orcamentos
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete orcamentos" ON public.orcamentos;
CREATE POLICY "Admins delete orcamentos" ON public.orcamentos
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- 4. Restrict orcamento_analises to admins
DROP POLICY IF EXISTS "Authenticated can read orcamento_analises" ON public.orcamento_analises;
CREATE POLICY "Admins read orcamento_analises" ON public.orcamento_analises
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can insert orcamento_analises" ON public.orcamento_analises;
CREATE POLICY "Admins insert orcamento_analises" ON public.orcamento_analises
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can update orcamento_analises" ON public.orcamento_analises;
CREATE POLICY "Admins update orcamento_analises" ON public.orcamento_analises
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 5. Restrict orcamento_assets reads to admins (insert stays valid-orcamento-only)
DROP POLICY IF EXISTS "Authenticated can read orcamento_assets" ON public.orcamento_assets;
CREATE POLICY "Admins read orcamento_assets" ON public.orcamento_assets
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can delete orcamento_assets" ON public.orcamento_assets;
CREATE POLICY "Admins delete orcamento_assets" ON public.orcamento_assets
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- 6. Restrict propostas to admins (keep anonymous public token access if present)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='propostas'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.propostas', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins read propostas" ON public.propostas
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert propostas" ON public.propostas
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update propostas" ON public.propostas
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete propostas" ON public.propostas
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Anyone can read public propostas by token" ON public.propostas
  FOR SELECT TO anon, authenticated USING (is_public = true AND public_token IS NOT NULL);

-- 7. Restrict projects to admins
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='projects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins manage projects" ON public.projects
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 8. Restrict project_changes to admins
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='project_changes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_changes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins manage project_changes" ON public.project_changes
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 9. Restrict project_access_events to admins
DROP POLICY IF EXISTS "Authenticated users can read project_access_events" ON public.project_access_events;
CREATE POLICY "Admins read project_access_events" ON public.project_access_events
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert project_access_events" ON public.project_access_events;
CREATE POLICY "Admins insert project_access_events" ON public.project_access_events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- 10. Restrict pdf_versoes to admins
DROP POLICY IF EXISTS "Authenticated users can read pdf_versoes" ON public.pdf_versoes;
CREATE POLICY "Admins read pdf_versoes" ON public.pdf_versoes
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert pdf_versoes" ON public.pdf_versoes;
CREATE POLICY "Admins insert pdf_versoes" ON public.pdf_versoes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update pdf_versoes" ON public.pdf_versoes;
CREATE POLICY "Admins update pdf_versoes" ON public.pdf_versoes
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete pdf_versoes" ON public.pdf_versoes;
CREATE POLICY "Admins delete pdf_versoes" ON public.pdf_versoes
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- 11. Remove sensitive tables from realtime publication to prevent broadcast leaks
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.ai_executions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.projects; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.project_changes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.pdf_versoes; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
