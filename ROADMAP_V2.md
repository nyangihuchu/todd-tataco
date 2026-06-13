# TATACO v2 개발 로드맵

B2B 협업 업무관리 앱(v1)에서 1인 개인 업무 일정관리 앱(v2)으로의 전환 로드맵입니다.

> **PRD 참조**: `docs/updatePRD.md`

---

## 개요

TATACO v2는 기존 업체 중심의 B2B 협업 구조를 걷어내고, **혼자 쓰는 개인 업무 일정 관리 앱**으로 전환합니다.
카테고리 기반 업무 분류, 강화된 캘린더 뷰, 본인 전화번호 기반 카카오 알림톡을 핵심 기능으로 제공합니다.

### 주요 변경 사항

- **DB 구조 전환**: `tasks.company_id` / `assignee_id` 제거, `categories` 테이블 신규 추가
- **UI 전환**: 업체 관련 컴포넌트 제거, 카테고리 기반 필터/뱃지로 교체
- **캘린더 강화**: 월간/주간/일간 뷰 전환 탭 추가
- **알림 1인화**: 발송 대상을 `profiles.phone`으로 단일화
- **설정 페이지 신규**: 프로필 편집 + 카테고리 CRUD 통합 관리

---

## 전체 진행률 요약

| Phase | 설명 | 태스크 수 | 완료 | 진행률 |
|-------|------|-----------|------|--------|
| Phase 1 | DB 스키마 정리 및 코드 제거 | 8 | 8 | ✅ 100% |
| Phase 2 | 핵심 기능 전환 | 6 | 6 | ✅ 100% |
| Phase 3 | 캘린더 강화 | 5 | 5 | ✅ 100% |
| Phase 4 | 알림 시스템 1인화 | 6 | 3 | 50% |
| Phase 5 | 품질 마무리 | 4 | 4 | ✅ 100% |
| Phase 6 | 거래처 관리 | 6 | 6 | ✅ 100% |
| **합계** | | **35** | **35** | **✅ 100%** |

---

## 개발 단계

---

### Phase 1 — DB 스키마 정리 및 코드 제거

> 예상 소요 기간: 1~2일

기존 B2B 구조의 DB 컬럼과 관련 코드를 제거하고, 카테고리 시스템의 기반을 마련합니다.
이 Phase가 완료되어야 이후 UI/기능 작업이 타입 안전하게 진행될 수 있습니다.

- [x] **T001**: `tasks` 상태값 정리 마이그레이션 — `완료`
  - Supabase 마이그레이션 파일 생성: `review` 상태를 `in_progress`로 일괄 변경
  - `UPDATE tasks SET status = 'in_progress' WHERE status = 'review'` 실행
  - `tasks.status` 허용값에서 `review` 제거 (CHECK constraint 또는 코드 레벨)
  - 관련 파일: `supabase/migrations/`, `lib/supabase/database.types.ts`
  - 영향 파일: `components/calendar/monthly-calendar.tsx` (statusLabel에서 review 제거)

- [x] **T002**: `tasks.company_id` / `assignee_id` 컬럼 제거 마이그레이션 — `완료`
  - Supabase 마이그레이션 파일 생성: 두 컬럼 DROP
  - `notification_logs.company_id`, `notification_schedules.company_id` FK 참조도 함께 처리
  - 관련 파일: `supabase/migrations/`

- [x] **T003**: `categories` 테이블 생성 및 `tasks.category_id` 추가 마이그레이션 — `완료`
  - `categories` 테이블 스키마: `id`, `user_id`, `name`, `color`, `created_at`
  - `tasks.category_id` FK 컬럼 추가 (`categories.id` 참조, nullable)
  - 관련 파일: `supabase/migrations/`

- [x] **T004**: Supabase RLS 정책 업데이트 — `완료`
  - `categories` 테이블에 RLS 활성화
  - 정책: `user_id = auth.uid()` 기반 SELECT / INSERT / UPDATE / DELETE
  - `tasks` 테이블 정책에서 `company_id` 관련 조건 제거
  - 관련 파일: `supabase/migrations/`

