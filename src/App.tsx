import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { Sidebar } from './components/layout/Sidebar'
import { PasswordVault } from './components/vault/PasswordVault'
import { PasswordGenerator } from './components/generator/PasswordGenerator'
import { PasswordForm } from './components/forms/PasswordForm'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { PasswordHealth } from './components/health/PasswordHealth'
import { SecureNotes } from './components/notes/SecureNotes'
import { NoteForm } from './components/forms/NoteForm'
import { ImportPasswords } from './components/import/ImportPasswords'
import { Toaster } from './components/ui/toaster'
import { useToast } from './hooks/use-toast'
import { Password } from './types/password'
import { Shield } from 'lucide-react'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeView, setActiveView] = useState('vault')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [passwordCounts, setPasswordCounts] = useState<Record<string, number>>({})
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null)
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const { toast } = useToast()

  const loadPasswordCounts = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const passwords = await blink.db.passwords.list({
        where: { userId: user.id }
      })
      
      const counts: Record<string, number> = {
        all: passwords.length,
        favorites: passwords.filter(p => Number(p.isFavorite) > 0).length
      }
      
      // Count by category
      passwords.forEach(password => {
        counts[password.category] = (counts[password.category] || 0) + 1
      })
      
      setPasswordCounts(counts)
    } catch (error) {
      console.error('Failed to load password counts:', error)
    }
  }, [])

  // Auth state management with Blink Auth
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setAuthLoading(state.isLoading)
      
      if (state.user) {
        loadPasswordCounts()
        toast({
          title: 'Welcome to SecureVault!',
          description: 'Your password manager is ready to use.'
        })
      }
    })
    return unsubscribe
  }, [loadPasswordCounts, toast])

  const handleAddPassword = () => {
    setSelectedPassword(null)
    setActiveView('add-password')
  }

  const handleEditPassword = (password: Password) => {
    setSelectedPassword(password)
    setActiveView('edit-password')
  }

  const handleFormSave = () => {
    loadPasswordCounts()
    setActiveView('vault')
    setSelectedPassword(null)
  }

  const handleFormCancel = () => {
    setActiveView('vault')
    setSelectedPassword(null)
  }

  const handleFormDelete = (id: string) => {
    loadPasswordCounts()
    setActiveView('vault')
    setSelectedPassword(null)
  }

  const handleAddNote = () => {
    setSelectedNote(null)
    setActiveView('add-note')
  }

  const handleEditNote = (note: any) => {
    setSelectedNote(note)
    setActiveView('edit-note')
  }

  const handleNoteFormSave = () => {
    setActiveView('notes')
    setSelectedNote(null)
  }

  const handleNoteFormCancel = () => {
    setActiveView('notes')
    setSelectedNote(null)
  }

  const handleNoteFormDelete = (id: string) => {
    setActiveView('notes')
    setSelectedNote(null)
  }

  const handleImportComplete = () => {
    loadPasswordCounts()
    setActiveView('vault')
  }

  const handleSignOut = () => {
    blink.auth.logout()
    toast({
      title: 'Signed Out',
      description: 'You have been securely signed out.'
    })
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading SecureVault...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - Blink will handle redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SecureVault</h1>
          <p className="text-gray-600 mb-4">Your secure password manager</p>
          <p className="text-sm text-gray-500">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  // Main app - authenticated with Blink Auth
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        passwordCounts={passwordCounts}
        user={user}
        onSignOut={handleSignOut}
      />
      
      <main className="flex-1 overflow-hidden">
        {activeView === 'vault' && (
          <PasswordVault
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onAddPassword={handleAddPassword}
            onEditPassword={handleEditPassword}
          />
        )}
        
        {activeView === 'generator' && (
          <PasswordGenerator />
        )}
        
        {activeView === 'health' && (
          <PasswordHealth onEditPassword={handleEditPassword} />
        )}
        
        {activeView === 'notes' && (
          <SecureNotes onAddNote={handleAddNote} onEditNote={handleEditNote} />
        )}
        
        {activeView === 'import' && (
          <ImportPasswords onComplete={handleImportComplete} onCancel={() => setActiveView('vault')} />
        )}
        
        {activeView === 'settings' && (
          <SettingsPanel />
        )}
        
        {(activeView === 'add-password' || activeView === 'edit-password') && (
          <PasswordForm
            password={selectedPassword}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            onDelete={handleFormDelete}
          />
        )}
        
        {(activeView === 'add-note' || activeView === 'edit-note') && (
          <NoteForm
            note={selectedNote}
            onSave={handleNoteFormSave}
            onCancel={handleNoteFormCancel}
            onDelete={handleNoteFormDelete}
          />
        )}
      </main>
      
      <Toaster />
    </div>
  )
}

export default App