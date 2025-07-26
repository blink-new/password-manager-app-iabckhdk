import { useState, useEffect } from 'react'
import { ArrowLeft, Eye, EyeOff, RefreshCw, Save, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useToast } from '../../hooks/use-toast'
import { Password } from '../../types/password'
import { blink } from '../../blink/client'
import { generatePassword, calculatePasswordStrength } from '../../utils/passwordGenerator'

interface PasswordFormProps {
  password?: Password
  onSave: () => void
  onCancel: () => void
  onDelete?: (id: string) => void
}

const categories = [
  'Personal',
  'Work', 
  'Social',
  'Finance',
  'Shopping',
  'Entertainment'
]

export function PasswordForm({ password, onSave, onCancel, onDelete }: PasswordFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    email: '',
    password: '',
    websiteUrl: '',
    category: 'Personal',
    notes: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const isEditing = !!password

  useEffect(() => {
    if (password) {
      setFormData({
        title: password.title || '',
        username: password.username || '',
        email: password.email || '',
        password: password.password || '',
        websiteUrl: password.websiteUrl || '',
        category: password.category || 'Personal',
        notes: password.notes || ''
      })
    }
  }, [password])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGeneratePassword = () => {
    const newPassword = generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: false,
      excludeAmbiguous: false
    })
    setFormData(prev => ({ ...prev, password: newPassword }))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for this password',
        variant: 'destructive'
      })
      return
    }

    if (!formData.password.trim()) {
      toast({
        title: 'Error', 
        description: 'Please enter a password',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      const user = await blink.auth.me()
      
      const passwordData = {
        ...formData,
        userId: user.id,
        updatedAt: new Date().toISOString(),
        lastUsed: null,
        isFavorite: password?.isFavorite || false
      }

      if (isEditing && password) {
        await blink.db.passwords.update(password.id, passwordData)
        toast({
          title: 'Updated',
          description: 'Password updated successfully'
        })
      } else {
        await blink.db.passwords.create({
          id: `pwd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...passwordData,
          createdAt: new Date().toISOString()
        })
        toast({
          title: 'Saved',
          description: 'Password saved successfully'
        })
      }

      onSave()
    } catch (error) {
      console.error('Failed to save password:', error)
      toast({
        title: 'Error',
        description: 'Failed to save password',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!password || !onDelete) return

    try {
      setDeleting(true)
      await blink.db.passwords.delete(password.id)
      toast({
        title: 'Deleted',
        description: 'Password deleted successfully'
      })
      onDelete(password.id)
    } catch (error) {
      console.error('Failed to delete password:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete password',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  const strength = formData.password ? calculatePasswordStrength(formData.password) : null

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getStrengthLabel = (score: number) => {
    if (score >= 80) return 'Very Strong'
    if (score >= 60) return 'Strong'
    if (score >= 40) return 'Fair'
    return 'Weak'
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8 max-w-2xl mx-auto min-h-full">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={onCancel} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Password' : 'Add Password'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing ? 'Update your password details' : 'Store a new password securely'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Password Details</CardTitle>
            <CardDescription>
              Enter the details for your password entry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Gmail, Facebook, Work Email"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://example.com"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
              />
            </div>

            {/* Username and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-8 w-8 p-0"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleGeneratePassword}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Password Strength */}
              {strength && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Password Strength</span>
                    <Badge className={getStrengthColor(strength.score)}>
                      {getStrengthLabel(strength.score)}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        strength.score >= 80 ? 'bg-green-500' :
                        strength.score >= 60 ? 'bg-yellow-500' :
                        strength.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or security questions..."
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div>
                {isEditing && onDelete && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Password'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}