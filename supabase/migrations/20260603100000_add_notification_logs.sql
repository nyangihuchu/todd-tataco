-- 알림 발송 이력 테이블
CREATE TABLE IF NOT EXISTS notification_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('daily', 'task_created')),
  company_id  uuid REFERENCES companies(id) ON DELETE SET NULL,
  task_id     uuid REFERENCES tasks(id) ON DELETE SET NULL,
  phone       text NOT NULL,
  status      text NOT NULL CHECK (status IN ('sent', 'failed')),
  error_msg   text,
  sent_at     timestamptz NOT NULL DEFAULT now()
);

-- 발송 시각 기준 인덱스 (최근 발송 이력 조회용)
CREATE INDEX IF NOT EXISTS notification_logs_sent_at_idx
  ON notification_logs (sent_at DESC);

-- 업체별 이력 조회용 인덱스
CREATE INDEX IF NOT EXISTS notification_logs_company_id_idx
  ON notification_logs (company_id);

-- RLS: 로그인 사용자만 조회, INSERT는 서버 측 service_role 경유
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "로그인 사용자 조회"
  ON notification_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);
