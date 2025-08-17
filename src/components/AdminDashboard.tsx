import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { useKV } from '@/hooks/useKV'
import { useState } from 'react'
import { toast } from 'sonner'

interface AdminDashboardProps {
  onNavigate?: (section: string) => void
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps = {}) {
  const { language } = useLanguage()
  const [exchangeRatePerShrimp, setExchangeRatePerShrimp] = useKV<number>('exchange-rate-per-shrimp', 0.05) // kg per shrimp
  const [minShrimpForExchange, setMinShrimpForExchange] = useKV<number>('min-shrimp-for-exchange', 20)
  const [totalExchangeableShrimp] = useKV<number>('exchangeable-shrimp', 0)
  const [exchangeHistory, setExchangeHistory] = useKV<any[]>('exchange-history', [])
  const [newExchangeRate, setNewExchangeRate] = useState(exchangeRatePerShrimp.toString())
  const [newMinShrimp, setNewMinShrimp] = useState(minShrimpForExchange.toString())

  const updateExchangeSettings = () => {
    const rate = parseFloat(newExchangeRate)
    const minShrimp = parseInt(newMinShrimp)
    
    if (isNaN(rate) || rate <= 0) {
      toast.error(language === 'uk' ? 'Невірний курс обміну' : 'Invalid exchange rate')
      return
    }
    
    if (isNaN(minShrimp) || minShrimp < 1) {
      toast.error(language === 'uk' ? 'Невірна мінімальна кількість' : 'Invalid minimum quantity')
      return
    }
    
    setExchangeRatePerShrimp(rate)
    setMinShrimpForExchange(minShrimp)
    toast.success(language === 'uk' ? 'Налаштування оновлено' : 'Settings updated')
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

            {/* Shrimp Exchange Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'uk' ? '🦐 Обмін креветками' : '🦐 Shrimp Exchange'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'uk' ? 'Доступно для обміну:' : 'Available for exchange:'}</span>
                    <Badge variant="secondary">{totalExchangeableShrimp}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{language === 'uk' ? 'Курс обміну:' : 'Exchange rate:'}</span>
                    <span>{exchangeRatePerShrimp} кг/креветка</span>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-sm font-medium">
                    {language === 'uk' ? 'Курс обміну (кг за креветку):' : 'Exchange rate (kg per shrimp):'}
                  </label>
                  <Input
                    type="number"
                    step="0.001"
                    value={newExchangeRate}
                    onChange={(e) => setNewExchangeRate(e.target.value)}
                    placeholder="0.05"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === 'uk' ? 'Мін. кількість для обміну:' : 'Min. quantity for exchange:'}
                  </label>
                  <Input
                    type="number"
                    value={newMinShrimp}
                    onChange={(e) => setNewMinShrimp(e.target.value)}
                    placeholder="20"
                  />
                </div>
                
                <Button onClick={updateExchangeSettings} className="w-full" size="sm">
                  {language === 'uk' ? 'Оновити налаштування' : 'Update Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Exchange History */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'uk' ? '📊 Історія обмінів' : '📊 Exchange History'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exchangeHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {language === 'uk' ? 'Поки немає обмінів' : 'No exchanges yet'}
                </p>
              ) : (
                <div className="space-y-2">
                  {exchangeHistory.slice(-10).reverse().map((exchange, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <span className="font-medium">{exchange.shrimpCount} креветок</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          → {exchange.kgReceived} кг
                        </span>
                      </div>
                      <Badge variant="outline">
                        {new Date(exchange.timestamp).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
