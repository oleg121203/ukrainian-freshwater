import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  CheckCircle, 
  Shield,
  Lock,
  AlertCircle,
  ArrowRight
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface PaymentFormProps {
  totalAmount: number
  onPaymentSubmit: (paymentData: PaymentData) => Promise<void>
  onBack: () => void
  isSubmitting: boolean
}

interface PaymentData {
  method: 'card' | 'apple_pay' | 'google_pay' | 'privat24' | 'monobank' | 'paypal' | 'crypto'
  cardData?: {
    number: string
    expiry: string
    cvv: string
    name: string
  }
  bankData?: {
    phone: string
  }
  walletData?: {
    email: string
  }
  cryptoData?: {
    wallet: string
    currency: 'btc' | 'eth' | 'usdt'
  }
}

export function PaymentForm({ totalAmount, onPaymentSubmit, onBack, isSubmitting }: PaymentFormProps) {
  const { language, t } = useLanguage()
  const [paymentMethod, setPaymentMethod] = useState<string>('card')
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })
  const [bankPhone, setBankPhone] = useState('')
  const [walletEmail, setWalletEmail] = useState('')
  const [cryptoWallet, setCryptoWallet] = useState('')
  const [cryptoCurrency, setCryptoCurrency] = useState<'btc' | 'eth' | 'usdt'>('usdt')
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const paymentMethods = [
    {
      id: 'card',
      name: language === 'uk' ? 'Банківська картка' : 'Credit/Debit Card',
      icon: CreditCard,
      description: language === 'uk' ? 'Visa, Mastercard, Мир' : 'Visa, Mastercard, Мир',
      fee: '0%',
      popular: true
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: Smartphone,
      description: language === 'uk' ? 'Швидка оплата через Apple' : 'Quick Apple payment',
      fee: '0%',
      available: /iPad|iPhone|iPod/.test(navigator.userAgent)
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      icon: Smartphone,
      description: language === 'uk' ? 'Швидка оплата через Google' : 'Quick Google payment',
      fee: '0%',
      available: true
    },
    {
      id: 'privat24',
      name: 'Приват24',
      icon: Building,
      description: language === 'uk' ? 'Оплата через Приват24' : 'PrivatBank payment',
      fee: '0%'
    },
    {
      id: 'monobank',
      name: 'Monobank',
      icon: Building,
      description: language === 'uk' ? 'Оплата через Monobank' : 'Monobank payment',
      fee: '0%'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Building,
      description: language === 'uk' ? 'Міжнародна система оплати' : 'International payment system',
      fee: '2.9%'
    },
    {
      id: 'crypto',
      name: language === 'uk' ? 'Криптовалюта' : 'Cryptocurrency',
      icon: Shield,
      description: 'Bitcoin, Ethereum, USDT',
      fee: '1%'
    }
  ]

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const validateCardData = () => {
    const { number, expiry, cvv, name } = cardData
    
    if (!number || number.replace(/\s/g, '').length < 13) {
      toast.error(language === 'uk' ? 'Введіть коректний номер картки' : 'Enter a valid card number')
      return false
    }
    
    if (!expiry || expiry.length !== 5) {
      toast.error(language === 'uk' ? 'Введіть коректну дату дії' : 'Enter a valid expiry date')
      return false
    }
    
    if (!cvv || cvv.length < 3) {
      toast.error(language === 'uk' ? 'Введіть коректний CVV код' : 'Enter a valid CVV code')
      return false
    }
    
    if (!name.trim()) {
      toast.error(language === 'uk' ? 'Введіть ім\'я власника картки' : 'Enter cardholder name')
      return false
    }
    
    return true
  }

  const validateBankPayment = () => {
    if (!bankPhone || !/^\+?[\d\s\-\(\)]+$/.test(bankPhone)) {
      toast.error(language === 'uk' ? 'Введіть коректний номер телефону' : 'Enter a valid phone number')
      return false
    }
    return true
  }

  const validateWalletPayment = () => {
    if (!walletEmail || !/\S+@\S+\.\S+/.test(walletEmail)) {
      toast.error(language === 'uk' ? 'Введіть коректну електронну адресу' : 'Enter a valid email address')
      return false
    }
    return true
  }

  const validateCryptoPayment = () => {
    if (!cryptoWallet.trim()) {
      toast.error(language === 'uk' ? 'Введіть адресу криптогаманця' : 'Enter crypto wallet address')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!agreeToTerms) {
      toast.error(language === 'uk' ? 'Прийміть умови користування' : 'Please accept the terms and conditions')
      return
    }

    let paymentData: PaymentData = { method: paymentMethod as any }

    // Validate based on payment method
    switch (paymentMethod) {
      case 'card':
        if (!validateCardData()) return
        paymentData.cardData = cardData
        break
      case 'privat24':
      case 'monobank':
        if (!validateBankPayment()) return
        paymentData.bankData = { phone: bankPhone }
        break
      case 'paypal':
        if (!validateWalletPayment()) return
        paymentData.walletData = { email: walletEmail }
        break
      case 'crypto':
        if (!validateCryptoPayment()) return
        paymentData.cryptoData = { wallet: cryptoWallet, currency: cryptoCurrency }
        break
      case 'apple_pay':
      case 'google_pay':
        // These would typically use native APIs
        break
    }

    await onPaymentSubmit(paymentData)
  }

  const calculateFinalAmount = () => {
    const method = paymentMethods.find(m => m.id === paymentMethod)
    if (!method || method.fee === '0%') return totalAmount
    
    const feePercentage = parseFloat(method.fee.replace('%', ''))
    const feeAmount = totalAmount * (feePercentage / 100)
    return totalAmount + feeAmount
  }

  const finalAmount = calculateFinalAmount()
  const feeAmount = finalAmount - totalAmount

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          {language === 'uk' 
            ? '🔒 Всі платежі захищені SSL-шифруванням та відповідають стандартам PCI DSS'
            : '🔒 All payments are secured with SSL encryption and PCI DSS compliant'
          }
        </AlertDescription>
      </Alert>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            {language === 'uk' ? 'Оберіть спосіб оплати' : 'Choose Payment Method'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="relative">
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <method.icon size={24} className="text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{method.name}</span>
                            {method.popular && (
                              <Badge variant="secondary" className="text-xs">
                                {language === 'uk' ? 'Популярний' : 'Popular'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {method.fee === '0%' 
                            ? (language === 'uk' ? 'Без комісії' : 'No fee')
                            : `${language === 'uk' ? 'Комісія' : 'Fee'} ${method.fee}`
                          }
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
                {method.available === false && (
                  <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">
                      {language === 'uk' ? 'Недоступно' : 'Unavailable'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Details Form */}
      {paymentMethod === 'card' && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'uk' ? 'Дані картки' : 'Card Details'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">
                {language === 'uk' ? 'Номер картки' : 'Card Number'} *
              </Label>
              <Input
                id="cardNumber"
                value={cardData.number}
                onChange={(e) => setCardData(prev => ({
                  ...prev, 
                  number: formatCardNumber(e.target.value)
                }))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">
                  {language === 'uk' ? 'Дата дії' : 'Expiry Date'} *
                </Label>
                <Input
                  id="expiry"
                  value={cardData.expiry}
                  onChange={(e) => setCardData(prev => ({
                    ...prev, 
                    expiry: formatExpiry(e.target.value)
                  }))}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV *</Label>
                <Input
                  id="cvv"
                  value={cardData.cvv}
                  onChange={(e) => setCardData(prev => ({
                    ...prev, 
                    cvv: e.target.value.replace(/\D/g, '')
                  }))}
                  placeholder="123"
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cardName">
                {language === 'uk' ? 'Ім\'я власника картки' : 'Cardholder Name'} *
              </Label>
              <Input
                id="cardName"
                value={cardData.name}
                onChange={(e) => setCardData(prev => ({
                  ...prev, 
                  name: e.target.value
                }))}
                placeholder="JOHN DOE"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {(paymentMethod === 'privat24' || paymentMethod === 'monobank') && (
        <Card>
          <CardHeader>
            <CardTitle>
              {paymentMethod === 'privat24' ? 'Приват24' : 'Monobank'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="bankPhone">
                {language === 'uk' ? 'Номер телефону' : 'Phone Number'} *
              </Label>
              <Input
                id="bankPhone"
                value={bankPhone}
                onChange={(e) => setBankPhone(e.target.value)}
                placeholder="+380 XX XXX XX XX"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'uk' 
                  ? 'Номер телефону, прив\'язаний до мобільного банку'
                  : 'Phone number linked to mobile banking'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === 'paypal' && (
        <Card>
          <CardHeader>
            <CardTitle>PayPal</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="paypalEmail">
                {language === 'uk' ? 'Email PayPal' : 'PayPal Email'} *
              </Label>
              <Input
                id="paypalEmail"
                type="email"
                value={walletEmail}
                onChange={(e) => setWalletEmail(e.target.value)}
                placeholder="your@paypal.com"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === 'crypto' && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'uk' ? 'Криптовалюта' : 'Cryptocurrency'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cryptoCurrency">
                {language === 'uk' ? 'Валюта' : 'Currency'} *
              </Label>
              <Select value={cryptoCurrency} onValueChange={(value: any) => setCryptoCurrency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usdt">USDT (Tether)</SelectItem>
                  <SelectItem value="btc">BTC (Bitcoin)</SelectItem>
                  <SelectItem value="eth">ETH (Ethereum)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cryptoWallet">
                {language === 'uk' ? 'Адреса гаманця' : 'Wallet Address'} *
              </Label>
              <Input
                id="cryptoWallet"
                value={cryptoWallet}
                onChange={(e) => setCryptoWallet(e.target.value)}
                placeholder="0x..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {(paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') && (
        <Card>
          <CardHeader>
            <CardTitle>{paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Smartphone size={48} className="mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                {language === 'uk' 
                  ? 'Натисніть "Оплатити" щоб продовжити через ваш пристрій'
                  : 'Click "Pay Now" to continue through your device'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'uk' ? 'Підсумок оплати' : 'Payment Summary'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>{language === 'uk' ? 'Сума замовлення:' : 'Order amount:'}</span>
            <span>{totalAmount} UAH</span>
          </div>
          {feeAmount > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{language === 'uk' ? 'Комісія:' : 'Processing fee:'}</span>
              <span>+{feeAmount.toFixed(2)} UAH</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>{language === 'uk' ? 'До оплати:' : 'Total to pay:'}</span>
            <span className="text-primary">{finalAmount.toFixed(2)} UAH</span>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          id="terms"
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          className="mt-1"
        />
        <Label htmlFor="terms" className="text-sm cursor-pointer">
          {language === 'uk' 
            ? 'Я погоджуюся з умовами використання та політикою конфіденційності'
            : 'I agree to the terms of service and privacy policy'
          }
        </Label>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          {language === 'uk' ? 'Назад' : 'Back'}
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !agreeToTerms}
          className="relative"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
            />
          ) : (
            <Lock size={16} className="mr-2" />
          )}
          {isSubmitting 
            ? (language === 'uk' ? 'Обробка...' : 'Processing...')
            : (language === 'uk' ? 'Оплатити' : 'Pay Now')
          }
          {!isSubmitting && <ArrowRight size={16} className="ml-2" />}
        </Button>
      </div>
    </div>
  )
}