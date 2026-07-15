import type { Request } from 'express'

// login()/verify2FA()'da imzalanan claim'ler + jwt kütüphanesinin eklediği exp/iat.
// role yalnızca pre-auth ara token'ında bulunur; ver kimlik değişiminde artar.
export interface JwtPayload {
  sub: string
  username: string
  jti: string
  exp: number
  iat?: number
  ver?: number
  role?: 'pre-auth'
  rememberMe?: boolean
}

// jwt.strategy.validate'in dönüşü — JwtAuthGuard'lı handler'larda req.user
export interface AuthUser {
  userId: string
  username: string
  jti: string
  exp: number
}

// Intersection tipi bilinçli: @types/passport'un opsiyonel Request.user'ını
// interface extends ile daraltmak mümkün değil; guard user'ı garanti eder.
export type AuthenticatedRequest = Request & { user: AuthUser }
