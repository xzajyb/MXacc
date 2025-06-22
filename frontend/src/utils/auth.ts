import Cookies from 'js-cookie'

const ACCESS_TOKEN_KEY = 'mxacc_access_token'
const REFRESH_TOKEN_KEY = 'mxacc_refresh_token'

export const getToken = (): string | null => {
  return Cookies.get(ACCESS_TOKEN_KEY) || null
}

export const getRefreshToken = (): string | null => {
  return Cookies.get(REFRESH_TOKEN_KEY) || null
}

export const setToken = (accessToken: string, refreshToken: string): void => {
  // 设置访问令牌（7天过期）
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
  
  // 设置刷新令牌（30天过期）
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    expires: 30,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
}

export const removeToken = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY)
  Cookies.remove(REFRESH_TOKEN_KEY)
}

export const isTokenExpired = (token: string): boolean => {
  if (!token) return true
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch {
    return true
  }
}

export const shouldRefreshToken = (token: string): boolean => {
  if (!token) return false
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    const timeUntilExpiry = payload.exp - currentTime
    
    // 如果令牌在5分钟内过期，则需要刷新
    return timeUntilExpiry < 5 * 60
  } catch {
    return false
  }
} 