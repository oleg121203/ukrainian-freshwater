import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'

interface AdminDashboardProps {
  onNavigate?: (section: string) => void
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps = {}) {
  const { language } = useLanguage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  const handlePasswordLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAuthenticated(true)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-aqua flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{language === 'uk' ? 'Адміністративна панель' : 'Admin Panel'}</CardTitle>
            <CardDescription>
              {language === 'uk' 
                ? 'Увійдіть для доступу до налаштувань' 
                : 'Login to access settings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">
                {language === 'uk' ? 'Пароль адміністратора' : 'Admin Password'}
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handlePasswordLogin()}
                placeholder={language === 'uk' ? 'Введіть пароль' : 'Enter password'}
              />
            </div>
            <Button onClick={handlePasswordLogin} className="w-full" disabled={!adminPassword}>
              {language === 'uk' ? 'Увійти' : 'Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-aqua p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{language === 'uk' ? 'Панель адміністратора' : 'Admin Dashboard'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{language === 'uk' ? 'Адміністративна панель в розробці' : 'Admin panel under development'}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
