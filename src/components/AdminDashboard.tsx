import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface AdminDashboardProps {
  onNavigate?: (section: string) => void
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps = {}) {
  const { language } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-aqua p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{language === 'uk' ? 'Панель адміністратора' : 'Admin Dashboard'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onNavigate?.('products')}>
              {language === 'uk' ? 'До продуктів' : 'To products'}
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('orders')}>
              {language === 'uk' ? 'Замовлення' : 'Orders'}
            </Button>
            <Button variant="destructive" onClick={() => { sessionStorage.removeItem('adminAuthed'); onNavigate?.('hero') }}>
              {language === 'uk' ? 'Вийти' : 'Logout'}
            </Button>
          </div>
          <p className="mt-4 text-sm opacity-80">
            {language === 'uk' ? 'Адмінка спрощена і захищена простим логіном через AdminGate.' : 'Admin area simplified and protected by AdminGate login.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