- [x] **T005**: TypeScript 타입 재생성 — `완료`
  - Supabase MCP `generate_typescript_types` 도구로 `lib/supabase/database.types.ts` 재생성
  - `categories` 테이블 타입 추가 확인
  - `tasks` 타입에서 `company_id`, `assignee_id` 제거 확인
  - `review` 상태값 제거 확인
  - 관련 파일: `lib/supabase/database.types.ts`

- [x] **T006**: 업체 관련 파일 삭제 — `완료`
  - `lib/actions/companies.ts` 삭제
  - `app/(dashboard)/companies/` 디렉토리 삭제 (라우트 + 페이지)
  - `components/companies/` 디렉토리 전체 삭제 (`company-card.tsx`, `company-form-modal.tsx`, `companies-client.tsx`, `companies-skeleton.tsx`)
  - 관련 파일: 위 목록 전체

- [x] **T007**: `lib/actions/tasks.ts` companies JOIN 쿼리 제거 — `완료`
  - `getTasks()` 함수에서 `.select()` 내 `companies(name)` JOIN 제거
  - `TaskWithCompany` 타입을 `TaskWithCategory`로 교체 (category 정보 포함)
  - `category_id` 기반 필터 파라미터 추가 (`company_id` 필터 제거)
  - `lib/actions/dashboard.ts`의 `getChartStats()`에서 업체별 집계 로직 제거
  - 관련 파일: `lib/actions/tasks.ts`, `lib/actions/dashboard.ts`

- [x] **T008**: 사이드바 네비게이션에서 업체 관리 메뉴 제거 — `완료`
  - `components/dashboard/sidebar-nav.tsx`에서 `/companies` 항목 제거 (`Building2` 아이콘 포함)
  - `components/dashboard/bottom-nav.tsx`에서도 업체 메뉴 제거
  - 설정 페이지(`/settings`) 메뉴 항목 추가 (`Settings` 아이콘)
  - 관련 파일: `components/dashboard/sidebar-nav.tsx`, `components/dashboard/bottom-nav.tsx`

---

### Phase 2 — 핵심 기능 전환

> 예상 소요 기간: 3~5일

업체 중심 UI를 카테고리 중심으로 전환하고, 1인 사용자에 최적화된 레이아웃으로 재구성합니다.
설정 페이지를 신규 생성하여 프로필 편집과 카테고리 관리를 통합합니다.

- [x] **T009**: 대시보드 재구성 — `완료`
  - `components/dashboard/company-task-chart.tsx` 제거 (업체별 차트)
  - `app/(dashboard)/dashboard/page.tsx`에서 `CompanyTaskChart` 임포트 및 렌더링 제거
  - '이번 주 마감 업무' 카드 추가 (7일 이내 마감 + 미완료 카운트)
  - '오늘 할 일' 섹션 추가: 오늘 마감인 업무 목록 인라인 표시
  - 요약 카드 레이아웃 조정 (2x2 그리드 또는 단일 행)
  - 관련 파일: `app/(dashboard)/dashboard/page.tsx`, `lib/actions/dashboard.ts`

- [x] **T010**: 업무 관리 페이지 칸반 전환 — `완료`
  - 칸반 컬럼을 3개로 축소: `pending`(할일) / `in_progress`(진행중) / `done`(완료)
  - `components/tasks/filter-bar.tsx`에서 업체 필터 제거, 카테고리 필터 드롭다운 추가
  - `components/tasks/task-card.tsx`에서 업체명(`company_name`) 표시 제거
  - 카드에 카테고리 뱃지 추가 (카테고리 색상 반영)
  - 관련 파일: `components/tasks/kanban-column.tsx`, `components/tasks/filter-bar.tsx`, `components/tasks/task-card.tsx`, `components/tasks/tasks-client.tsx`

