import { SolapiMessageService } from 'solapi'

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
)

const SENDER = process.env.SOLAPI_SENDER_NUMBER!
const PF_ID = process.env.KAKAO_CHANNEL_ID!

export interface KakaoNotificationPayload {
  to: string
  templateId: string
  variables: Record<string, string>
}

export async function sendKakaoNotification(payload: KakaoNotificationPayload) {
  return messageService.send({
    to: payload.to,
    from: SENDER,
    kakaoOptions: {
      pfId: PF_ID,
      templateId: payload.templateId,
      variables: payload.variables,
    },
  })
}

export async function sendKakaoNotificationBulk(
  payloads: KakaoNotificationPayload[]
) {
  return messageService.send(
    payloads.map((p) => ({
      to: p.to,
      from: SENDER,
      kakaoOptions: {
        pfId: PF_ID,
        templateId: p.templateId,
        variables: p.variables,
      },
    }))
  )
}
