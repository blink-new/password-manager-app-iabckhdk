import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  Copy, 
  RefreshCw,
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useToast } from '../../hooks/use-toast'
import { Password } from '../../types/password'
import { blink } from '../../blink/client'
import { calculatePasswordStrength } from '../../utils/passwordGenerator'

interface PasswordHealthProps {
  onEditPassword: (password: Password) => void
}

interface HealthStats {
  total: number
  weak: number
  duplicate: number
  old: number
  strong: number
  score: number
}

export function PasswordHealth({ onEditPassword }: PasswordHealthProps) {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [healthStats, setHealthStats] = useState<HealthStats>({
    total: 0,
    weak: 0,
    duplicate: 0,
    old: 0,
    strong: 0,
    score: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  const analyzePasswordHealth = (passwordList: Password[]) => {
    const stats: HealthStats = {
      total: passwordList.length,
      weak: 0,
      duplicate: 0,
      old: 0,
      strong: 0,
      score: 0
    }

    const passwordValues: string[] = []
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    passwordList.forEach(password => {
      const strength = calculatePasswordStrength(password.password || password.encryptedPassword)
      
      // Check weakness
      if (strength.score < 60) {
        stats.weak++
      } else if (strength.score >= 80) {
        stats.strong++
      }

      // Check for duplicates
      const passwordValue = password.password || password.encryptedPassword
      if (passwordValues.includes(passwordValue)) {
        stats.duplicate++
      } else {
        passwordValues.push(passwordValue)
      }

      // Check age (older than 6 months)
      const updatedDate = new Date(password.updatedAt)
      if (updatedDate < sixMonthsAgo) {
        stats.old++
      }
    })

    // Calculate overall security score
    if (stats.total > 0) {
      const weakPenalty = (stats.weak / stats.total) * 40
      const duplicatePenalty = (stats.duplicate / stats.total) * 30
      const oldPenalty = (stats.old / stats.total) * 20
      const strongBonus = (stats.strong / stats.total) * 10
      
      stats.score = Math.max(0, Math.min(100, 100 - weakPenalty - duplicatePenalty - oldPenalty + strongBonus))
    }

    setHealthStats(stats)
  }

  useEffect(() => {
    const loadPasswords = async () => {
      try {
        setLoading(true)
        const user = await blink.auth.me()
        const data = await blink.db.passwords.list({
          where: { userId: user.id }
        })
        setPasswords(data)
        analyzePasswordHealth(data)
      } catch (error) {
        console.error('Failed to load passwords:', error)
        toast({
          title: 'Error',
          description: 'Failed to load password data',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadPasswords()
  }, [toast])

  const getWeakPasswords = () => {
    return passwords.filter(password => {
      const strength = calculatePasswordStrength(password.password || password.encryptedPassword)
      return strength.score < 60
    })
  }

  const getDuplicatePasswords = () => {
    const passwordGroups: { [key: string]: Password[] } = {}
    
    passwords.forEach(password => {
      const passwordValue = password.password || password.encryptedPassword
      if (!passwordGroups[passwordValue]) {
        passwordGroups[passwordValue] = []
      }
      passwordGroups[passwordValue].push(password)
    })

    return Object.values(passwordGroups).filter(group => group.length > 1).flat()
  }

  const getOldPasswords = () => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    return passwords.filter(password => {
      const updatedDate = new Date(password.updatedAt)
      return updatedDate < sixMonthsAgo
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Health</h1>
        <p className="text-gray-600">Monitor and improve your password security</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(healthStats.score)}`}>
                  {Math.round(healthStats.score)}
                </p>
                <p className="text-xs text-gray-500">{getScoreLabel(healthStats.score)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <Progress value={healthStats.score} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weak Passwords</p>
                <p className="text-2xl font-bold text-red-600">{healthStats.weak}</p>
                <p className="text-xs text-gray-500">Need strengthening</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Duplicate Passwords</p>
                <p className="text-2xl font-bold text-orange-600">{healthStats.duplicate}</p>
                <p className="text-xs text-gray-500">Reused passwords</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Copy className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Old Passwords</p>
                <p className="text-2xl font-bold text-yellow-600">{healthStats.old}</p>
                <p className="text-xs text-gray-500">6+ months old</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Security Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of your password security issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="weak">Weak ({healthStats.weak})</TabsTrigger>
              <TabsTrigger value="duplicate">Duplicate ({healthStats.duplicate})</TabsTrigger>
              <TabsTrigger value="old">Old ({healthStats.old})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Security Recommendations</h3>
                  <div className="space-y-3">
                    {healthStats.weak > 0 && (
                      <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900">Strengthen weak passwords</p>
                          <p className="text-sm text-red-700">
                            You have {healthStats.weak} weak passwords that should be updated
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {healthStats.duplicate > 0 && (
                      <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                        <XCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-orange-900">Remove duplicate passwords</p>
                          <p className="text-sm text-orange-700">
                            {healthStats.duplicate} passwords are being reused across accounts
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {healthStats.old > 0 && (
                      <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-900">Update old passwords</p>
                          <p className="text-sm text-yellow-700">
                            {healthStats.old} passwords haven't been changed in 6+ months
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {healthStats.weak === 0 && healthStats.duplicate === 0 && healthStats.old === 0 && (
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900">Great job!</p>
                          <p className="text-sm text-green-700">
                            Your passwords are in excellent condition
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Security Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Strong passwords</span>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        {healthStats.strong}/{healthStats.total}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Unique passwords</span>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        {healthStats.total - healthStats.duplicate}/{healthStats.total}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Recently updated</span>
                      <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                        {healthStats.total - healthStats.old}/{healthStats.total}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="weak" className="space-y-4">
              <PasswordList 
                passwords={getWeakPasswords()} 
                title="Weak Passwords"
                description="These passwords are vulnerable and should be strengthened"
                onEdit={onEditPassword}
                type="weak"
              />
            </TabsContent>

            <TabsContent value="duplicate" className="space-y-4">
              <PasswordList 
                passwords={getDuplicatePasswords()} 
                title="Duplicate Passwords"
                description="These passwords are being reused across multiple accounts"
                onEdit={onEditPassword}
                type="duplicate"
              />
            </TabsContent>

            <TabsContent value="old" className="space-y-4">
              <PasswordList 
                passwords={getOldPasswords()} 
                title="Old Passwords"
                description="These passwords haven't been updated in over 6 months"
                onEdit={onEditPassword}
                type="old"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface PasswordListProps {
  passwords: Password[]
  title: string
  description: string
  onEdit: (password: Password) => void
  type: 'weak' | 'duplicate' | 'old'
}

function PasswordList({ passwords, title, description, onEdit, type }: PasswordListProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'weak': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'duplicate': return <Copy className="w-5 h-5 text-orange-600" />
      case 'old': return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'weak': return 'border-red-200 bg-red-50'
      case 'duplicate': return 'border-orange-200 bg-orange-50'
      case 'old': return 'border-yellow-200 bg-yellow-50'
    }
  }

  if (passwords.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">All good!</h3>
        <p className="text-gray-600">No issues found in this category.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        {getTypeIcon()}
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {passwords.map(password => (
          <div key={password.id} className={`p-4 rounded-lg border ${getTypeColor()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {password.title.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium">{password.title}</h4>
                  <p className="text-sm text-gray-600">{password.category}</p>
                  {type === 'weak' && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-red-600">
                        Strength: {calculatePasswordStrength(password.password || password.encryptedPassword).score}/100
                      </span>
                    </div>
                  )}
                  {type === 'old' && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-yellow-600">
                        Last updated: {new Date(password.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={() => onEdit(password)} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Update
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}