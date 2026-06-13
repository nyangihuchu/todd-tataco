-- RLS 정책 v2 업데이트
-- 1. tasks UPDATE 정책: companies 의존 제거 후 본인 생성 업무만 수정 가능
-- 2. categories 테이블 RLS 정책 추가
-- 3. handle_new_user 트리거에서 companies 자동 생성 제거

-- STEP 1: tasks UPDATE 정책 재생성 (본인 생성 업무만 수정 가능)
DROP POLICY IF EXISTS "tasks_update_creator_or_company" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;

CREATE POLICY "tasks_update_own"
  ON public.tasks FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- STEP 2: categories 테이블 RLS 활성화 및 정책 추가
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_own"
  ON public.categories FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "categories_insert_own"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_update_own"
  ON public.categories FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_delete_own"
  ON public.categories FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- STEP 3: handle_new_user 트리거 교체 (companies INSERT 제거)
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER LANGUAGE plpgsql
  SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;
