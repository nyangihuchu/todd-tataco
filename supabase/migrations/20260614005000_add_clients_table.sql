-- clients 테이블 생성
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  website_url text,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- SELECT 정책
CREATE POLICY "clients_select_own"
  ON clients FOR SELECT
  USING (user_id = auth.uid());

-- INSERT 정책
CREATE POLICY "clients_insert_own"
  ON clients FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE 정책
CREATE POLICY "clients_update_own"
  ON clients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE 정책
CREATE POLICY "clients_delete_own"
  ON clients FOR DELETE
  USING (user_id = auth.uid());

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_clients_updated_at();

-- Storage client-images 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-images',
  'client-images',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 인증된 사용자만 본인 폴더에 업로드 가능
CREATE POLICY "client_images_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: public 버킷이므로 모든 사용자 조회 가능
CREATE POLICY "client_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-images');

-- Storage RLS: 본인 파일만 삭제 가능
CREATE POLICY "client_images_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: 본인 파일만 수정 가능
CREATE POLICY "client_images_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'client-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
