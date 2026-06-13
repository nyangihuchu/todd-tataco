# TATACO 방향 전환 PRD — B2B 협업 업무관리 → 1인 개인 업무 일정관리

> 작성일: 2026-06-13
> 버전: 2.0.0 (방향 전환)
> 기반 문서: docs/prd.md (v1.0.0)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [AS-IS vs TO-BE 비교](#2-as-is-vs-to-be-비교)
3. [타겟 사용자](#3-타겟-사용자)
4. [핵심 기능 목록](#4-핵심-기능-목록)
5. [DB 스키마 변경안](#5-db-스키마-변경안)
6. [라우트 변경안](#6-라우트-변경안)
7. [UI/UX 방향](#7-uiux-방향)
8. [알림 시스템 변경안](#8-알림-시스템-변경안)
9. [마이그레이션 고려사항](#9-마이그레이션-고려사항)
10. [개발 우선순위 (Phase)](#10-개발-우선순위-phase)

---

## 1. 프로젝트 개요

### 전환 배경

TATACO는 원래 복수의 외부 업체와 협업하는 B2B 업무관리 앱으로 기획되었다.
그러나 실제 사용 패턴을 검토한 결과, 외부 업체와의 공유보다 **개인이 해야 할 일을 날짜·우선순위 기준으로 관리하는 니즈**가 더 명확하게 드러났다.

업체(companies) 개념이 핵심 기능을 복잡하게 만드는 요소로 작용했으며, 1인 사용자가 자신의 태스크를 직관적으로 관리하는 데 방해가 되었다.
이에 따라 서비스 방향을 **1인 사용자 중심의 개인 업무 일정관리 앱**으로 전환한다.

### 전환 목적

- 업체(companies) 의존 구조 제거 → 개인 중심의 단순한 태스크 관리
- 캘린더 뷰 강화 → 날짜 기반 업무 계획 및 실행 지원
- 카카오 알림톡을 자기 자신에게만 발송하는 1인용 알림으로 단순화
- 전반적인 UX를 개인 생산성 앱 수준으로 정돈

---

## 2. AS-IS vs TO-BE 비교

### 핵심 방향 비교

| 구분 | AS-IS (B2B 협업) | TO-BE (1인 개인 관리) |
|------|-----------------|----------------------|
| 사용 주체 | 내부 팀원 1~3명, 외부 업체 담당자 | 1인 (단독 사용자) |
| 핵심 데이터 단위 | 업체(company) + 업무(task) | 업무(task) + 카테고리(category) |
| 업무 연결 기준 | 업체(company_id FK) | 카테고리/태그 (선택 사항) |
| 상태 흐름 | 대기 → 진행중 → 확인요청 → 완료 | 할일 → 진행중 → 완료 |
| 댓글 기능 | 팀원 간 커뮤니케이션 | 개인 메모/노트 (단독 작성) |
| 알림 수신자 | 업체 담당자 전화번호 다수 | 본인 전화번호 단수 |
| 캘린더 | 업체 필터 중심 월간 뷰 | 월간/주간/일간 멀티 뷰 |
| 대시보드 | 팀 전체 업무 요약 + 차트 | 오늘/이번 주 내 업무 요약 |

### 제거·변경·유지 기능 요약

| 기능 | 처리 방향 | 이유 |
|------|----------|------|
| 업체 관리 CRUD | **제거** | 1인 사용자에게 불필요한 복잡성 |
| 업체별 업무 필터 | **제거** | 업체 개념 제거에 따라 자동 폐기 |
| 업체 기반 알림 발송 | **변경** (본인에게만) | 1인 알림으로 단순화 |
| 업무 CRUD | **유지** (스키마 수정) | 핵심 기능, company_id 제거 |
| 업무 우선순위 | **유지** | 개인 업무 집중도 관리에 유효 |
| 칸반 보드 | **유지** | 상태 흐름 관리에 유효 (컬럼 수 조정) |
| 월간 캘린더 | **유지 + 강화** | 개인 일정관리 핵심 기능 |
| 주간/일간 캘린더 | **추가** | 개인 생산성 앱 필수 뷰 |
| 대시보드 | **변경** | 업체 차트 제거, 오늘/이번 주 집중 |
| 댓글 | **변경** (개인 메모로 전환) | 협업 커뮤니케이션 → 개인 노트 |
| 카테고리(태그) | **추가** | 업체 역할을 대체할 분류 수단 |
| 반복 업무 | **추가** (Phase 2) | 개인 루틴 관리 니즈 |

---

## 3. 타겟 사용자

### 사용자 프로필

**1인 프리랜서 / 소규모 사업자 / 개인 생산성 관리자**

- 여러 클라이언트 또는 프로젝트를 동시에 진행하며 할일을 스스로 관리하는 1인
- 카카오톡, 노션, 엑셀에 흩어진 할일을 하나의 앱에서 날짜·우선순위 기준으로 통합 관리하고자 하는 사람
- 마감일이 있는 업무를 캘린더에서 한눈에 확인하고, 오전에 오늘 할 일을 알림으로 받기를 원하는 사람
- 복잡한 프로젝트 관리 툴(Jira, Asana 등)은 과하다고 느끼는 사람

### 핵심 니즈

1. 빠른 업무 등록 — 제목, 날짜, 우선순위만으로 3초 안에 업무를 추가할 수 있어야 한다
2. 오늘 할 일 파악 — 앱을 열었을 때 오늘 해야 할 일이 즉시 보여야 한다
3. 날짜 기반 계획 — 캘린더에서 언제 무엇을 해야 하는지 시각적으로 확인할 수 있어야 한다
4. 자동 알림 — 매일 아침 오늘의 업무 목록을 카카오톡으로 받아볼 수 있어야 한다

---

## 4. 핵심 기능 목록

### 4-1. 유지 기능 (기존 → 그대로 활용)

| ID | 기능명 | 변경 여부 | 비고 |
|----|--------|----------|------|
| **F001** | 기본 인증 (회원가입/로그인/로그아웃) | 유지 | 이메일/비밀번호 방식 |
| **F002** | 업무 CRUD | 스키마 수정 | company_id 제거, category_id 추가 |
| **F003** | 업무 상태 변경 (칸반) | 컬럼 수 조정 | 확인요청 컬럼 제거 → 3단계 |
| **F004** | 업무 우선순위 설정/필터 | 유지 | |
| **F005** | 월간 캘린더 | 유지 + 강화 | 주간/일간 뷰 추가 |

### 4-2. 변경 기능 (기존 → 수정하여 활용)

| ID | 기능명 | 변경 내용 |
|----|--------|----------|
| **F006** | 대시보드 요약 | 업체 차트 제거, 오늘 마감/이번 주 마감/지연 업무로 재구성 |
| **F007** | 업무별 메모 | 협업 댓글 → 개인 노트 (1인 작성, 타임라인 형태) |
| **F008** | 카카오 알림톡 | 업체 담당자 발송 제거, 본인 전화번호에만 발송 |
| **F009** | 업무 필터 | 업체 필터 제거, 카테고리 필터로 교체 |

### 4-3. 추가 기능 (신규)

| ID | 기능명 | 설명 | 관련 페이지 |
|----|--------|------|------------|
| **F010** | 카테고리 관리 | 업무를 분류하는 사용자 정의 태그/카테고리 CRUD | 설정 페이지, 업무 등록 모달 |
| **F011** | 주간 캘린더 뷰 | 7일 타임라인으로 업무 일정 확인 | 캘린더 페이지 |
| **F012** | 일간 캘린더 뷰 | 하루 단위 업무 목록 확인 | 캘린더 페이지 |
| **F013** | 사용자 프로필 설정 | 표시 이름, 알림 전화번호 저장 | 설정 페이지 |

### 4-4. 제거 기능 (폐기)

- 업체(companies) 관리 CRUD — F001(v1) 전체 제거
- 업체 기반 담당자(assignee) 구분 — tasks.assignee_id 제거 (1인 사용이므로 불필요)
- 업체별 알림 발송 — notification_logs.company_id 제거
- 대시보드 업체별 업무 차트(CompanyTaskChart) 제거
- 확인요청(review) 상태 컬럼 제거 (3단계: pending → in_progress → done)

### 4-5. MVP 이후 기능 (Phase 2+)

- 반복 업무 설정 (매일/매주/매월)
- 업무 완료율 통계 차트
- 파일/이미지 첨부 (Supabase Storage)
- 구글 캘린더 연동
- 모바일 웹 최적화 (PWA)

---

## 5. DB 스키마 변경안

### 5-1. companies 테이블 처리

**방침: 소프트 폐기 (테이블 유지, 코드에서 참조 제거)**

- 기존 `companies` 테이블은 즉시 DROP하지 않는다
- 코드 레벨에서 companies 관련 Action, 컴포넌트, 라우트를 모두 제거한다
- tasks.company_id FK는 NULL 허용 상태로 유지 → 마이그레이션 이후 컬럼 제거
- 데이터 안정성이 확인되면 Phase 2에서 companies 테이블 DROP 마이그레이션 실행

### 5-2. tasks 테이블 변경

| 필드 | 변경 방향 | 설명 |
|------|----------|------|
| `company_id` | **제거** (마이그레이션) | 업체 연결 개념 제거 |
| `assignee_id` | **제거** (마이그레이션) | 1인 사용자이므로 불필요 |
| `status` | **값 변경** | `review` 값 제거 → `pending`, `in_progress`, `done` 3단계 |
| `category_id` | **추가** | categories 테이블 FK (NULL 허용) |
| `user_id` | **추가** | profiles.id FK (기존 created_by와 역할 통합 또는 분리 검토) |

**변경 후 tasks 스키마 (핵심 필드)**

| 필드 | 설명 | 타입/관계 |
|------|------|----------|
| id | 고유 식별자 | UUID |
| user_id | 소유 사용자 | UUID → profiles.id |
| title | 업무명 | TEXT |
| category_id | 카테고리 (선택) | UUID → categories.id, NULL 허용 |
| status | 진행 상태 | ENUM: pending, in_progress, done |
| priority | 우선순위 | ENUM: high, medium, low |
| start_date | 시작일 | DATE, NULL 허용 |
| due_date | 마감일 | DATE, NULL 허용 |
| memo | 업무 메모 | TEXT, NULL 허용 |
| created_at | 생성 일시 | TIMESTAMPTZ |
| updated_at | 수정 일시 | TIMESTAMPTZ |

### 5-3. categories 테이블 신규 추가

| 필드 | 설명 | 타입/관계 |
|------|------|----------|
| id | 고유 식별자 | UUID |
| user_id | 소유 사용자 | UUID → profiles.id |
| name | 카테고리명 | TEXT |
| color | 표시 색상 (hex) | TEXT |
| created_at | 생성 일시 | TIMESTAMPTZ |

### 5-4. profiles 테이블 변경

| 필드 | 변경 방향 | 설명 |
|------|----------|------|
| `phone` | **활용** (기존 존재) | 카카오 알림톡 발송 대상 번호로 사용 |
| `role` | **단순화** | admin/member 구분 제거 → 단일 user로 통일 |
| `bio`, `website`, `avatar_url` | 유지 (Phase 2에서 UI 연결) | |

### 5-5. comments 테이블 변경

| 변경 내용 | 설명 |
|----------|------|
| 테이블명 변경 검토 | `comments` → `task_notes` (의미 명확화, 선택 사항) |
| `author_id` 고정 | 항상 로그인 사용자 본인 = author_id, 다중 작성자 UX 제거 |
| 기능 역할 변경 | 협업 댓글 → 개인 메모/노트로 UI 전환 |

### 5-6. notification_logs / notification_schedules 테이블 변경

| 필드 | 변경 방향 |
|------|----------|
| `company_id` | **제거** |
| `phone` | 항상 profiles.phone (본인 번호)로 고정 |
| `task_id` | 유지 |
| `type` | 유지 (daily, task_created) |

---

## 6. 라우트 변경안

### 6-1. 제거할 라우트

| 라우트 | 제거 이유 |
|--------|----------|
| `/(dashboard)/companies` | 업체 관리 페이지 전체 제거 |
| `app/(dashboard)/companies/page.tsx` | 업체 목록 페이지 삭제 |

### 6-2. 변경할 라우트

| 라우트 | 변경 내용 |
|--------|----------|
| `/(dashboard)/dashboard` | 업체 차트 제거, 오늘/이번 주 할일 중심으로 재구성 |
| `/(dashboard)/tasks` | 업체 필터 → 카테고리 필터 교체, 상태 컬럼 3개로 축소 |
| `/(dashboard)/calendar` | 월간 단독 → 월간/주간/일간 탭 전환 추가 |

### 6-3. 추가할 라우트

| 라우트 | 설명 |
|--------|------|
| `/(dashboard)/settings` | 프로필(표시 이름, 전화번호), 카테고리 관리 통합 설정 페이지 |

### 6-4. 변경 후 전체 라우트 구조

```
/                         공개 랜딩 페이지
/auth/login               로그인
/auth/sign-up             회원가입
/auth/forgot-password     비밀번호 재설정
/auth/update-password     새 비밀번호 설정
/auth/confirm             이메일 OTP 인증
/auth/error               인증 에러

/(dashboard)/dashboard    오늘/이번 주 업무 요약 대시보드
/(dashboard)/tasks        업무 관리 (칸반 보드)
/(dashboard)/calendar     캘린더 (월간/주간/일간)
/(dashboard)/settings     설정 (프로필, 카테고리, 알림 전화번호)
```

---

## 7. UI/UX 방향

### 7-1. 전반적인 방향

- **단순함 최우선**: 업체 선택, 담당자 지정 등 협업 관련 입력 필드 전체 제거 → 업무 등록 폼을 3개 필드(제목, 마감일, 우선순위)로 최소화
- **오늘 집중**: 대시보드 진입 시 오늘 마감/이번 주 마감 업무가 가장 눈에 띄도록 레이아웃 재구성
- **캘린더 중심**: 사이드바에서 캘린더를 tasks와 동일한 위계로 배치, 월간/주간/일간 탭 전환 지원
- **색상 코드 활용**: 카테고리별 색상, 우선순위별 색상으로 시각적 분류 강화

### 7-2. 대시보드 재설계

**제거**
- CompanyTaskChart (업체별 업무 분포 차트)
- 업체 기준 요약 카드

**유지/변경**
- 요약 카드 4종: 오늘 마감 / 이번 주 마감 / 진행중 / 지연
- TaskStatusChart: 전체 상태 분포 파이/도넛 차트 (유지)
- 최근 노트 목록: 최근 댓글 → 최근 업무 노트로 명칭/역할 변경

### 7-3. 업무 관리 페이지 재설계

**칸반 보드 컬럼 변경**
- AS-IS: 대기 / 진행중 / 확인요청 / 완료 (4단계)
- TO-BE: 할일 / 진행중 / 완료 (3단계)

**필터 변경**
- 업체 필터 → 카테고리 필터로 교체
- 우선순위 필터 유지

**업무 카드 변경**
- 업체명 표시 제거
- 담당자 표시 제거
- 카테고리 뱃지 추가

### 7-4. 캘린더 페이지 재설계

- 뷰 전환 탭: 월간 / 주간 / 일간
- 월간 뷰: 날짜 셀에 업무 마감 뱃지 (카테고리 색상 반영)
- 주간 뷰: 7일 컬럼, 각 날짜에 해당 업무 카드 표시
- 일간 뷰: 선택 날짜의 업무 목록 + 빠른 추가 버튼
- 업체 필터 제거, 카테고리 필터 추가

### 7-5. 설정 페이지 신규 추가

- 프로필 섹션: 표시 이름, 카카오 알림 수신 전화번호 편집
- 카테고리 섹션: 카테고리 추가/수정/삭제, 색상 선택
- 알림 섹션: 일일 요약 알림 on/off 토글 (Phase 2)

---

## 8. 알림 시스템 변경안

### 8-1. 변경 요약

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| 발송 대상 | 업체 담당자 전화번호 (다수) | 로그인 사용자 본인 전화번호 (1개) |
| 발송 번호 출처 | companies.phone | profiles.phone |
| 일일 요약 내용 | 오늘 마감 업무 + 업체명 | 오늘 마감 업무 + 카테고리 |
| 즉시 알림 | 업무 등록 시 업체 담당자에게 | 업무 등록 시 본인에게 (선택적) |
| 다건 발송 | sendKakaoNotificationBulk 활용 | sendKakaoNotification 단건으로 충분 |

### 8-2. API 라우트 변경

**유지**

- `GET /api/cron/daily-notify` — 발송 대상을 profiles.phone (로그인 사용자 본인)으로 변경
- `POST /api/notify/task` — 발송 대상을 업체 번호 → 사용자 본인 번호로 변경

**제거 또는 단순화**

- `sendKakaoNotificationBulk` 함수 — 1인용이므로 sendKakaoNotification 단건 함수로 충분
- notification_logs.company_id 컬럼 참조 로직 제거

### 8-3. 일일 요약 알림 메시지 변경안

**기존 템플릿 (업체 기반)**
```
[TATACO] 오늘 마감 업무 알림
업체: OO업체
업무: 시안 검토
마감일: 2026-06-13
```

**변경 템플릿 (1인 기반)**
```
[TATACO] 오늘의 업무 알림
오늘 마감: N건
- 시안 작업 완료 [디자인]
- 미팅 자료 준비 [영업]
자세히 보기: https://tataco.vercel.app/dashboard
```

> 카카오 알림톡 템플릿은 Solapi 콘솔에서 새로 등록해야 하며, 기존 템플릿 ID(KAKAO_DAILY_TEMPLATE_ID)를 환경 변수에서 교체한다.

---

## 9. 마이그레이션 고려사항

### 9-1. 기존 데이터 처리 방안

| 테이블 | 처리 방안 |
|--------|----------|
| `companies` | 테이블 유지 (DROP 보류), 코드에서만 참조 제거. 데이터 보존 후 Phase 2에서 삭제 여부 결정 |
| `tasks.company_id` | NULL로 업데이트 후 FK 제약 제거, 이후 컬럼 DROP |
| `tasks.assignee_id` | NULL로 업데이트 후 컬럼 DROP |
| `tasks.status = 'review'` | `'in_progress'`로 일괄 업데이트 후 ENUM에서 제거 |
| `comments` | 테이블 유지, UI만 개인 노트 형태로 변경 (데이터 손실 없음) |
| `notification_logs.company_id` | NULL 허용 처리 후 컬럼 참조 제거 |

### 9-2. 마이그레이션 SQL 순서

```sql
-- 1단계: tasks 상태값 정리 (review → in_progress)
UPDATE tasks SET status = 'in_progress' WHERE status = 'review';

-- 2단계: tasks 불필요 FK NULL 처리
UPDATE tasks SET company_id = NULL, assignee_id = NULL;

-- 3단계: categories 테이블 생성 (신규)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4단계: tasks에 category_id 추가
ALTER TABLE tasks ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 5단계: tasks에서 불필요 컬럼 제거
ALTER TABLE tasks DROP COLUMN company_id;
ALTER TABLE tasks DROP COLUMN assignee_id;

-- 6단계: RLS 정책 업데이트
-- tasks: auth.uid() = user_id (created_by → user_id로 통일 필요)
-- categories: auth.uid() = user_id
```

> 각 단계는 독립적인 Supabase 마이그레이션 파일로 분리하여 적용한다.

### 9-3. TypeScript 타입 재생성

스키마 변경 완료 후 Supabase MCP 도구로 타입 재생성:

```bash
# Supabase MCP: generate_typescript_types
# 결과를 lib/supabase/database.types.ts에 덮어씌움
```

### 9-4. 코드 레벨 제거 대상

| 파일/디렉토리 | 처리 |
|--------------|------|
| `app/(dashboard)/companies/` | 디렉토리 전체 삭제 |
| `lib/actions/companies.ts` | 파일 삭제 |
| `components/companies/` | 디렉토리 전체 삭제 |
| `components/dashboard/company-task-chart.tsx` | 파일 삭제 |
| `app/(dashboard)/dashboard/page.tsx` | CompanyTaskChart import 및 렌더링 제거 |
| `app/(dashboard)/tasks/page.tsx` | company_id searchParam, getCompanies 호출 제거 |
| `app/(dashboard)/calendar/page.tsx` | getCompanies 호출 제거 |
| `lib/actions/tasks.ts` | TaskWithCompany 타입, companies JOIN 쿼리 제거 |

---

## 10. 개발 우선순위 (Phase)

### Phase 1 — DB 스키마 정리 및 코드 제거 (1~2일)

목표: 업체(companies) 의존 코드 완전 제거, 신규 스키마 적용

- [ ] Supabase 마이그레이션: tasks 상태값 정리 (review 제거)
- [ ] Supabase 마이그레이션: tasks.company_id, assignee_id 제거
- [ ] Supabase 마이그레이션: categories 테이블 생성 및 tasks.category_id 추가
- [ ] Supabase RLS 정책 업데이트 (categories 테이블 추가)
- [ ] TypeScript 타입 재생성 (generate_typescript_types)
- [ ] 업체 관련 파일 코드 삭제 (companies Action, 컴포넌트, 라우트)
- [ ] tasks Action에서 companies JOIN 쿼리 제거
- [ ] 사이드바 네비게이션에서 업체 관리 메뉴 제거

### Phase 2 — 핵심 기능 전환 (3~5일)

목표: 1인 개인 업무관리 앱으로 기능 전환

- [ ] 대시보드 재구성 (업체 차트 제거, 오늘/이번 주 집중 레이아웃)
- [ ] 업무 관리 페이지: 칸반 3컬럼(할일/진행중/완료), 카테고리 필터 교체
- [ ] 업무 등록/수정 폼: 업체 선택·담당자 필드 제거, 카테고리 선택 추가
- [ ] 설정 페이지 신규 생성 (프로필 이름·전화번호 편집, 카테고리 CRUD)
- [ ] 카테고리 관리 Action 신규 작성 (lib/actions/categories.ts)
- [ ] 업무 카드 UI 업데이트 (업체명 제거, 카테고리 뱃지 추가)

### Phase 3 — 캘린더 강화 (2~3일)

목표: 월간/주간/일간 멀티 뷰 캘린더

- [ ] 캘린더 페이지 뷰 전환 탭 (월간/주간/일간) UI 추가
- [ ] 주간 뷰 컴포넌트 구현 (7일 컬럼, 날짜별 업무 카드)
- [ ] 일간 뷰 컴포넌트 구현 (하루 업무 목록 + 빠른 추가)
- [ ] 캘린더 업체 필터 → 카테고리 필터 교체
- [ ] 월간 캘린더 카테고리 색상 뱃지 반영

### Phase 4 — 알림 시스템 1인화 (1~2일)

목표: 카카오 알림톡을 본인에게만 발송하도록 재설계

- [ ] `/api/cron/daily-notify` 발송 대상을 profiles.phone으로 변경
- [ ] `/api/notify/task` 발송 대상을 사용자 본인 번호로 변경
- [ ] notification_logs company_id 참조 제거
- [ ] Solapi 알림 메시지 템플릿 변경 (업체 기반 → 카테고리 기반)
- [ ] 설정 페이지에 알림 전화번호 편집 UI 연결
- [ ] 신규 카카오 알림톡 템플릿 등록 (Solapi 콘솔)

### Phase 5 — 품질 마무리 (1일)

- [ ] 전체 빈 상태(empty state) UI 정비
- [ ] 에러 핸들링 및 로딩 스켈레톤 일관성 확인
- [ ] 반응형 레이아웃 점검 (데스크탑 기준)
- [ ] Vercel 배포 확인 및 환경 변수 점검

---

> 이 문서는 TATACO v1.0.0(B2B 협업 업무관리)에서 v2.0.0(1인 개인 업무 일정관리)으로의 방향 전환을 위한 업데이트 PRD입니다.
> 기존 PRD(docs/prd.md)는 참고용으로 보존합니다.
