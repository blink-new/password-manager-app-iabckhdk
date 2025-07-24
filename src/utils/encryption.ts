import CryptoJS from 'crypto-js'

export class EncryptionService {
  private static instance: EncryptionService
  private masterKey: string | null = null

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  setMasterKey(masterPassword: string): void {
    // Derive a key from the master password using PBKDF2
    this.masterKey = CryptoJS.PBKDF2(masterPassword, 'securevault-salt', {
      keySize: 256 / 32,
      iterations: 10000
    }).toString()
  }

  encrypt(plaintext: string): string {
    if (!this.masterKey) {
      throw new Error('Master key not set')
    }
    
    const encrypted = CryptoJS.AES.encrypt(plaintext, this.masterKey).toString()
    return encrypted
  }

  decrypt(ciphertext: string): string {
    if (!this.masterKey) {
      throw new Error('Master key not set')
    }
    
    const decrypted = CryptoJS.AES.decrypt(ciphertext, this.masterKey)
    return decrypted.toString(CryptoJS.enc.Utf8)
  }

  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString()
  }

  clearMasterKey(): void {
    this.masterKey = null
  }

  isUnlocked(): boolean {
    return this.masterKey !== null
  }
}