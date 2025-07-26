import { useState } from 'react'
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Trash2, 
  Star, 
  ExternalLink,
  User,
  Mail,
  Globe,
  Calendar,
  MoreVertical
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { Password } from '../../types/password'
import { EncryptionService } from '../../utils/encryption'
import { cn } from '../../lib/utils'

interface PasswordCardProps {
  password: Password
  onEdit: (password: Password) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onCopy: (text: string, type: string) => void
}

const categoryColors = {
  Personal: 'bg-blue-100 text-blue-800',
  Work: 'bg-green-100 text-green-800',
  Social: 'bg-red-100 text-red-800',
  Finance: 'bg-orange-100 text-orange-800',
  Shopping: 'bg-purple-100 text-purple-800',
  Entertainment: 'bg-pink-100 text-pink-800'
}

export function PasswordCard({ 
  password, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onCopy 
}: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null)

  const encryption = EncryptionService.getInstance()

  const handleShowPassword = () => {
    if (!showPassword && !decryptedPassword) {
      // For now, we'll store passwords in plain text since we removed master password
      // In a real app, you'd want proper encryption
      setDecryptedPassword(password.encryptedPassword)
    }
    setShowPassword(!showPassword)
  }

  const handleCopyPassword = () => {
    // For now, we'll treat encryptedPassword as plain text
    onCopy(password.encryptedPassword, 'password')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-200 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
              {getInitials(password.title)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {password.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-xs',
                    categoryColors[password.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {password.category}
                </Badge>
                {Number(password.isFavorite) > 0 && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(password)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleFavorite(password.id)}>
                <Star className="w-4 h-4 mr-2" />
                {Number(password.isFavorite) > 0 ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
              {password.websiteUrl && (
                <DropdownMenuItem onClick={() => window.open(password.websiteUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Website
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(password.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          {/* Username/Email */}
          {password.username && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{password.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(password.username!, 'username')}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}

          {password.email && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{password.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(password.email!, 'email')}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">Password:</span>
              <span className="secure-input">
                {showPassword && decryptedPassword ? decryptedPassword : '••••••••••••'}
              </span>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowPassword}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPassword}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Website */}
          {password.websiteUrl && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span className="truncate">{password.websiteUrl}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(password.websiteUrl, '_blank')}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Notes */}
          {password.notes && (
            <div className="text-sm text-gray-600">
              <p className="line-clamp-2">{password.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Created {formatDate(password.createdAt)}</span>
          </div>
          {password.lastUsed && (
            <div className="text-xs text-gray-500">
              Last used {formatDate(password.lastUsed)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}