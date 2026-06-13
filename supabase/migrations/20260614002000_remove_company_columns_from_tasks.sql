-- tasks, notification_logs, notification_schedules 테이블에서 company_id 컬럼 제거
-- tasks.assignee_id 컬럼도 함께 제거 (1인 사용자 전환으로 불필요)

-- tasks 테이블 (company_id 참조 RLS 정책 먼저 제거)
DROP POLICY IF EXISTS "tasks_update_creator_or_company" ON public.tasks;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS assignee_id;

-- notification_logs 테이블
ALTER TABLE public.notification_logs DROP COLUMN IF EXISTS company_id;

-- notification_schedules 테이블
ALTER TABLE public.notification_schedules DROP COLUMN IF EXISTS company_id;
