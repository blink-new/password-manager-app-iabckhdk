import { useState } from 'react'
import { Copy, RefreshCw, Check, Zap } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { Switch } from '../ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useToast } from '../../hooks/use-toast'
import { generatePassword, calculatePasswordStrength } from '../../utils/passwordGenerator'

export function PasswordGenerator() {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState([16])
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [excludeSimilar, setExcludeSimilar] = useState(false)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleGenerate = () => {
    const options = {
      length: length[0],
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
      excludeSimilar,
      excludeAmbiguous
    }

    const newPassword = generatePassword(options)
    setPassword(newPassword)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!password) return

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Password copied to clipboard'
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy password',
        variant: 'destructive'
      })
    }
  }

  const strength = password ? calculatePasswordStrength(password) : null

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

  // Generate initial password
  if (!password) {
    handleGenerate()
  }

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Generator</h1>
        <p className="text-gray-600">Generate secure passwords with customizable options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generated Password */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-indigo-600" />
                Generated Password
              </CardTitle>
              <CardDescription>
                Your secure password is ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  value={password}
                  readOnly
                  className="font-mono text-lg pr-20"
                  placeholder="Click generate to create a password"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    disabled={!password}
                    className="h-8 w-8 p-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleGenerate}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {strength && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Password Strength</span>
                    <Badge className={getStrengthColor(strength.score)}>
                      {getStrengthLabel(strength.score)} ({strength.score}/100)
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

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${strength.hasUppercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Uppercase
                    </div>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${strength.hasLowercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Lowercase
                    </div>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${strength.hasNumbers ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Numbers
                    </div>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${strength.hasSymbols ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Symbols
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={handleGenerate} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate New
                </Button>
                <Button variant="outline" onClick={handleCopy} disabled={!password}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation Options</CardTitle>
              <CardDescription>
                Customize your password requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Length */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="length">Password Length</Label>
                  <Badge variant="secondary">{length[0]} characters</Badge>
                </div>
                <Slider
                  id="length"
                  min={4}
                  max={128}
                  step={1}
                  value={length}
                  onValueChange={setLength}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>4</span>
                  <span>128</span>
                </div>
              </div>

              {/* Character Types */}
              <div className="space-y-4">
                <Label>Character Types</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="uppercase" className="text-sm font-normal">
                        Uppercase Letters
                      </Label>
                      <p className="text-xs text-gray-500">A-Z</p>
                    </div>
                    <Switch
                      id="uppercase"
                      checked={includeUppercase}
                      onCheckedChange={setIncludeUppercase}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="lowercase" className="text-sm font-normal">
                        Lowercase Letters
                      </Label>
                      <p className="text-xs text-gray-500">a-z</p>
                    </div>
                    <Switch
                      id="lowercase"
                      checked={includeLowercase}
                      onCheckedChange={setIncludeLowercase}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="numbers" className="text-sm font-normal">
                        Numbers
                      </Label>
                      <p className="text-xs text-gray-500">0-9</p>
                    </div>
                    <Switch
                      id="numbers"
                      checked={includeNumbers}
                      onCheckedChange={setIncludeNumbers}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="symbols" className="text-sm font-normal">
                        Symbols
                      </Label>
                      <p className="text-xs text-gray-500">!@#$%^&*</p>
                    </div>
                    <Switch
                      id="symbols"
                      checked={includeSymbols}
                      onCheckedChange={setIncludeSymbols}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <Label>Advanced Options</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="exclude-similar" className="text-sm font-normal">
                        Exclude Similar Characters
                      </Label>
                      <p className="text-xs text-gray-500">Avoid i, l, 1, L, o, 0, O</p>
                    </div>
                    <Switch
                      id="exclude-similar"
                      checked={excludeSimilar}
                      onCheckedChange={setExcludeSimilar}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="exclude-ambiguous" className="text-sm font-normal">
                        Exclude Ambiguous Characters
                      </Label>
                      <p className="text-xs text-gray-500">Avoid {`{ } [ ] ( ) / \\ ' " ~ , ; . < >`}</p>
                    </div>
                    <Switch
                      id="exclude-ambiguous"
                      checked={excludeAmbiguous}
                      onCheckedChange={setExcludeAmbiguous}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}