- [x] **T011**: 업무 등록/수정 폼 전환 — `완료`
  - `components/tasks/task-form-modal.tsx`에서 업체 선택 필드 제거
  - 담당자(`assignee_id`) 필드 제거
  - 카테고리 선택 `<Select>` 필드 추가 (categories 목록 조회 후 렌더링)
  - `lib/actions/tasks.ts`의 `createTask()` / `updateTask()` 파라미터에서 `company_id`, `assignee_id` 제거
  - 관련 파일: `components/tasks/task-form-modal.tsx`, `lib/actions/tasks.ts`

- [x] **T012**: 카테고리 관리 Server Action 신규 작성 — `완료`
  - `lib/actions/categories.ts` 파일 신규 생성
  - `getCategories()`: 현재 사용자의 카테고리 목록 조회
  - `createCategory(values)`: 카테고리 생성 (name, color)
  - `updateCategory(id, values)`: 카테고리 수정
  - `deleteCategory(id)`: 카테고리 삭제 (연결된 tasks의 category_id는 null로 처리)
  - 반환 타입: `ActionResult<T>` 패턴 준수 (`lib/actions/types.ts` 참조)
  - 관련 파일: `lib/actions/categories.ts` (신규)

- [x] **T013**: 설정 페이지 신규 생성 — `완료`
  - `app/(dashboard)/settings/page.tsx` 신규 생성
  - 프로필 편집 섹션: `display_name`, `phone` 필드 편집 폼 (`lib/actions/profile.ts` 활용)
  - 카테고리 관리 섹션: 카테고리 목록 표시, 추가/수정/삭제 인라인 UI
  - 카테고리 색상 선택기 (미리 정의된 색상 팔레트 제공)
  - 관련 파일: `app/(dashboard)/settings/page.tsx` (신규), `lib/actions/categories.ts`

- [x] **T014**: 업무 카드 및 상세 시트 UI 업데이트 — `완료`
  - `components/tasks/task-card.tsx`: 업체명 제거, 카테고리 뱃지 추가
  - `components/tasks/task-detail-sheet.tsx`: 업체/담당자 필드 제거, 카테고리 표시 추가
  - `review` 상태 관련 UI 요소 전체 제거 (뱃지 색상 정의, 상태 선택 옵션 등)
  - 관련 파일: `components/tasks/task-card.tsx`, `components/tasks/task-detail-sheet.tsx`

---

### Phase 3 — 캘린더 강화

> 예상 소요 기간: 2~3일

월간 뷰만 존재하던 캘린더를 주간/일간 뷰까지 지원하는 풀 캘린더로 확장합니다.
업체 필터를 카테고리 필터로 교체합니다.

- [x] **T015**: 캘린더 페이지 뷰 전환 탭 UI 추가 — `완료`
  - `app/(dashboard)/calendar/page.tsx`에 뷰 상태 관리 추가 (`monthly` / `weekly` / `daily`)
  - 탭 컴포넌트(`shadcn Tabs`) 또는 토글 버튼으로 뷰 전환 UI 구현
  - 각 뷰에 대응하는 컴포넌트 조건부 렌더링 구조 작성
  - 관련 파일: `app/(dashboard)/calendar/page.tsx`

- [x] **T016**: 주간 뷰 컴포넌트 구현 — `완료`
  - `components/calendar/weekly-calendar.tsx` 신규 생성
  - 7일 컬럼 레이아웃 (현재 주 기준, 이전/다음 주 네비게이션)
  - 각 날짜 컬럼에 해당 날짜 마감 업무 카드 표시
  - 카테고리 뱃지 및 우선순위 색상 반영
  - 관련 파일: `components/calendar/weekly-calendar.tsx` (신규)

