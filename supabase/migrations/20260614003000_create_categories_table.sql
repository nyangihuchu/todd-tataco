-- categories 테이블 신규 생성 및 tasks.category_id FK 컬럼 추가

CREATE TABLE public.categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text        NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX categories_user_id_idx ON public.categories(user_id);

-- tasks 테이블에 category_id FK 컬럼 추가 (nullable, 카테고리 삭제 시 NULL 처리)
ALTER TABLE public.tasks
  ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
