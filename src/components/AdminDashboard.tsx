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
                  onClick={() => onNavigate?.('feeding')}
                >
                  {language === 'uk' ? 'Симулятор годування' : 'Feeding Simulator'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => onNavigate?.('petka')}
                >
                  {language === 'uk' ? 'Гра Петька' : 'Petka Game'}
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
