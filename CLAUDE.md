# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code (claude.ai/code)에게 제공되는 가이드입니다.

## 프로젝트 개요

Next.js 15와 Supabase를 사용한 풀스택 웹 애플리케이션 스타터 킷입니다. App Router, Server Components, 그리고 Supabase Auth를 활용한 인증 시스템을 포함하고 있습니다.

## 명령어

```bash
npm run dev      # localhost:3000에서 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
```

테스트 환경은 구성되어 있지 않습니다. 변경사항은 개발 서버를 직접 실행하여 확인하세요.

## 아키텍처

**스택:** Next.js 최신 버전 (App Router) + Supabase + Tailwind CSS + shadcn/ui (new-york 스타일)

**필수 환경 변수:**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`lib/utils.ts:hasEnvVars`는 환경 변수가 없을 때 튜토리얼 UI를 숨기는 용도로, 온보딩을 위한 임시 처리입니다.

### Supabase 클라이언트 패턴

두 개의 별도 클라이언트를 상황에 맞게 사용해야 합니다:

- **서버** (`lib/supabase/server.ts`): `next/headers` 쿠키를 사용하는 async `createClient()` — Server Component, Route Handler, Server Action에서 사용. Fluid compute 제약으로 인해 전역 변수에 저장하지 않도록 주의.
- **클라이언트** (`lib/supabase/client.ts`): `createBrowserClient`를 통한 sync `createClient()` — `"use client"` 컴포넌트에서 사용.

### 인증 아키텍처

세션 관리는 `proxy.ts`(Next.js 미들웨어 역할)를 통해 이루어지며, 내부적으로 `lib/supabase/proxy.ts:updateSession`을 호출합니다. 모든 요청마다 클라이언트 생성 직후 `supabase.auth.getClaims()`를 호출하여 세션을 갱신합니다. `createServerClient`와 `getClaims()` 사이에 코드를 추가하면 사용자가 무작위로 로그아웃될 수 있으니 주의하세요.

인증 라우트는 `app/auth/` 아래에 있습니다:

- `/auth/login` → `LoginForm` 클라이언트 컴포넌트
- `/auth/sign-up` → `SignUpForm` 클라이언트 컴포넌트
- `/auth/forgot-password` / `/auth/update-password` — 비밀번호 재설정 플로우
- `/auth/confirm` — 이메일 OTP 검증을 위한 Route Handler (`token_hash` + `type` 파라미터)
- `/auth/error` — 에러 표시 페이지

프록시는 `/`, `/auth/*`, `/login` 이외의 모든 비인증 요청을 `/auth/login`으로 리다이렉트합니다.

### 라우트 구조

- `/` — 공개 랜딩 페이지, `hasEnvVars` 여부에 따라 Supabase 연결 안내 또는 회원가입 튜토리얼을 표시
- `/protected` — 인증된 사용자 전용 섹션, 자체 레이아웃 보유; `UserDetails`는 `Suspense`를 활용한 스트리밍 Server Component

### 데이터베이스

`lib/supabase/database.types.ts`는 자동 생성된 TypeScript 스키마입니다. 스키마 변경 후에는 Supabase MCP 도구(`generate_typescript_types`)로 재생성하세요. 현재 테이블: `profiles` (트리거를 통해 인증 유저와 1:1 연결).

### 컴포넌트 규칙

- `components/ui/`의 UI 기본 요소는 shadcn 컴포넌트 — 추가 시 `npx shadcn add <컴포넌트명>` 사용
- `lib/utils.ts`의 `cn()`으로 Tailwind 클래스 병합 (clsx + tailwind-merge)
- 아이콘은 `lucide-react` 사용
- 테마 전환은 `next-themes`를 통해 처리하며, 다크 모드는 `class` 전략 사용

### 경로 별칭

`@/`는 프로젝트 루트를 가리킵니다. 모든 내부 임포트에 사용하세요.
