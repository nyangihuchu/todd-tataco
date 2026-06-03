# Development Guidelines

## Project Overview

- **앱 목적:** 업체(companies)별 업무(tasks) 관리 + 카카오 알림톡 발송 B2B SaaS
- **스택:** Next.js 15 App Router, Supabase (Auth + DB), Tailwind CSS, shadcn/ui (new-york), TypeScript
- **배포:** Vercel (Fluid Compute, Cron Jobs)
- **알림:** Solapi SDK → 카카오 알림톡 단건/일괄 발송

---

## Project Architecture

```
app/
  auth/           # 인증 라우트 (login, sign-up, confirm, forgot-password, update-password, error)
  api/
    notify/task/  # POST — 업무 즉시 알림
    cron/daily-notify/ # GET — Vercel Cron 일일 요약 알림
  protected/      # 인증 필요 섹션
  page.tsx        # 공개 랜딩
components/
  ui/             # shadcn 컴포넌트만 위치
lib/
  supabase/
    server.ts     # 서버용 Supabase 클라이언트
    client.ts     # 브라우저용 Supabase 클라이언트
    proxy.ts      # 세션 갱신 (미들웨어 내부)
    database.types.ts  # 자동생성 — 직접 편집 금지
  actions/
    notifications.ts  # Server Action: sendTaskNotification
  solapi.ts       # Solapi 래퍼 (sendKakaoNotification, sendKakaoNotificationBulk)
  utils.ts        # cn(), hasEnvVars
proxy.ts          # Next.js 미들웨어 진입점
vercel.json       # Cron 스케줄 정의
supabase/migrations/  # SQL 마이그레이션 파일
```

---

## Code Standards

- 들여쓰기 **2칸** (탭 금지)
- 세미콜론 **사용 금지**
- 따옴표 **작은따옴표** (`'`) 사용
- 모든 내부 임포트는 `@/` 경로 별칭 사용
- 주석은 한국어로 작성, 코드가 명확하면 주석 생략
- 커밋 메시지: Conventional Commits + 한국어 subject, 100자 이내

---

## Supabase Client Selection Rules

| 사용 위치 | 사용할 클라이언트 |
|---|---|
| Server Component, Route Handler, Server Action | `lib/supabase/server.ts` → `await createClient()` |
| `'use client'` 컴포넌트 | `lib/supabase/client.ts` → `createClient()` |

- **금지:** 서버 클라이언트를 전역 변수에 저장하는 것
- **금지:** 클라이언트 컴포넌트에서 서버 클라이언트 임포트

---

## Component Rules

- UI 기본 요소 추가: 반드시 `npx shadcn add <컴포넌트명>` 사용
- **금지:** `components/ui/` 폴더에 shadcn이 아닌 커스텀 컴포넌트 직접 작성
- Tailwind 클래스 병합: `lib/utils.ts:cn()` 사용
- 아이콘: `lucide-react`만 사용
- 상태 없는 데이터 페칭 → Server Component 우선
- 인터랙션(폼, 이벤트, 클라이언트 상태) → `'use client'` 컴포넌트

---

## Database & Schema Rules

- DB 스키마(테이블/컬럼) 변경 시:
  1. `supabase/migrations/` 에 타임스탬프 포함 SQL 파일 추가 (`YYYYMMDDHHMMSS_설명.sql`)
  2. Supabase MCP `generate_typescript_types` 실행
  3. 생성 결과를 `lib/supabase/database.types.ts`에 반영
- **금지:** `lib/supabase/database.types.ts` 직접 수동 편집

### 현재 테이블 및 주요 컬럼

| 테이블 | 주요 컬럼 |
|---|---|
| `profiles` | id(auth.users 참조), full_name, username, phone |
| `companies` | id, name, contact_name, phone, email, created_by(profiles) |
| `tasks` | id, title, company_id, assignee_id, status, priority, start_date, due_date, memo |
| `comments` | id, task_id, author_id, content |
| `notification_logs` | id, type(`daily`\|`task_created`), company_id, task_id, phone, status(`sent`\|`failed`) |

---

## Notification System Rules