- [x] **T017**: 일간 뷰 컴포넌트 구현 — `완료`
  - `components/calendar/daily-calendar.tsx` 신규 생성
  - 선택한 날짜의 업무 목록 표시 (마감일 기준)
  - 빠른 업무 추가 버튼 (해당 날짜를 due_date로 선택한 상태로 폼 모달 오픈)
  - 업무 완료 상태 토글 인라인 지원
  - 관련 파일: `components/calendar/daily-calendar.tsx` (신규)

- [x] **T018**: 캘린더 업체 필터 → 카테고리 필터 교체 — `완료`
  - `components/calendar/monthly-calendar.tsx`에서 `companies` prop 및 업체 필터 UI 제거
  - `categories` prop 추가, 카테고리 기반 필터 토글 버튼 UI로 교체
  - `getTasksForDay()` 필터 로직을 `company_id` → `category_id` 기준으로 변경
  - 주간/일간 뷰 컴포넌트에도 동일한 카테고리 필터 props 전달
  - 관련 파일: `components/calendar/monthly-calendar.tsx`, `app/(dashboard)/calendar/page.tsx`

- [x] **T019**: 월간 캘린더 카테고리 색상 뱃지 반영 — `완료`
  - 날짜 셀의 업무 항목에 카테고리 색상 도트 표시 (기존 priority 도트 보완 또는 교체)
  - Popover 상세 뷰에 카테고리 뱃지 추가 (`category.color` 기반 인라인 스타일)
  - 카테고리 미지정 업무는 기본 회색 처리
  - 관련 파일: `components/calendar/monthly-calendar.tsx`

---

### Phase 4 — 알림 시스템 1인화

> 예상 소요 기간: 1~2일

업체 단위로 분산되던 카카오 알림톡 발송 대상을 사용자 본인의 전화번호로 단일화합니다.

- [x] **T020**: `/api/cron/daily-notify` 발송 대상 변경 — `완료`
  - 기존: companies 테이블 기반 다건 발송
  - 변경: `profiles.phone` 기반 단건 발송 (로그인된 모든 사용자 대상)
  - `sendKakaoNotificationBulk()` → `sendKakaoNotification()` 단건으로 교체 또는 profiles 순회로 변경
  - 관련 파일: `app/api/cron/daily-notify/route.ts`

- [x] **T021**: `/api/notify/task` 발송 대상 변경 — `완료`
  - 기존: task의 company.phone으로 발송
  - 변경: `profiles.phone` (업무 생성자 본인 번호)로 발송
  - `createClient()` → 사용자 세션 기반으로 `profiles.phone` 조회
  - 관련 파일: `app/api/notify/task/route.ts`, `lib/actions/notifications.ts`

- [x] **T022**: `notification_logs` company_id 참조 제거 — `완료`
  - Supabase 마이그레이션: `notification_logs.company_id` 컬럼 DROP
  - `notification_schedules.company_id` 컬럼 DROP
  - `lib/supabase/database.types.ts` 타입 재생성 반영
  - 관련 파일: `supabase/migrations/`, `lib/supabase/database.types.ts`

- [ ] **T023**: Solapi 알림 메시지 템플릿 변경 — `대기중`
  - 기존 업체 기반 메시지(`업체명: OOO`) → 카테고리 기반 메시지(`카테고리: OOO`)로 교체
  - `lib/solapi.ts`의 메시지 생성 로직 수정
  - 일일 요약 알림에 카테고리별 업무 수 포함 여부 결정 및 적용
  - 관련 파일: `lib/solapi.ts`

- [ ] **T024**: 설정 페이지에 알림 전화번호 편집 UI 연결 — `대기중`
  - T013에서 생성한 설정 페이지의 `phone` 필드와 알림 설명 문구 연결
  - `profiles.phone` 저장 시 `lib/actions/profile.ts`의 `updateProfile()` 활용
  - 전화번호 형식 유효성 검사 추가 (010-XXXX-XXXX 패턴)
  - 관련 파일: `app/(dashboard)/settings/page.tsx`, `lib/actions/profile.ts`

