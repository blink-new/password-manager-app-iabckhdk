import { useState } from 'react'
import { 
  Shield, 
  Key, 
  Settings, 
  Search, 
  Plus,
  LogOut,
  User,
  Briefcase,
  Users,
  CreditCard,
  ShoppingBag,
  Play,
  Star,
  Menu,
  X,
  Activity,
  FileText,
  Upload
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  passwordCounts: Record<string, number>
  user: any
  onSignOut: () => void
}

const categories = [
  { id: 'all', name: 'All Items', icon: Key, color: 'text-gray-600' },
  { id: 'favorites', name: 'Favorites', icon: Star, color: 'text-yellow-500' },
  { id: 'Personal', name: 'Personal', icon: User, color: 'text-blue-500' },
  { id: 'Work', name: 'Work', icon: Briefcase, color: 'text-green-600' },
  { id: 'Social', name: 'Social', icon: Users, color: 'text-red-500' },
  { id: 'Finance', name: 'Finance', icon: CreditCard, color: 'text-orange-500' },
  { id: 'Shopping', name: 'Shopping', icon: ShoppingBag, color: 'text-purple-500' },
  { id: 'Entertainment', name: 'Entertainment', icon: Play, color: 'text-pink-500' }
]

const navigationItems = [
  { id: 'vault', name: 'Password Vault', icon: Shield },
  { id: 'generator', name: 'Generator', icon: Key },
  { id: 'health', name: 'Password Health', icon: Activity },
  { id: 'notes', name: 'Secure Notes', icon: FileText },
  { id: 'import', name: 'Import Passwords', icon: Upload },
  { id: 'settings', name: 'Settings', icon: Settings }
]

export function Sidebar({
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  passwordCounts,
  user,
  onSignOut
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">SecureVault</h1>
              <p className="text-sm text-gray-500">Password Manager</p>
            </div>
          </div>

        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search passwords..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                activeView === item.id && 'bg-indigo-50 text-indigo-700 border-indigo-200'
              )}
              onClick={() => {
                onViewChange(item.id)
                setIsMobileOpen(false)
              }}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Categories</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onViewChange('add-password')}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {categories.map((category) => {
            const count = passwordCounts[category.id] || 0
            const Icon = category.icon
            
            return (
              <Button
                key={category.id}
                variant="ghost"
                className={cn(
                  'w-full justify-between group',
                  selectedCategory === category.id && 'bg-gray-100'
                )}
                onClick={() => onCategoryChange(category.id)}
              >
                <div className="flex items-center">
                  <Icon className={cn('w-4 h-4 mr-3', category.color)} />
                  <span className="text-sm">{category.name}</span>
                </div>
                {count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <div className="text-xs text-gray-500 text-center">
            Signed in as {user?.email}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 h-screen">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-80 h-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}