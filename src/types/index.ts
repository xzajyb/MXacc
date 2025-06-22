export interface User {
  id: string
  username: string
  email: string
  profile: {
    nickname?: string
    avatar: string
    bio?: string
    location?: string
    website?: string
  }
  settings: {
    theme: 'light' | 'dark' | 'auto'
    language: 'zh-CN' | 'en-US'
    emailNotifications: boolean
    twoFactorEnabled: boolean
  }
  role: 'user' | 'admin'
  emailVerified: boolean
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
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (user: User) => void
} 