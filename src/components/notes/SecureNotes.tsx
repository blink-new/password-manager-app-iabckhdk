import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Lock,
  Calendar,
  Tag,
  MoreVertical,
  Star
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { useToast } from '../../hooks/use-toast'
import { blink } from '../../blink/client'

interface SecureNote {
  id: string
  userId: string
  title: string
  content: string
  category: string
  tags: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

interface SecureNotesProps {
  onAddNote: () => void
  onEditNote: (note: SecureNote) => void
}

const noteCategories = [
  { id: 'all', name: 'All Notes', color: 'text-gray-600' },
  { id: 'favorites', name: 'Favorites', color: 'text-yellow-500' },
  { id: 'Personal', name: 'Personal', color: 'text-blue-500' },
  { id: 'Work', name: 'Work', color: 'text-green-600' },
  { id: 'Finance', name: 'Finance', color: 'text-orange-500' },
  { id: 'Ideas', name: 'Ideas', color: 'text-purple-500' },
  { id: 'Other', name: 'Other', color: 'text-gray-500' }
]

export function SecureNotes({ onAddNote, onEditNote }: SecureNotesProps) {
  const [notes, setNotes] = useState<SecureNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true)
        const user = await blink.auth.me()
        const data = await blink.db.secure_notes.list({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' }
        })
        setNotes(data)
      } catch (error) {
        console.error('Failed to load notes:', error)
        toast({
          title: 'Error',
          description: 'Failed to load secure notes',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadNotes()
  }, [toast])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await blink.db.secure_notes.delete(id)
      setNotes(notes.filter(n => n.id !== id))
      toast({
        title: 'Deleted',
        description: 'Note deleted successfully'
      })
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive'
      })
    }
  }

  const handleToggleFavorite = async (id: string) => {
    try {
      const note = notes.find(n => n.id === id)
      if (!note) return

      const newFavoriteStatus = !note.isFavorite
      await blink.db.secure_notes.update(id, { isFavorite: newFavoriteStatus })
      
      setNotes(notes.map(n => 
        n.id === id ? { ...n, isFavorite: newFavoriteStatus } : n
      ))
      
      toast({
        title: newFavoriteStatus ? 'Added to Favorites' : 'Removed from Favorites',
        description: `${note.title} ${newFavoriteStatus ? 'added to' : 'removed from'} favorites`
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

  // Filter notes based on search and category
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'favorites' && note.isFavorite) ||
      note.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Secure Notes</h1>
          <p className="text-gray-600 mt-1">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </p>
        </div>
        
        <Button onClick={onAddNote} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto">
          {noteCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredNotes.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || selectedCategory !== 'all' ? 'No notes found' : 'No secure notes yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first secure note to store sensitive information'
            }
          </p>
          {(!searchQuery && selectedCategory === 'all') && (
            <Button onClick={onAddNote} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Note
            </Button>
          )}
        </div>
      )}

      {/* Notes Grid */}
      {filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="group hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-indigo-600 transition-colors">
                      {note.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {note.category}
                      </Badge>
                      {note.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditNote(note)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleFavorite(note.id)}>
                        <Star className="w-4 h-4 mr-2" />
                        {note.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(note.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0" onClick={() => onEditNote(note)}>
                <CardDescription className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {truncateContent(note.content)}
                </CardDescription>
                
                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{note.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Updated {formatDate(note.updatedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Encrypted</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}