import { GeneratorOptions, PasswordStrength } from '../types/password'

interface PasswordOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeSimilar?: boolean
  excludeAmbiguous?: boolean
}

export class PasswordGenerator {
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
  private static readonly NUMBERS = '0123456789'
  private static readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  private static readonly SIMILAR = 'il1Lo0O'
  private static readonly AMBIGUOUS = '{}[]()/"\'~,;.<>'

  static generate(options: GeneratorOptions): string {
    let charset = ''
    
    if (options.includeUppercase) charset += this.UPPERCASE
    if (options.includeLowercase) charset += this.LOWERCASE
    if (options.includeNumbers) charset += this.NUMBERS
    if (options.includeSymbols) charset += this.SYMBOLS
    
    if (options.excludeSimilar) {
      charset = charset.split('').filter(char => !this.SIMILAR.includes(char)).join('')
    }
    
    if (charset.length === 0) {
      throw new Error('At least one character type must be selected')
    }
    
    let password = ''
    
    // Ensure at least one character from each selected type
    if (options.includeUppercase) {
      password += this.getRandomChar(this.UPPERCASE, options.excludeSimilar)
    }
    if (options.includeLowercase) {
      password += this.getRandomChar(this.LOWERCASE, options.excludeSimilar)
    }
    if (options.includeNumbers) {
      password += this.getRandomChar(this.NUMBERS, options.excludeSimilar)
    }
    if (options.includeSymbols) {
      password += this.getRandomChar(this.SYMBOLS, options.excludeSimilar)
    }
    
    // Fill the rest randomly
    for (let i = password.length; i < options.length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }
  
  private static getRandomChar(charset: string, excludeSimilar: boolean): string {
    let chars = charset
    if (excludeSimilar) {
      chars = charset.split('').filter(char => !this.SIMILAR.includes(char)).join('')
    }
    return chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  static analyzeStrength(password: string): PasswordStrength {
    let score = 0
    const suggestions: string[] = []
    
    // Length check
    if (password.length >= 12) score += 2
    else if (password.length >= 8) score += 1
    else suggestions.push('Use at least 8 characters')
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1
    else suggestions.push('Include lowercase letters')
    
    if (/[A-Z]/.test(password)) score += 1
    else suggestions.push('Include uppercase letters')
    
    if (/[0-9]/.test(password)) score += 1
    else suggestions.push('Include numbers')
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    else suggestions.push('Include special characters')
    
    // Bonus points
    if (password.length >= 16) score += 1
    if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) score += 1
    
    // Penalties
    if (/(.)\\1{2,}/.test(password)) score -= 1 // Repeated characters
    if (/123|abc|qwe|password|admin/i.test(password)) score -= 2 // Common patterns
    
    score = Math.max(0, Math.min(5, score))
    
    const strengthLevels = [
      { label: 'Very Weak', color: 'strength-very-weak' },
      { label: 'Weak', color: 'strength-weak' },
      { label: 'Fair', color: 'strength-fair' },
      { label: 'Good', color: 'strength-good' },
      { label: 'Strong', color: 'strength-strong' }
    ]
    
    return {
      score,
      label: strengthLevels[score]?.label || 'Very Weak',
      color: strengthLevels[score]?.color || 'strength-very-weak',
      suggestions
    }
  }
}

// Helper functions for the new components
export function generatePassword(options: PasswordOptions): string {
  return PasswordGenerator.generate(options)
}

export function calculatePasswordStrength(password: string) {
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSymbols = /[^a-zA-Z0-9]/.test(password)
  
  let score = 0
  
  // Length scoring
  if (password.length >= 16) score += 30
  else if (password.length >= 12) score += 25
  else if (password.length >= 8) score += 15
  else if (password.length >= 6) score += 10
  else score += 5
  
  // Character variety scoring
  if (hasUppercase) score += 15
  if (hasLowercase) score += 15
  if (hasNumbers) score += 15
  if (hasSymbols) score += 25
  
  // Bonus for variety
  const varietyCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length
  if (varietyCount >= 3) score += 10
  if (varietyCount === 4) score += 10
  
  // Penalties
  if (/(.)\\1{2,}/.test(password)) score -= 10 // Repeated characters
  if (/123|abc|qwe|password|admin/i.test(password)) score -= 20 // Common patterns
  
  score = Math.max(0, Math.min(100, score))
  
  return {
    score,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols
  }
}