import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Save,
  Key,
  TestTube,
  CreditCard,
  Eye,
  EyeSlash,
  CheckCircle,
  AlertTriangle,
  Building,
  Smartphone,
  Shield,
  ArrowLeft,
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePaymentService, PaymentTransaction } from '@/services/paymentService'
import { toast } from 'sonner'

interface PaymentAdminProps {
  onNavigate?: (section: string) => void
}

export function PaymentAdmin({ onNavigate }: PaymentAdminProps) {
  const { language } = useLanguage()
  const { updateSettings, getSettings, getAllTransactions } = usePaymentService()

  const [apiKey, setApiKey] = useState('')
  const [testMode, setTestMode] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])

  useEffect(() => {
    loadSettings()
    loadTransactions()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await getSettings()
      setApiKey(settings.apiKey)
      setTestMode(settings.testMode)
    } catch (error) {
      toast.error('Failed to load payment settings')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      const allTransactions = await getAllTransactions()
      setTransactions(allTransactions.slice(0, 10)) // Show last 10 transactions
    } catch (error) {
      console.error('Failed to load transactions:', error)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await updateSettings(apiKey, testMode)
      toast.success(language === 'uk' ? 'Налаштування збережено' : 'Settings saved successfully')
    } catch (error) {
      toast.error(language === 'uk' ? 'Помилка збереження налаштувань' : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'uk' ? 'uk-UA' : 'en-US')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CreditCard size={32} className="text-primary" />
              {language === 'uk' ? 'Налаштування платежів' : 'Payment Settings'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === 'uk'
                ? 'Налаштуйте платіжні системи та переглядайте транзакції'
                : 'Configure payment systems and view transactions'}
            </p>
          </div>
          {onNavigate && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onNavigate('admin')}>
                <ArrowLeft size={16} className="mr-2" />
                {language === 'uk' ? 'Назад до адміністрування' : 'Back to Admin'}
              </Button>
              <Button variant="outline" onClick={() => onNavigate('shop-test')}>
                <CreditCard size={16} className="mr-2" />
                {language === 'uk' ? 'Тест платежів' : 'Test Payments'}
              </Button>
            </div>
          )}
        </div>

        {/* Test Mode Warning */}
        {testMode && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <TestTube className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>
                {language === 'uk' ? 'Тестовий режим активний' : 'Test mode is active'}
              </strong>
              <br />
              {language === 'uk'
                ? 'Всі платежі будуть симуляцією. Реальні кошти не будуть знятіі.'
                : 'All payments will be simulated. No real money will be charged.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Available Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard size={20} />
                  {language === 'uk' ? 'Доступні способи оплати' : 'Available Payment Methods'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Payments */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {language === 'uk' ? 'Картки' : 'Cards'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} />
                          <span className="text-sm">Visa/Mastercard</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} />
                          <span className="text-sm">Apple Pay</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} />
                          <span className="text-sm">Google Pay</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Ukrainian Banks */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {language === 'uk' ? 'Українські банки' : 'Ukrainian Banks'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Building size={16} />
                          <span className="text-sm">Приват24</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Building size={16} />
                          <span className="text-sm">Monobank</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Building size={16} />
                          <span className="text-sm">Ощадбанк</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Building size={16} />
                          <span className="text-sm">УкрГазБанк</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} />
                          <span className="text-sm">iBox Bank</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* International Wallets */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {language === 'uk' ? 'Електронні гаманці' : 'Digital Wallets'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Building size={16} />
                          <span className="text-sm">PayPal</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} />
                          <span className="text-sm">Skrill</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} />
                          <span className="text-sm">WebMoney</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} />
                          <span className="text-sm">QIWI</span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Other Methods */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {language === 'uk' ? 'Інші способи' : 'Other Methods'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Building size={16} />
                          <span className="text-sm">
                            {language === 'uk' ? 'Банківський переказ' : 'Bank Transfer'}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Shield size={16} />
                          <span className="text-sm">
                            {language === 'uk' ? 'Криптовалюта' : 'Cryptocurrency'}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {language === 'uk' ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  {language === 'uk' ? 'Основні налаштування' : 'Basic Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      {language === 'uk' ? 'Тестовий режим' : 'Test Mode'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === 'uk'
                        ? 'Увімкніть для тестування без реальних платежів'
                        : 'Enable for testing without real payments'}
                    </p>
                  </div>
                  <Switch checked={testMode} onCheckedChange={setTestMode} />
                </div>

                <Separator />

                {/* API Key */}
                <div className="space-y-3">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <Key size={16} />
                    {language === 'uk' ? 'API Ключ' : 'API Key'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder={
                        language === 'uk'
                          ? 'Введіть API ключ платіжної системи'
                          : 'Enter payment system API key'
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'uk'
                      ? 'API ключ для інтеграції з платіжними системами (LiqPay, Fondy, Stripe тощо)'
                      : 'API key for payment system integration (LiqPay, Fondy, Stripe, etc.)'}
                  </p>
                </div>

                {/* Save Button */}
                <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  {isSaving
                    ? language === 'uk'
                      ? 'Збереження...'
                      : 'Saving...'
                    : language === 'uk'
                      ? 'Зберегти налаштування'
                      : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>

            {/* Supported Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'uk' ? 'Підтримувані методи оплати' : 'Supported Payment Methods'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Visa/Mastercard', status: 'active' },
                    { name: 'Apple Pay', status: 'active' },
                    { name: 'Google Pay', status: 'active' },
                    { name: 'Приват24', status: 'active' },
                    { name: 'Monobank', status: 'active' },
                    { name: 'PayPal', status: 'active' },
                    { name: 'Bitcoin', status: 'active' },
                    { name: 'USDT', status: 'active' },
                  ].map(method => (
                    <div
                      key={method.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <span className="text-sm font-medium">{method.name}</span>
                      <Badge
                        variant="secondary"
                        className={method.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        <CheckCircle size={12} className="mr-1" />
                        {method.status === 'active'
                          ? language === 'uk'
                            ? 'Активний'
                            : 'Active'
                          : language === 'uk'
                            ? 'Неактивний'
                            : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'uk' ? 'Останні транзакції' : 'Recent Transactions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'uk' ? 'Немає транзакцій' : 'No transactions'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(transaction => (
                      <div key={transaction.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                          <span className="text-sm font-semibold">{transaction.amount} UAH</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>ID: {transaction.id.slice(0, 12)}...</p>
                          <p>{transaction.method.toUpperCase()}</p>
                          <p>{formatDate(transaction.createdAt)}</p>
                          {transaction.customerData.name && <p>{transaction.customerData.name}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Stats */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'uk' ? 'Статистика' : 'Statistics'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {transactions.filter(t => t.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'uk' ? 'Успішні платежі' : 'Successful payments'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {transactions.filter(t => t.status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'uk' ? 'В очікуванні' : 'Pending'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">
                    {transactions.filter(t => t.status === 'failed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'uk' ? 'Невдалі' : 'Failed'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
