import { SolapiMessageService } from 'solapi'

// 빌드 타임 모듈 평가 시 즉시 초기화하지 않고, 실제 호출 시점에 생성
function getMessageService() {
  return new SolapiMessageService(
    process.env.SOLAPI_API_KEY!,
    process.env.SOLAPI_API_SECRET!
  )
}

function getSender() { return process.env.SOLAPI_SENDER_NUMBER! }
function getPfId() { return process.env.KAKAO_CHANNEL_ID! }

export interface KakaoNotificationPayload {
  to: string
  templateId: string
  variables: Record<string, string>
}

export async function sendKakaoNotification(payload: KakaoNotificationPayload) {
  return getMessageService().send({
    to: payload.to,
    from: getSender(),
    kakaoOptions: {
      pfId: getPfId(),
      templateId: payload.templateId,
      variables: payload.variables,
    },
  })
}

export async function sendKakaoNotificationBulk(
  payloads: KakaoNotificationPayload[]
) {
  return getMessageService().send(
    payloads.map((p) => ({
      to: p.to,
      from: getSender(),
      kakaoOptions: {
        pfId: getPfId(),
        templateId: p.templateId,
        variables: p.variables,
      },
    }))
  )
}
