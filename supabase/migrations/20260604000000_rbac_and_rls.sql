-- ================================================================
-- RBAC 및 RLS 정책 설정
-- - companies.user_id 컬럼 추가 (업체 소유자)
-- - handle_new_user 트리거 교체 (신규 가입 시 companies 자동 생성)
-- - tasks / companies RLS 정책 재정의
-- ================================================================

-- STEP 1: companies.user_id 컬럼 추가
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS companies_user_id_idx ON public.companies(user_id);

-- STEP 1.5: 기존 데이터 백필 (created_by → user_id)
UPDATE public.companies
SET user_id = created_by
WHERE user_id IS NULL AND created_by IS NOT NULL;

-- STEP 2: handle_new_user 트리거 교체 (신규 가입 시 companies 자동 생성)
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER LANGUAGE plpgsql
  SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- 프로필 생성
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  -- 업체 자동 생성 (업체명 = 이메일 @ 앞부분)
  INSERT INTO public.companies (name, user_id, created_by)
  VALUES (split_part(NEW.email, '@', 1), NEW.id, NEW.id);

  RETURN NEW;
END;
$$;

-- STEP 3: tasks RLS 정책 재정의
-- 기존 정책 제거
DROP POLICY IF EXISTS "tasks_select_authenticated" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_authenticated" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;

-- RLS 활성화
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 모든 업무 조회 가능
CREATE POLICY "tasks_select_authenticated"
  ON public.tasks FOR SELECT TO authenticated
  USING (true);

-- 인증된 사용자는 업무 생성 가능
CREATE POLICY "tasks_insert_authenticated"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 업무 생성자 또는 담당 업체 소유자만 수정 가능
CREATE POLICY "tasks_update_creator_or_company"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = tasks.company_id
        AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = tasks.company_id
        AND companies.user_id = auth.uid()
    )
  );

-- 업무 생성자만 삭제 가능
CREATE POLICY "tasks_delete_creator_only"
  ON public.tasks FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- STEP 4: companies RLS 정책 재정의
-- 기존 정책 제거
DROP POLICY IF EXISTS "companies_select_authenticated" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_authenticated" ON public.companies;
DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_own" ON public.companies;

-- RLS 활성화
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 모든 업체 조회 가능
CREATE POLICY "companies_select_authenticated"
  ON public.companies FOR SELECT TO authenticated
  USING (true);

-- 인증된 사용자는 업체 생성 가능 (트리거 경유 포함)
CREATE POLICY "companies_insert_authenticated"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 자신의 업체(user_id 기준)만 수정 가능
CREATE POLICY "companies_update_own"
  ON public.companies FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 자신의 업체(user_id 기준)만 삭제 가능
CREATE POLICY "companies_delete_own"
  ON public.companies FOR DELETE TO authenticated
  USING (user_id = auth.uid());
