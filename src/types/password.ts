export interface Password {
  id: string
  userId: string
  title: string
  username?: string
  email?: string
  encryptedPassword: string
  websiteUrl?: string
  category: string
  notes?: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  lastUsed?: string
}

export interface Category {
  id: string
  userId: string
  name: string
  color: string
  icon: string
  createdAt: string
}

export interface UserSettings {
  id: string
  userId: string
  masterPasswordHash?: string
  autoLockMinutes: number
  passwordLength: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  createdAt: string
  updatedAt: string
}

export interface PasswordStrength {
  score: number
  label: string
  color: string
  suggestions: string[]
}

export interface GeneratorOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeSimilar: boolean
}