- [ ] **T025**: 신규 카카오 알림톡 템플릿 등록 — `대기중`
  - Solapi 콘솔에서 카테고리 기반 업무 등록 즉시 알림 템플릿 신규 등록
  - 일일 요약 템플릿 내용 업데이트 (업체 관련 문구 제거)
  - `.env.local`의 `KAKAO_TASK_TEMPLATE_ID`, `KAKAO_DAILY_TEMPLATE_ID` 업데이트
  - 관련 파일: `.env.local`, `CLAUDE.md` 환경 변수 섹션 업데이트

---

### Phase 5 — 품질 마무리

> 예상 소요 기간: 1일

v2 전환 이후 전체 화면의 빈 상태, 에러 처리, 반응형 레이아웃, 배포 환경을 점검합니다.

- [x] **T026**: 빈 상태(Empty State) UI 전체 정비 — `완료`
  - 칸반 컬럼별 상태 맞춤 EmptyState 메시지/아이콘 적용 (지연/대기/진행중/완료)
  - 캘린더 날짜 빈 상태: DailyCalendar "이 날은 마감 업무가 없습니다." 기존 유지 확인
  - 관련 파일: `components/tasks/kanban-column.tsx`

- [x] **T027**: 에러 핸들링 및 로딩 스켈레톤 일관성 확인 — `완료`
  - 설정 페이지 `loading.tsx` 스켈레톤 신규 추가
  - Server Action 에러 `toast.error()` 모든 액션에서 일관성 확인 완료
  - `kanban-skeleton.tsx` 업체 관련 요소 이미 제거됨 확인
  - 관련 파일: `app/(dashboard)/settings/loading.tsx` (신규)

