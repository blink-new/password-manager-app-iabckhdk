import { useState } from 'react'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Download,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { useToast } from '../../hooks/use-toast'
import { blink } from '../../blink/client'

interface ImportedPassword {
  title: string
  username?: string
  email?: string
  password: string
  websiteUrl?: string
  category: string
  notes?: string
}

interface ImportResult {
  total: number
  successful: number
  failed: number
  errors: string[]
}

interface ImportPasswordsProps {
  onComplete: () => void
  onCancel: () => void
}

export function ImportPasswords({ onComplete, onCancel }: ImportPasswordsProps) {
  const [activeTab, setActiveTab] = useState('upload')
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<ImportedPassword[]>([])
  const [showPasswords, setShowPasswords] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const supportedFormats = [
    {
      name: 'CSV (Generic)',
      description: 'Comma-separated values with headers: title,username,password,url,notes',
      example: 'title,username,password,url,notes\nGmail,john@example.com,mypassword123,https://gmail.com,Work email'
    },
    {
      name: 'JSON',
      description: 'JSON array with password objects',
      example: '[{"title":"Gmail","username":"john@example.com","password":"mypassword123","websiteUrl":"https://gmail.com","category":"Work"}]'
    },
    {
      name: 'Chrome Export',
      description: 'CSV export from Chrome password manager',
      example: 'name,url,username,password\nGmail,https://gmail.com,john@example.com,mypassword123'
    },
    {
      name: 'Firefox Export',
      description: 'CSV export from Firefox password manager',
      example: 'url,username,password,httpRealm,formActionOrigin,guid,timeCreated,timeLastUsed,timePasswordChanged'
    }
  ]

  const parseJSON = (text: string): ImportedPassword[] => {
    const data = JSON.parse(text)
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of password objects')
    }

    return data.map((item: any, index: number) => ({
      title: item.title || item.name || `Imported Password ${index + 1}`,
      username: item.username || item.user || '',
      email: item.email || '',
      password: item.password || '',
      websiteUrl: item.websiteUrl || item.url || item.website || '',
      category: item.category || 'Personal',
      notes: item.notes || item.note || ''
    }))
  }

  const parseCSV = (text: string): ImportedPassword[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const passwords: ImportedPassword[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'))
      const password: ImportedPassword = {
        title: '',
        password: '',
        category: 'Personal'
      }

      headers.forEach((header, index) => {
        const value = values[index] || ''
        
        switch (header) {
          case 'title':
          case 'name':
          case 'site':
            password.title = value
            break
          case 'username':
          case 'user':
            password.username = value
            break
          case 'email':
            password.email = value
            break
          case 'password':
            password.password = value
            break
          case 'url':
          case 'website':
          case 'websiteurl':
            password.websiteUrl = value
            break
          case 'category':
          case 'folder':
            password.category = value || 'Personal'
            break
          case 'notes':
          case 'note':
            password.notes = value
            break
        }
      })

      if (!password.title) {
        password.title = password.websiteUrl || `Imported Password ${i}`
      }

      if (password.password) {
        passwords.push(password)
      }
    }

    return passwords
  }

  const parseGeneric = (text: string): ImportedPassword[] => {
    // Simple text parser for basic formats
    const lines = text.split('\n').filter(line => line.trim())
    const passwords: ImportedPassword[] = []

    lines.forEach((line, index) => {
      // Try to extract basic info from each line
      const parts = line.split(/[\t,;]/).map(p => p.trim())
      if (parts.length >= 2) {
        passwords.push({
          title: parts[0] || `Imported Password ${index + 1}`,
          username: parts[1] || '',
          password: parts[2] || parts[1],
          websiteUrl: parts[3] || '',
          category: 'Personal',
          notes: parts.slice(4).join(' ')
        })
      }
    })

    return passwords
  }

  const parseFile = async (file: File) => {
    try {
      const text = await file.text()
      let passwords: ImportedPassword[] = []

      if (file.name.toLowerCase().endsWith('.json')) {
        passwords = parseJSON(text)
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        passwords = parseCSV(text)
      } else {
        passwords = parseGeneric(text)
      }

      setPreviewData(passwords)
      setActiveTab('preview')
      
      toast({
        title: 'File Parsed',
        description: `Found ${passwords.length} passwords to import`
      })
    } catch (error) {
      console.error('Failed to parse file:', error)
      toast({
        title: 'Parse Error',
        description: 'Failed to parse the selected file. Please check the format.',
        variant: 'destructive'
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = ['.csv', '.json', '.txt']
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
    
    if (!validTypes.includes(fileExtension)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a CSV, JSON, or TXT file',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB',
        variant: 'destructive'
      })
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const handleImport = async () => {
    if (!previewData.length) return

    try {
      setImporting(true)
      setProgress(0)
      
      const user = await blink.auth.me()
      const result: ImportResult = {
        total: previewData.length,
        successful: 0,
        failed: 0,
        errors: []
      }

      for (let i = 0; i < previewData.length; i++) {
        const password = previewData[i]
        
        try {
          await blink.db.passwords.create({
            id: `pwd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            title: password.title,
            username: password.username || '',
            email: password.email || '',
            password: password.password, // Store as plain text since we removed encryption
            encryptedPassword: password.password,
            websiteUrl: password.websiteUrl || '',
            category: password.category,
            notes: password.notes || '',
            isFavorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastUsed: null
          })
          
          result.successful++
        } catch (error) {
          result.failed++
          result.errors.push(`Failed to import "${password.title}": ${error}`)
        }

        setProgress(((i + 1) / previewData.length) * 100)
      }

      setImportResult(result)
      setActiveTab('result')
      
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.successful} of ${result.total} passwords`
      })
    } catch (error) {
      console.error('Import failed:', error)
      toast({
        title: 'Import Failed',
        description: 'Failed to import passwords',
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = (format: string) => {
    let content = ''
    let filename = ''
    let mimeType = 'text/plain'

    switch (format) {
      case 'csv':
        content = 'title,username,password,url,notes\nGmail,john@example.com,mypassword123,https://gmail.com,Work email\nFacebook,john@example.com,anotherpassword,https://facebook.com,Social media'
        filename = 'password-template.csv'
        mimeType = 'text/csv'
        break
      case 'json':
        content = JSON.stringify([
          {
            title: 'Gmail',
            username: 'john@example.com',
            password: 'mypassword123',
            websiteUrl: 'https://gmail.com',
            category: 'Work',
            notes: 'Work email'
          },
          {
            title: 'Facebook',
            username: 'john@example.com',
            password: 'anotherpassword',
            websiteUrl: 'https://facebook.com',
            category: 'Social',
            notes: 'Social media'
          }
        ], null, 2)
        filename = 'password-template.json'
        mimeType = 'application/json'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={onCancel} className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Passwords</h1>
          <p className="text-gray-600 mt-1">Import passwords from other password managers or files</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewData.length}>Preview ({previewData.length})</TabsTrigger>
          <TabsTrigger value="import" disabled={!previewData.length}>Import</TabsTrigger>
          <TabsTrigger value="result" disabled={!importResult}>Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Password File</CardTitle>
                <CardDescription>
                  Select a file containing your passwords to import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Choose a file to upload</p>
                    <p className="text-sm text-gray-500">CSV, JSON, or TXT files up to 10MB</p>
                  </div>
                  <Input
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileSelect}
                    className="mt-4"
                  />
                </div>

                {file && (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Supported Formats */}
            <Card>
              <CardHeader>
                <CardTitle>Supported Formats</CardTitle>
                <CardDescription>
                  We support importing from these formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supportedFormats.map((format, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{format.name}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate(format.name.toLowerCase().includes('csv') ? 'csv' : 'json')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Template
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                    <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                      {format.example}
                    </code>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview Import Data</CardTitle>
                  <CardDescription>
                    Review the passwords that will be imported ({previewData.length} items)
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showPasswords ? 'Hide' : 'Show'} Passwords
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previewData.map((password, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Title</Label>
                        <p className="font-medium">{password.title}</p>
                      </div>
                      {password.username && (
                        <div>
                          <Label className="text-xs text-gray-500">Username</Label>
                          <p>{password.username}</p>
                        </div>
                      )}
                      {password.email && (
                        <div>
                          <Label className="text-xs text-gray-500">Email</Label>
                          <p>{password.email}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-gray-500">Password</Label>
                        <p className="font-mono">
                          {showPasswords ? password.password : '••••••••••••'}
                        </p>
                      </div>
                      {password.websiteUrl && (
                        <div>
                          <Label className="text-xs text-gray-500">Website</Label>
                          <p className="truncate">{password.websiteUrl}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-gray-500">Category</Label>
                        <Badge variant="secondary">{password.category}</Badge>
                      </div>
                    </div>
                    {password.notes && (
                      <div className="mt-2">
                        <Label className="text-xs text-gray-500">Notes</Label>
                        <p className="text-sm text-gray-600">{password.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Passwords</CardTitle>
              <CardDescription>
                Ready to import {previewData.length} passwords into your vault
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {importing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Importing passwords...</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will add {previewData.length} new passwords to your vault. 
                  Existing passwords will not be affected.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-3">
                <Button 
                  onClick={handleImport} 
                  disabled={importing}
                  className="flex-1"
                >
                  {importing ? 'Importing...' : `Import ${previewData.length} Passwords`}
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('preview')}>
                  Back to Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Import Complete
                </CardTitle>
                <CardDescription>
                  Import results for your password data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{importResult.total}</p>
                    <p className="text-sm text-blue-700">Total Passwords</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{importResult.successful}</p>
                    <p className="text-sm text-green-700">Successfully Imported</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-sm text-red-700">Failed to Import</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label>Import Errors</Label>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-700">{error}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button onClick={onComplete} className="flex-1">
                    Go to Password Vault
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('upload')}>
                    Import More
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}