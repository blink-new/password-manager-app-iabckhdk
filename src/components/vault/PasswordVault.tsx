import { useState, useEffect, useCallback } from 'react'
import { Plus, Filter, SortAsc, Grid, List } from 'lucide-react'
import { Button } from '../ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { PasswordCard } from './PasswordCard'
import { Password } from '../../types/password'
import { blink } from '../../blink/client'
import { useToast } from '../../hooks/use-toast'

interface PasswordVaultProps {
  searchQuery: string
  selectedCategory: string
  onAddPassword: () => void
  onEditPassword: (password: Password) => void
}

export function PasswordVault({ 
  searchQuery, 
  selectedCategory, 
  onAddPassword, 
  onEditPassword 
}: PasswordVaultProps) {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('updated_at')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { toast } = useToast()

  const loadPasswords = useCallback(async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      const data = await blink.db.passwords.list({
        where: { userId: user.id },
        orderBy: { [sortBy]: 'desc' }
      })
      setPasswords(data)
    } catch (error) {
      console.error('Failed to load passwords:', error)
      toast({
        title: 'Error',
        description: 'Failed to load passwords',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [sortBy, toast])

  useEffect(() => {
    loadPasswords()
  }, [loadPasswords])

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Copied!',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard`
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await blink.db.passwords.delete(id)
      setPasswords(passwords.filter(p => p.id !== id))
      toast({
        title: 'Deleted',
        description: 'Password deleted successfully'
      })
    } catch (error) {
      console.error('Failed to delete password:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete password',
        variant: 'destructive'
      })
    }
  }

  const handleToggleFavorite = async (id: string) => {
    try {
      const password = passwords.find(p => p.id === id)
      if (!password) return

      const newFavoriteStatus = Number(password.isFavorite) > 0 ? "0" : "1"
      await blink.db.passwords.update(id, { isFavorite: newFavoriteStatus })
      
      setPasswords(passwords.map(p => 
        p.id === id ? { ...p, isFavorite: newFavoriteStatus === "1" } : p
      ))
      
      toast({
        title: newFavoriteStatus === "1" ? 'Added to Favorites' : 'Removed from Favorites',
        description: `${password.title} ${newFavoriteStatus === "1" ? 'added to' : 'removed from'} favorites`
      })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive'
      })
    }
  }

  // Filter passwords based on search and category
  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = !searchQuery || 
      password.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.websiteUrl?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'favorites' && Number(password.isFavorite) > 0) ||
      password.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Password Vault</h1>
          <p className="text-gray-600 mt-1">
            {filteredPasswords.length} {filteredPasswords.length === 1 ? 'password' : 'passwords'}
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Last Modified</SelectItem>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="title">Name</SelectItem>
              <SelectItem value="last_used">Last Used</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={onAddPassword} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Password
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredPasswords.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || selectedCategory !== 'all' ? 'No passwords found' : 'No passwords yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first password'
            }
          </p>
          {(!searchQuery && selectedCategory === 'all') && (
            <Button onClick={onAddPassword} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Password
            </Button>
          )}
        </div>
      )}

      {/* Password Grid */}
      {filteredPasswords.length > 0 && (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredPasswords.map((password) => (
            <PasswordCard
              key={password.id}
              password={password}
              onEdit={onEditPassword}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}
    </div>
  )
}