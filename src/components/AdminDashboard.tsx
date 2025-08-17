import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import { useKV } from '@/hooks/useKV'
import { useState } from 'react'
import { toast } from 'sonner'

interface AdminConfig {
  exchangeRate: number // kg per shrimp
  minExchangeWeight: number // minimum kg to exchange
  breedingChance: number // 0-1
  growthSpeed: number // multiplier
}

interface AdminDashboardProps {
  onNavigate?: (section: string) => void
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps = {}) {
  const { language } = useLanguage()
  
  const [adminConfig, setAdminConfig] = useKV<AdminConfig>('admin-shrimp-config', {
    exchangeRate: 0.15,
    minExchangeWeight: 1.0,
    breedingChance: 0.3,
    growthSpeed: 1.0
  })
  
  const [tempConfig, setTempConfig] = useState<AdminConfig>(adminConfig)

  const saveConfig = () => {
    setAdminConfig(tempConfig)
    toast.success('Налаштування збережено!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-cyan-900 to-teal-900 p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{language === 'uk' ? 'Панель адміністратора' : 'Admin Dashboard'}</span>
            <Button 
              variant="outline" 
              onClick={() => {
                sessionStorage.removeItem('adminAuthed')
                onNavigate?.('hero')
              }}
            >
              {language === 'uk' ? 'Вийти' : 'Logout'}
            </Button>
          </CardTitle>
        </CardHeader>
  <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Website Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'uk' ? '🌐 Управління сайтом' : '🌐 Website Management'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate?.('products')}
                >
                  {language === 'uk' ? 'Продукція' : 'Products'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate?.('orders')}
                >
                  {language === 'uk' ? 'Замовлення' : 'Orders'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate?.('gallery')}
                >
                  {language === 'uk' ? 'Галерея' : 'Gallery'}
                </Button>
              </CardContent>
            </Card>

            {/* Game Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'uk' ? '🎮 Управління іграми' : '🎮 Game Management'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
      onClick={() => onNavigate?.('game')}
                >
      {language === 'uk' ? 'Інтерактивна гра' : 'Interactive Game'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate?.('hero')}
                >
                  {language === 'uk' ? '3D Візуалізація' : '3D Visualization'}
                </Button>
              </CardContent>
            </Card>

            {/* Customer Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'uk' ? '👥 Клієнти' : '👥 Customers'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate?.('reviews')}
                >
                  {language === 'uk' ? 'Відгуки' : 'Reviews'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate?.('contact')}
                >
                  {language === 'uk' ? 'Контакти' : 'Contacts'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate?.('payment-admin')}
                >
                  {language === 'uk' ? 'Платежі' : 'Payments'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Shrimp Game Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'uk' ? '🦐 Налаштування гри з креветками' : '🦐 Shrimp Game Configuration'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exchangeRate">
                    {language === 'uk' ? 'Курс обміну (кг за креветку)' : 'Exchange Rate (kg per shrimp)'}
                  </Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.01"
                    value={tempConfig.exchangeRate}
                    onChange={(e) => setTempConfig({...tempConfig, exchangeRate: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="minWeight">
                    {language === 'uk' ? 'Мінімальна вага для обміну (кг)' : 'Minimum exchange weight (kg)'}
                  </Label>
                  <Input
                    id="minWeight"
                    type="number"
                    step="0.1"
                    value={tempConfig.minExchangeWeight}
                    onChange={(e) => setTempConfig({...tempConfig, minExchangeWeight: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="breedingChance">
                    {language === 'uk' ? 'Шанс розмноження (0-1)' : 'Breeding chance (0-1)'}
                  </Label>
                  <Input
                    id="breedingChance"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={tempConfig.breedingChance}
                    onChange={(e) => setTempConfig({...tempConfig, breedingChance: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="growthSpeed">
                    {language === 'uk' ? 'Швидкість росту (множник)' : 'Growth speed (multiplier)'}
                  </Label>
                  <Input
                    id="growthSpeed"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={tempConfig.growthSpeed}
                    onChange={(e) => setTempConfig({...tempConfig, growthSpeed: parseFloat(e.target.value) || 1})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveConfig}>
                  {language === 'uk' ? 'Зберегти налаштування' : 'Save Settings'}
                </Button>
                <Button variant="outline" onClick={() => setTempConfig(adminConfig)}>
                  {language === 'uk' ? 'Скасувати' : 'Cancel'}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  {language === 'uk' 
                    ? 'Поточні налаштування впливають на механіку гри вирощування креветок.' 
                    : 'Current settings affect the shrimp growing game mechanics.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'uk' ? '📊 Статус системи' : '📊 System Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-green-100 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✅</div>
                  <div className="text-sm">{language === 'uk' ? 'Сайт працює' : 'Website Online'}</div>
                </div>
                <div className="p-4 bg-blue-100 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">🎮</div>
                  <div className="text-sm">{language === 'uk' ? 'Ігри активні' : 'Games Active'}</div>
                </div>
                <div className="p-4 bg-purple-100 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">🚀</div>
                  <div className="text-sm">{language === 'uk' ? '3D готове' : '3D Ready'}</div>
                </div>
                <div className="p-4 bg-orange-100 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">🛒</div>
                  <div className="text-sm">{language === 'uk' ? 'Магазин працює' : 'Shop Online'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
