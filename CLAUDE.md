# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

업체(companies)별 업무(tasks) 관리와 카카오 알림톡 발송을 지원하는 B2B 업무 관리 앱입니다.
Next.js 15 App Router + Supabase + Tailwind CSS + shadcn/ui (new-york 스타일)로 구성됩니다.

## 명령어

```bash
npm run dev          # localhost:3000에서 개발 서버 시작
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 실행
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 포맷 적용
npm run type-check   # TypeScript 타입 검사 (빌드 없이)
```

테스트 환경은 구성되어 있지 않습니다. 변경사항은 개발 서버를 직접 실행하여 확인하세요.

## 환경 변수

`.env.local`에 아래 변수를 설정하세요.

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Cron 라우트에서 RLS 우회 시 사용 (서버 전용)

# 서비스 URL (알림 메시지 내 링크)
NEXT_PUBLIC_SITE_URL=https://todd-tataco.vercel.app

# Solapi (카카오 알림톡)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_NUMBER=
KAKAO_CHANNEL_ID=          # pfId
KAKAO_DAILY_TEMPLATE_ID=   # 일일 요약 템플릿
KAKAO_TASK_TEMPLATE_ID=    # 업무 등록 즉시 알림 템플릿

# Vercel Cron 보안
CRON_SECRET=
```

`lib/utils.ts:hasEnvVars`는 Supabase 환경 변수 부재 시 튜토리얼 UI를 숨기는 임시 처리입니다.

## 아키텍처

### 데이터베이스 테이블

- `profiles` — 인증 유저와 1:1 연결 (트리거로 자동 생성)
- `companies` — 업체 정보 (name, contact_name, phone)
- `tasks` — 업무 (status: `pending`|`in_progress`|`review`|`done`, priority: `high`|`medium`|`low`)
- `comments` — 업무 댓글
- `notification_logs` — 카카오 알림 발송 이력 (type: `daily`|`task_created`)

`lib/supabase/database.types.ts`는 자동 생성된 TypeScript 스키마입니다. 스키마 변경 후에는 Supabase MCP 도구(`generate_typescript_types`)로 재생성하세요.

### Supabase 클라이언트 패턴

- **서버** (`lib/supabase/server.ts`): async `createClient()` — Server Component, Route Handler, Server Action에서 사용. 전역 변수에 저장하지 않도록 주의.
- **클라이언트** (`lib/supabase/client.ts`): sync `createClient()` — `"use client"` 컴포넌트에서 사용.

### 인증 아키텍처

세션 관리는 `proxy.ts`(Next.js 미들웨어 역할)를 통해 이루어지며, 내부적으로 `lib/supabase/proxy.ts:updateSession`을 호출합니다. `createServerClient`와 `getClaims()` 사이에 코드를 추가하면 사용자가 무작위로 로그아웃될 수 있으니 주의하세요.

프록시는 `/`, `/auth/*`, `/login` 이외의 모든 비인증 요청을 `/auth/login`으로 리다이렉트합니다.

인증 라우트는 `app/auth/` 아래에 있습니다:

- `/auth/login` / `/auth/sign-up` — 로그인·회원가입 폼
- `/auth/forgot-password` / `/auth/update-password` — 비밀번호 재설정
- `/auth/confirm` — 이메일 OTP 검증 Route Handler (`token_hash` + `type`)
- `/auth/error` — 에러 표시

### 알림 시스템 (카카오 알림톡)

`lib/solapi.ts`가 Solapi SDK를 래핑하며 두 함수를 제공합니다:

- `sendKakaoNotification()` — 단건 발송
- `sendKakaoNotificationBulk()` — 다건 일괄 발송

알림 API 라우트:

- `POST /api/notify/task` — 업무 등록 시 즉시 알림 (인증 필요, `taskId` UUID 전달)
- `GET /api/cron/daily-notify` — Vercel Cron이 매일 UTC 00:00 (KST 09:00)에 호출, `Authorization: Bearer <CRON_SECRET>` 헤더 필요

`lib/actions/notifications.ts:sendTaskNotification` Server Action이 `/api/notify/task`를 내부 호출합니다.

`notification_logs` 테이블에 INSERT할 때는 RLS 때문에 서비스 역할(service_role) 클라이언트가 필요합니다. 현재 daily-notify 라우트에서 로그 저장은 미구현 상태입니다.

### 라우트 구조

- `/` — 공개 랜딩 페이지
- `/protected` — 인증 사용자 전용 섹션 (자체 레이아웃)

### 컴포넌트 규칙

- `components/ui/`는 shadcn 컴포넌트 — 추가 시 `npx shadcn add <컴포넌트명>`
- `lib/utils.ts:cn()`으로 Tailwind 클래스 병합
- 아이콘은 `lucide-react`
- 다크 모드는 `next-themes`의 `class` 전략

### 경로 별칭

`@/`는 프로젝트 루트를 가리킵니다. 모든 내부 임포트에 사용하세요.

## 코드 품질 도구

- **Husky** — pre-commit에서 lint-staged 실행, commit-msg에서 commitlint 검사
- **commitlint** — `@commitlint/config-conventional` 기반, subject 대소문자 제한 없음, 최대 100자
- **lint-staged** — `*.{ts,tsx}` 파일에 ESLint + Prettier 자동 적용
