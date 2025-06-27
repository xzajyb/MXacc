export interface User {
  id: string
  username: string
  email: string
  role: 'user' | 'admin'
  isEmailVerified: boolean
  profile: {
    nickname?: string
    displayName?: string
    avatar?: string
    bio?: string
    location?: string
    website?: string
  }
  settings?: {
    theme: 'light' | 'dark' | 'auto'
    language: 'zh-CN' | 'en-US'
    emailNotifications: boolean
    twoFactorEnabled: boolean
  }
  lastLogin?: string
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export interface LoginRequest {
  emailOrUsername: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  message: string
  user?: User
  token?: string
  tokens?: AuthTokens
}

export interface ApiResponse<T = any> {
  message: string
  data?: T
  user?: User
  tokens?: AuthTokens
}

export interface LoginHistory {
  ip: string
  userAgent: string
  location: string
  timestamp: string
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  emailVerified: boolean
  lastLogin?: string
  loginAttempts: number
  isLocked: boolean
}

export interface TwoFactorSetup {
  secret: string
  qrCode: string
  manualEntry: string
}

export interface ProfileUpdateRequest {
  nickname?: string
  bio?: string
  location?: string
  website?: string
}

export interface SettingsUpdateRequest {
  theme?: 'light' | 'dark' | 'auto'
  language?: 'zh-CN' | 'en-US'
  emailNotifications?: boolean
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto'
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  isDark: boolean
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  token: string | null
  login: (emailOrUsername: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  sendEmailVerification: () => Promise<{success: boolean, message: string, verificationCode?: string}>
  verifyEmail: (verificationCode: string) => Promise<{success: boolean, message: string}>
  changeEmail: (newEmail: string, confirmPassword: string) => Promise<{success: boolean, message: string}>
  deleteAccount: (confirmPassword: string) => Promise<{success: boolean, message: string}>
  checkTokenExpiry: () => boolean
} 