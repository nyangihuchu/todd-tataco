export type DummyCompany = {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  memo: string | null
}

export type DummyTask = {
  id: string
  title: string
  company_id: string
  company_name: string
  status: 'pending' | 'in_progress' | 'review' | 'done'
  priority: 'high' | 'medium' | 'low'
  due_date: string
  memo: string | null
}

export type DummyComment = {
  id: string
  task_id: string
  task_title: string
  author_name: string
  content: string
  created_at: string
}

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export const dummyCompanies: DummyCompany[] = [
  {
    id: 'company-1',
    name: '(주)한국건설',
    contact_name: '김민준',
    phone: '010-1234-5678',
    email: 'minjun@hankook.co.kr',
    memo: '정기 유지보수 계약 업체',
  },
  {
    id: 'company-2',
    name: '서울인테리어',
    contact_name: '이서연',
    phone: '010-2345-6789',
    email: 'seoyeon@seoul-interior.com',
    memo: null,
  },
  {
    id: 'company-3',
    name: '대한전기공사',
    contact_name: '박지훈',
    phone: '010-3456-7890',
    email: null,
    memo: '긴급 연락 시 휴대폰 우선',
  },
  {
    id: 'company-4',
    name: '미래설비',
    contact_name: null,
    phone: '02-567-8901',
    email: 'info@mirae-equip.kr',
    memo: null,
  },
]

export const dummyTasks: DummyTask[] = [
  // pending — 3개
  {
    id: 'task-1',
    title: '1층 로비 도색 견적 요청',
    company_id: 'company-2',
    company_name: '서울인테리어',
    status: 'pending',
    priority: 'high',
    due_date: dateOffset(8),
    memo: '벽면 전체 + 천장 포함',
  },
  {
    id: 'task-2',
    title: '분전반 점검 일정 협의',
    company_id: 'company-3',
    company_name: '대한전기공사',
    status: 'pending',
    priority: 'medium',
    due_date: dateOffset(10),
    memo: null,
  },
  {
    id: 'task-3',
    title: '냉난방 설비 정기 점검 예약',
    company_id: 'company-4',
    company_name: '미래설비',
    status: 'pending',
    priority: 'low',
    due_date: dateOffset(14),
    memo: null,
  },
  // in_progress — 3개
  {
    id: 'task-4',
    title: '2층 사무실 바닥재 교체',
    company_id: 'company-2',
    company_name: '서울인테리어',
    status: 'in_progress',
    priority: 'high',
    due_date: dateOffset(0), // 오늘 마감
    memo: '목요일까지 완료 필요',
  },
  {
    id: 'task-5',
    title: '옥상 방수 공사 2차 진행',
    company_id: 'company-1',
    company_name: '(주)한국건설',
    status: 'in_progress',
    priority: 'high',
    due_date: dateOffset(3),
    memo: '비 예보 전 완료',
  },
  {
    id: 'task-6',
    title: '주차장 외벽 균열 보수',
    company_id: 'company-1',
    company_name: '(주)한국건설',
    status: 'in_progress',
    priority: 'medium',
    due_date: dateOffset(5),
    memo: null,
  },
  // review — 3개
  {
    id: 'task-7',
    title: '전기 배선 교체 완료 검수',
    company_id: 'company-3',
    company_name: '대한전기공사',
    status: 'review',
    priority: 'high',
    due_date: dateOffset(0), // 오늘 마감
    memo: '감리 보고서 수령 필요',
  },
  {
    id: 'task-8',
    title: '보일러실 배관 수리 확인',
    company_id: 'company-4',
    company_name: '미래설비',
    status: 'review',
    priority: 'medium',
    due_date: dateOffset(2),
    memo: null,
  },
  {
    id: 'task-9',
    title: '1층 화장실 타일 시공 검수',
    company_id: 'company-2',
    company_name: '서울인테리어',
    status: 'review',
    priority: 'low',
    due_date: dateOffset(4),
    memo: '사진 촬영 후 공유',
  },
  // done — 3개
  {
    id: 'task-10',
    title: '엘리베이터 정기 점검',
    company_id: 'company-4',
    company_name: '미래설비',
    status: 'done',
    priority: 'high',
    due_date: dateOffset(-3),
    memo: null,
  },
  {
    id: 'task-11',
    title: '옥상 물탱크 청소',
    company_id: 'company-1',
    company_name: '(주)한국건설',
    status: 'done',
    priority: 'medium',
    due_date: dateOffset(-5),
    memo: '연 2회 정기 작업',
  },
  {
    id: 'task-12',
    title: '지하 주차장 조명 교체',
    company_id: 'company-3',
    company_name: '대한전기공사',
    status: 'done',
    priority: 'low',
    due_date: dateOffset(-7),
    memo: 'LED 교체 완료',
  },
]

export const dummyComments: DummyComment[] = [
  {
    id: 'comment-1',
    task_id: 'task-4',
    task_title: '2층 사무실 바닥재 교체',
    author_name: '홍길동',
    content: '자재 반입 완료. 오늘 오후부터 시공 시작 예정입니다.',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'comment-2',
    task_id: 'task-5',
    task_title: '옥상 방수 공사 2차 진행',
    author_name: '홍길동',
    content: '1차 도포 완료. 내일 2차 도포 진행 예정.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'comment-3',
    task_id: 'task-7',
    task_title: '전기 배선 교체 완료 검수',
    author_name: '이담당',
    content: '감리 업체에 검수 요청 완료. 내일 오전 방문 예정.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'comment-4',
    task_id: 'task-8',
    task_title: '보일러실 배관 수리 확인',
    author_name: '이담당',
    content: '수리 완료 확인. 누수 없음. 사진 첨부 예정.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'comment-5',
    task_id: 'task-1',
    task_title: '1층 로비 도색 견적 요청',
    author_name: '홍길동',
    content: '견적서 요청 이메일 발송 완료. 회신 대기 중.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'comment-6',
    task_id: 'task-10',
    task_title: '엘리베이터 정기 점검',
    author_name: '이담당',
    content: '점검 완료. 이상 없음. 다음 점검일 6개월 후.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]