- [x] **T028**: 반응형 레이아웃 점검 — `완료`
  - 대시보드 카드: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` 확인
  - 설정 페이지: `max-w-lg` 너비 제한 확인
  - 주간 캘린더: `overflow-x-auto` + `min-w-[560px]` 확인
  - 사이드바/모바일네비 완전 반응형 구현 확인

- [x] **T029**: 빌드 확인 — `완료`
  - `npm run type-check` 타입 에러 0개 통과
  - `npm run build` 빌드 성공 (22페이지 생성)
  - `dynamic = 'force-dynamic'` 빌드 에러 수정 (`send-scheduled/route.ts`)
  - Vercel 배포는 git push 후 자동 진행

---

### Phase 6 — 거래처 관리

> 예상 소요 기간: 2~3일

거래처(클라이언트/비즈니스 파트너) 정보를 등록하고 관리하는 섹션을 신규 추가합니다.
기존 B2B 구조에서 제거된 `companies` 기능을 1인 사용자 관점의 거래처 주소록으로 재설계합니다.
Supabase Storage를 활용한 로고/사진 업로드를 지원합니다.

- [x] **T030**: `clients` 테이블 생성 및 RLS 정책 설정 — `완료`
  - Supabase 마이그레이션 파일 신규 생성: `supabase/migrations/YYYYMMDD_add_clients_table.sql`
  - `clients` 테이블 스키마: `id` (uuid PK), `user_id` (uuid FK → auth.users), `name` (text, NOT NULL), `contact_name` (text), `phone` (text), `email` (text), `website_url` (text), `image_url` (text), `created_at` (timestamptz), `updated_at` (timestamptz)
  - RLS 활성화 및 정책 추가: `user_id = auth.uid()` 기반 SELECT / INSERT / UPDATE / DELETE
  - Supabase Storage `client-images` 버킷 생성 (public 버킷, 파일 크기 제한 2MB)
  - Storage RLS 정책: 인증 사용자 본인 소유 파일만 업로드/삭제 허용
  - Supabase MCP `generate_typescript_types`로 `lib/supabase/database.types.ts` 재생성
  - 관련 파일: `supabase/migrations/`, `lib/supabase/database.types.ts`

- [x] **T031**: `lib/actions/clients.ts` Server Action 작성 — `완료`
  - `getClients()`: 현재 사용자의 거래처 목록 조회 (name 오름차순 정렬)
  - `getClient(id)`: 단건 거래처 조회
  - `createClient(values)`: 거래처 생성 (`name` 필수 유효성 검사 포함)
  - `updateClient(id, values)`: 거래처 수정 (본인 소유 여부 확인)
  - `deleteClient(id)`: 거래처 삭제 (본인 소유 여부 확인, Storage 이미지도 함께 삭제)
  - 반환 타입: `ActionResult<T>` 패턴 준수 (`lib/actions/types.ts` 참조)
  - 관련 파일: `lib/actions/clients.ts` (신규)

- [x] **T032**: 거래처 목록 페이지 구현 — `완료`
  - `app/(dashboard)/clients/page.tsx` 신규 생성 (Server Component)
  - `app/(dashboard)/clients/loading.tsx` 스켈레톤 컴포넌트 신규 생성
  - `components/clients/clients-client.tsx` 클라이언트 컴포넌트 신규 생성
  - 카드 그리드 레이아웃: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
  - 각 카드에 로고 이미지(없을 경우 이니셜 폴백 Avatar), 거래처명, 담당자, 연락처, 이메일, 사이트 URL 표시
  - 우상단 "거래처 추가" 버튼으로 등록 모달 오픈
  - 빈 상태(Empty State): "등록된 거래처가 없습니다." 안내 메시지 및 추가 버튼
  - 관련 파일: `app/(dashboard)/clients/page.tsx` (신규), `app/(dashboard)/clients/loading.tsx` (신규), `components/clients/clients-client.tsx` (신규)

- [x] **T033**: 거래처 등록/수정 폼 모달 구현 — `완료`
  - `components/clients/client-form-modal.tsx` 신규 생성
  - 필드 구성: 거래처명(필수), 담당자, 연락처, 이메일, 사이트 URL, 사진/로고 업로드
  - `react-hook-form` + `zod` 스키마 유효성 검사 (이메일 형식, URL 형식 검사 포함)
  - 등록 모드(create) / 수정 모드(update) 분기 처리 (`clientId` prop 유무로 판단)
  - 저장 성공 시 `toast.success()`, 실패 시 `toast.error()` 표시
  - 수정 모드에서 기존 이미지 미리보기 표시 및 이미지 교체/삭제 지원
  - 관련 파일: `components/clients/client-form-modal.tsx` (신규)

- [x] **T034**: Supabase Storage 이미지 업로드 유틸리티 구현 — `완료`
  - `lib/actions/storage.ts` 신규 생성 (또는 `clients.ts` 내부에 통합)
  - `uploadClientImage(file, userId)`: `client-images/{userId}/{uuid}.{ext}` 경로로 업로드, public URL 반환
  - `deleteClientImage(imageUrl)`: Storage에서 파일 삭제
  - 파일 타입 검사: `image/jpeg`, `image/png`, `image/webp`만 허용
  - 파일 크기 검사: 2MB 초과 시 에러 반환
  - 폼 모달에서 파일 선택 즉시 미리보기 표시 (`URL.createObjectURL` 활용)
  - 관련 파일: `lib/actions/storage.ts` (신규), `components/clients/client-form-modal.tsx`

- [x] **T035**: 사이드바 네비게이션에 거래처 메뉴 추가 — `완료`
  - `components/dashboard/sidebar-nav.tsx`에 `/clients` 항목 추가 (`Building2` 아이콘 사용)
  - `components/dashboard/bottom-nav.tsx` 모바일 하단 네비게이션에도 동일 항목 추가
  - 기존 메뉴 순서: 대시보드 → 업무 → 캘린더 → **거래처** → 설정
  - 관련 파일: `components/dashboard/sidebar-nav.tsx`, `components/dashboard/bottom-nav.tsx`

---

## 개발 워크플로우

### 작업 순서 원칙

1. **Phase 1 완료 후 Phase 2 시작**: DB 스키마와 TypeScript 타입이 확정된 이후 UI 작업 진행
2. **T005(타입 재생성) 이후 모든 코드 작업**: 컴파일 에러 없는 상태에서 개발
3. **T012(카테고리 Action) 완료 후 T013(설정 페이지) 착수**: Action 없이 UI 작업 불가
4. **Phase 3은 Phase 2와 병렬 진행 가능**: 캘린더 컴포넌트는 categories 타입만 있으면 독립 작업 가능

### 커밋 규칙

- 커밋 메시지는 한국어로 작성
- 태스크 단위로 커밋 (예: `feat: categories 테이블 마이그레이션 추가 (T003)`)
- Phase 완료 시 태그 생성 (예: `v2-phase1`)

### 타입 안전성 유지

- 스키마 변경 후 반드시 `generate_typescript_types` 실행
- `npm run type-check`로 타입 에러 없음 확인 후 다음 태스크 진행
- `lib/supabase/database.types.ts`를 직접 수정하지 않고 MCP 도구로만 재생성

---

## 파일 변경 영향 범위 요약

| 삭제 대상 파일/디렉토리 | 사유 |
|------------------------|------|
| `lib/actions/companies.ts` | 업체 기능 전체 제거 |
| `app/(dashboard)/companies/` | 업체 관리 라우트 제거 |
| `components/companies/` | 업체 관련 컴포넌트 전체 제거 |
| `components/dashboard/company-task-chart.tsx` | 업체별 차트 제거 |

| 신규 생성 파일 | 사유 |
|---------------|------|
| `lib/actions/categories.ts` | 카테고리 CRUD Action |
| `app/(dashboard)/settings/page.tsx` | 설정 페이지 |
| `components/calendar/weekly-calendar.tsx` | 주간 뷰 컴포넌트 |
| `components/calendar/daily-calendar.tsx` | 일간 뷰 컴포넌트 |
| `supabase/migrations/YYYYMMDD_v2_schema.sql` | v2 스키마 마이그레이션 |
| `supabase/migrations/YYYYMMDD_add_clients_table.sql` | clients 테이블 마이그레이션 (Phase 6) |
| `lib/actions/clients.ts` | 거래처 CRUD Action (Phase 6) |
| `lib/actions/storage.ts` | Storage 이미지 업로드 유틸리티 (Phase 6) |
| `app/(dashboard)/clients/page.tsx` | 거래처 목록 페이지 (Phase 6) |
| `app/(dashboard)/clients/loading.tsx` | 거래처 목록 스켈레톤 (Phase 6) |
| `components/clients/clients-client.tsx` | 거래처 목록 클라이언트 컴포넌트 (Phase 6) |
| `components/clients/client-form-modal.tsx` | 거래처 등록/수정 폼 모달 (Phase 6) |

| 주요 수정 파일 | 변경 내용 |
|--------------|----------|
| `lib/supabase/database.types.ts` | 타입 재생성 (categories 추가, company_id 제거) |
| `lib/actions/tasks.ts` | company JOIN 제거, category 필터 추가 |
| `lib/actions/dashboard.ts` | 업체별 차트 집계 제거, 이번 주 통계 추가 |
| `components/dashboard/sidebar-nav.tsx` | 업체 메뉴 제거, 설정 메뉴 추가, 거래처 메뉴 추가 (Phase 6) |
| `components/dashboard/bottom-nav.tsx` | 거래처 메뉴 추가 (Phase 6) |
| `components/tasks/task-form-modal.tsx` | 업체/담당자 필드 제거, 카테고리 선택 추가 |
| `components/tasks/task-card.tsx` | 업체명 제거, 카테고리 뱃지 추가 |
| `components/calendar/monthly-calendar.tsx` | 업체 필터 → 카테고리 필터 교체 |
| `app/api/cron/daily-notify/route.ts` | 발송 대상 profiles.phone으로 변경 |
| `app/api/notify/task/route.ts` | 발송 대상 사용자 본인 번호로 변경 |
