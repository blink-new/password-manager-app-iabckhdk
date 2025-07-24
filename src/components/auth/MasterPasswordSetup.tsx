import { useState } from 'react'
import { Shield, Eye, EyeOff, Check, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { PasswordGenerator } from '../../utils/passwordGenerator'

interface MasterPasswordSetupProps {
  onSetup: (masterPassword: string) => void
  isLoading?: boolean
}

export function MasterPasswordSetup({ onSetup, isLoading }: MasterPasswordSetupProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const strength = PasswordGenerator.analyzeStrength(password)
  const passwordsMatch = password === confirmPassword && password.length > 0
  const canSubmit = password.length >= 8 && passwordsMatch && strength.score >= 3

  const requirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Contains number', met: /[0-9]/.test(password) },
    { text: 'Contains special character', met: /[^a-zA-Z0-9]/.test(password) },
    { text: 'Passwords match', met: passwordsMatch }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit) {
      onSetup(password)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Setup Master Password</CardTitle>
          <CardDescription>
            Create a strong master password to secure your vault. This password encrypts all your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Master Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Master Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              {/* Password Strength */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Password Strength</span>
                    <span className={`text-xs font-medium ${
                      strength.score >= 4 ? 'text-green-600' :
                      strength.score >= 3 ? 'text-blue-600' :
                      strength.score >= 2 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <Progress 
                    value={(strength.score / 5) * 100} 
                    className={`h-2 ${strength.color}`}
                  />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your master password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Password Requirements</h4>
              <div className="space-y-1">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {req.met ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300" />
                    )}
                    <span className={`text-xs ${req.met ? 'text-green-700' : 'text-gray-500'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> Your master password cannot be recovered. Make sure to remember it or store it safely.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? 'Setting up...' : 'Create Master Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}