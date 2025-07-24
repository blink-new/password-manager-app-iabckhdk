import { useState, useEffect } from 'react'
import { 
  User, 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  Clock,
  Bell,
  Palette,
  Database,
  Key
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { useToast } from '../../hooks/use-toast'
import { blink } from '../../blink/client'

export function SettingsPanel() {
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState({
    autoLockTimeout: '15',
    enableNotifications: true,
    theme: 'light',
    passwordLength: 16,
    exportFormat: 'json'
  })
  const [passwordCount, setPasswordCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadUserData = async () => {
    try {
      const userData = await blink.auth.me()
      setUser(userData)
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const loadPasswordCount = async () => {
    try {
      const user = await blink.auth.me()
      const passwords = await blink.db.passwords.list({
        where: { userId: user.id }
      })
      setPasswordCount(passwords.length)
    } catch (error) {
      console.error('Failed to load password count:', error)
    }
  }

  useEffect(() => {
    loadUserData()
    loadPasswordCount()
  }, [])

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      // In a real app, you'd save these to the database
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated'
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const user = await blink.auth.me()
      const passwords = await blink.db.passwords.list({
        where: { userId: user.id }
      })

      const exportData = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        passwords: passwords.map(p => ({
          title: p.title,
          username: p.username,
          email: p.email,
          password: p.password,
          websiteUrl: p.websiteUrl,
          category: p.category,
          notes: p.notes,
          createdAt: p.createdAt
        }))
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `securevault-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Complete',
        description: `Exported ${passwords.length} passwords`
      })
    } catch (error) {
      console.error('Failed to export data:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export your data',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteAllData = async () => {
    if (!confirm('Are you sure you want to delete ALL your passwords? This action cannot be undone.')) {
      return
    }

    try {
      const user = await blink.auth.me()
      const passwords = await blink.db.passwords.list({
        where: { userId: user.id }
      })

      // Delete all passwords
      for (const password of passwords) {
        await blink.db.passwords.delete(password.id)
      }

      setPasswordCount(0)
      toast({
        title: 'Data Deleted',
        description: 'All your passwords have been deleted',
        variant: 'destructive'
      })
    } catch (error) {
      console.error('Failed to delete data:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete data',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="space-y-8">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and subscription status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email Address</Label>
                <Input value={user?.email || ''} disabled className="mt-1" />
              </div>
              <div>
                <Label>User ID</Label>
                <Input value={user?.id || ''} disabled className="mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Account Status</Label>
                <div className="mt-1">
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <Label>Total Passwords</Label>
                <div className="mt-1">
                  <Badge variant="secondary">{passwordCount}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure security and privacy options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-lock Timeout</Label>
                <p className="text-sm text-gray-500">
                  Automatically lock the vault after inactivity
                </p>
              </div>
              <Select 
                value={settings.autoLockTimeout} 
                onValueChange={(value) => handleSettingChange('autoLockTimeout', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default Password Length</Label>
                <p className="text-sm text-gray-500">
                  Default length for generated passwords
                </p>
              </div>
              <Select 
                value={settings.passwordLength.toString()} 
                onValueChange={(value) => handleSettingChange('passwordLength', parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="32">32</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive notifications about security alerts and updates
                </p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Data Management
            </CardTitle>
            <CardDescription>
              Import, export, and manage your password data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Export Data</Label>
                <p className="text-sm text-gray-500">
                  Download all your passwords as a JSON file
                </p>
                <Button onClick={handleExportData} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export Passwords
                </Button>
              </div>
              
              <div className="space-y-3">
                <Label>Import Data</Label>
                <p className="text-sm text-gray-500">
                  Import passwords from another password manager
                </p>
                <Button variant="outline" className="w-full" disabled>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Passwords
                </Button>
                <p className="text-xs text-gray-400">Coming soon</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-red-600">Danger Zone</Label>
              <p className="text-sm text-gray-500">
                Permanently delete all your password data. This action cannot be undone.
              </p>
              <Button 
                onClick={handleDeleteAllData} 
                variant="destructive"
                className="w-full md:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}