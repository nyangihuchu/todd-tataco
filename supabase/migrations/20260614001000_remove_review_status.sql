-- tasks 테이블 review 상태값 제거
-- review 상태 데이터를 in_progress로 일괄 변경
UPDATE public.tasks
SET status = 'in_progress'
WHERE status = 'review';
