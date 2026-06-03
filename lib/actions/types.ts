// Server Action의 공통 반환 타입
// 성공 시 data, 실패 시 error 문자열을 반환하는 discriminated union
export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }
