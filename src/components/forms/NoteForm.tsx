import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Trash2, Tag, Plus, X } from 'lucide-react'
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

interface NoteFormProps {
  note?: SecureNote
  onSave: () => void
  onCancel: () => void
  onDelete?: (id: string) => void
}

const categories = [
  'Personal',
  'Work', 
  'Finance',
  'Ideas',
  'Other'
]

export function NoteForm({ note, onSave, onCancel, onDelete }: NoteFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Personal',
    tags: [] as string[]
  })
  const [newTag, setNewTag] = useState('')
  const [loading, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const isEditing = !!note

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        category: note.category || 'Personal',
        tags: note.tags || []
      })
    }
  }, [note])

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return
    
    const tag = newTag.trim().toLowerCase()
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({ 
        ...prev, 
        tags: [...prev.tags, tag] 
      }))
    }
    setNewTag('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for this note',
        variant: 'destructive'
      })
      return
    }

    if (!formData.content.trim()) {
      toast({
        title: 'Error', 
        description: 'Please enter some content for this note',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      const user = await blink.auth.me()
      
      const noteData = {
        ...formData,
        userId: user.id,
        updatedAt: new Date().toISOString(),
        isFavorite: note?.isFavorite || false
      }

      if (isEditing && note) {
        await blink.db.secure_notes.update(note.id, noteData)
        toast({
          title: 'Updated',
          description: 'Note updated successfully'
        })
      } else {
        await blink.db.secure_notes.create({
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...noteData,
          createdAt: new Date().toISOString()
        })
        toast({
          title: 'Saved',
          description: 'Note saved successfully'
        })
      }

      onSave()
    } catch (error) {
      console.error('Failed to save note:', error)
      toast({
        title: 'Error',
        description: 'Failed to save note',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!note || !onDelete) return

    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      await blink.db.secure_notes.delete(note.id)
      toast({
        title: 'Deleted',
        description: 'Note deleted successfully'
      })
      onDelete(note.id)
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8 max-w-4xl mx-auto min-h-full">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={onCancel} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Note' : 'Add Note'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing ? 'Update your secure note' : 'Create a new secure note'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Note Content</CardTitle>
                <CardDescription>
                  Enter your secure note details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., WiFi Password, Credit Card Info, Important Numbers"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your secure information here..."
                    rows={12}
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    This content will be encrypted and stored securely
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
                <CardDescription>
                  Add tags to organize your notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Tag */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button onClick={handleAddTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Current Tags */}
                {formData.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Current Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button onClick={handleSave} disabled={loading} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Note'}
                  </Button>
                  
                  <Button variant="outline" onClick={onCancel} className="w-full">
                    Cancel
                  </Button>
                  
                  {isEditing && onDelete && (
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleting ? 'Deleting...' : 'Delete Note'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}