- 알림 발송 진입점: `lib/solapi.ts` — 이 파일 외부에서 `SolapiMessageService` 직접 사용 금지
- `sendKakaoNotification()` — 단건, `sendKakaoNotificationBulk()` — 다건
- `notification_logs` INSERT는 **service_role 클라이언트** 필요 (현재 미구현, 쿠키 세션 없는 Cron Route에서 일반 클라이언트로는 RLS 우회 불가)
- 새 알림 템플릿 추가 시:
  1. Solapi 콘솔에서 템플릿 등록
  2. `.env.local.example`에 템플릿 ID 환경 변수 추가
  3. `lib/solapi.ts`에서 해당 변수 참조

---

## API Route Rules

- **인증 필요 Route (`/api/notify/task`):** `supabase.auth.getUser()`로 검증 후 처리
- **Cron Route (`/api/cron/daily-notify`):** `Authorization: Bearer <CRON_SECRET>` 헤더 검증 필수, 미검증 시 401 반환
- Zod로 요청 body 검증 (`bodySchema.safeParse`)
- 에러 응답: `NextResponse.json({ error: '...' }, { status: N })`

---

## Authentication Middleware Rules

- `proxy.ts`: `updateSession(request)` 호출만 유지, 로직 추가 금지
- `lib/supabase/proxy.ts:updateSession` 내부에서 `createServerClient` 직후 `getClaims()` 사이에 **코드 삽입 금지** (무작위 로그아웃 발생)
- 인증 예외 경로: `/`, `/auth/*`, `/login` — 추가 시 proxy.ts matcher 패턴 수정

---

## Environment Variable Rules

- 새 환경 변수 추가 시 반드시 `.env.local.example`에도 추가 (빈 값 또는 예시값과 주석 포함)
- `NEXT_PUBLIC_` 접두사: 브라우저에 노출되어도 안전한 값만 사용
- Vercel 배포 시 Vercel 대시보드 환경 변수에도 동일하게 등록

---

## Vercel Cron Rules

- Cron 경로는 `vercel.json`의 `crons` 배열에 등록
- 스케줄: UTC 기준 작성 (KST = UTC+9)
- 현재 등록: `/api/cron/daily-notify` — `0 0 * * *` (매일 UTC 00:00 = KST 09:00)
- 새 Cron 추가 시 Route Handler에 `CRON_SECRET` 인증 로직 필수

---

## Key File Interaction Map

| 이 파일을 수정하면 | 함께 수정해야 할 파일 |
|---|---|
| `supabase/migrations/*.sql` (테이블 추가/변경) | `lib/supabase/database.types.ts` (재생성) |
| `.env.local` (새 변수 추가) | `.env.local.example` |
| `vercel.json` (Cron 추가) | 해당 Route Handler (CRON_SECRET 인증 추가) |
| `lib/solapi.ts` (새 발송 함수 추가) | 호출하는 Route Handler 또는 Server Action |

---

## Prohibited Actions

- `lib/supabase/database.types.ts` 직접 편집
- `components/ui/` 에 shadcn 이외 컴포넌트 직접 작성
- 서버 Supabase 클라이언트를 모듈 레벨 전역 변수에 저장
- `proxy.ts` 또는 `lib/supabase/proxy.ts` 내 세션 갱신 로직 사이에 임의 코드 삽입
- `notification_logs` INSERT를 일반(쿠키 기반) 클라이언트로 시도 — service_role 클라이언트 사용 필요
- `SolapiMessageService`를 `lib/solapi.ts` 외부에서 직접 인스턴스화
- `/api/cron/*` Route에 `CRON_SECRET` 인증 없이 로직 노출
- 환경 변수를 `.env.local.example` 없이 `.env.local`에만 추가

---

## AI Decision Tree

```
새 기능 구현 요청
├── UI가 필요한가?
│   ├── shadcn에 해당 컴포넌트 있음 → npx shadcn add 후 사용
│   └── 없음 → components/ 에 직접 작성 (components/ui/ 제외)
├── 데이터 페칭이 필요한가?
│   ├── 인터랙션 없음 → Server Component + lib/supabase/server.ts
│   └── 인터랙션 있음 → 'use client' + lib/supabase/client.ts 또는 Server Action
├── DB 스키마 변경이 필요한가?
│   └── YES → migrations/ SQL 작성 → database.types.ts 재생성
├── 알림 발송이 필요한가?
│   ├── 즉시 발송 → /api/notify/task 확장 또는 새 Route
│   └── 예약/반복 발송 → Cron Route + vercel.json 등록
└── 환경 변수가 필요한가?
    └── YES → .env.local + .env.local.example 동시 추가
```
