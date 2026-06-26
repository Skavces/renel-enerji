import { Injectable } from '@nestjs/common'

export const GROQ_MODEL = 'llama-3.3-70b-versatile'
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

@Injectable()
export class GroqService {
  async call(
    primaryKey: string,
    fallbackKey: string | undefined,
    payload: object,
  ): Promise<{ res: Response; data: any }> {
    const body = JSON.stringify(payload)
    const request = (key: string) =>
      fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body,
      })

    let res = await request(primaryKey)
    if (!res.ok && res.status === 429 && fallbackKey) {
      res = await request(fallbackKey)
    }

    const data = res.ok ? await res.json() : null
    return { res, data }
  }
}
