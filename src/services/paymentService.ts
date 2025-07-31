import { useKV } from '@github/spark/hooks'

export interface PaymentData {
  method: 'card' | 'apple_pay' | 'google_pay' | 'privat24' | 'monobank' | 'oschadbank' | 'ukrgasbank' | 'ibox' | 'paypal' | 'skrill' | 'webmoney' | 'qiwi' | 'crypto' | 'bank_transfer'
  cardData?: {
    number: string
    expiry: string
    cvv: string
    name: string
  }
  bankData?: {
    phone: string
    accountNumber?: string
  }
  walletData?: {
    email: string
    walletId?: string
    phone?: string
  }
  cryptoData?: {
    wallet: string
    currency: 'btc' | 'eth' | 'usdt'
  }
  bankTransferData?: {
    bankName: string
    accountNumber: string
    recipientName: string
    purpose: string
  }
}

export interface PaymentResult {
  success: boolean
  transactionId: string
  message: string
  redirectUrl?: string
  qrCode?: string
}

export interface PaymentTransaction {
  id: string
  orderId: string
  amount: number
  method: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  transactionId?: string
  createdAt: string
  completedAt?: string
  failureReason?: string
  customerData: {
    name: string
    email: string
    phone: string
  }
}

class PaymentService {
  private apiKey: string = ''
  private testMode: boolean = true

  constructor() {
    // In a real app, this would come from environment variables or admin settings
    this.loadSettings()
  }

  private async loadSettings() {
    try {
      // This could be loaded from admin panel settings
      const settings = await window.spark.kv.get<{ apiKey: string, testMode: boolean }>('payment-settings')
      if (settings) {
        this.apiKey = settings.apiKey
        this.testMode = settings.testMode
      }
    } catch (error) {
      console.warn('Could not load payment settings, using defaults')
    }
  }

  async processPayment(
    orderId: string, 
    amount: number, 
    paymentData: PaymentData,
    customerData: { name: string, email: string, phone: string }
  ): Promise<PaymentResult> {
    
    const transactionId = this.generateTransactionId()
    
    // Create payment transaction record
    const transaction: PaymentTransaction = {
      id: transactionId,
      orderId,
      amount,
      method: paymentData.method,
      status: 'pending',
      createdAt: new Date().toISOString(),
      customerData
    }

    try {
      // Save transaction to storage
      await this.saveTransaction(transaction)

      let result: PaymentResult

      switch (paymentData.method) {
        case 'card':
          result = await this.processCardPayment(transactionId, amount, paymentData.cardData!)
          break
        case 'apple_pay':
          result = await this.processApplePay(transactionId, amount)
          break
        case 'google_pay':
          result = await this.processGooglePay(transactionId, amount)
          break
        case 'privat24':
          result = await this.processPrivat24(transactionId, amount, paymentData.bankData!)
          break
        case 'monobank':
          result = await this.processMonobank(transactionId, amount, paymentData.bankData!)
          break
        case 'oschadbank':
          result = await this.processOschadbank(transactionId, amount, paymentData.bankData!)
          break
        case 'ukrgasbank':
          result = await this.processUkrGasBank(transactionId, amount, paymentData.bankData!)
          break
        case 'ibox':
          result = await this.processIboxBank(transactionId, amount, paymentData.bankData!)
          break
        case 'paypal':
          result = await this.processPayPal(transactionId, amount, paymentData.walletData!)
          break
        case 'skrill':
          result = await this.processSkrill(transactionId, amount, paymentData.walletData!)
          break
        case 'webmoney':
          result = await this.processWebMoney(transactionId, amount, paymentData.walletData!)
          break
        case 'qiwi':
          result = await this.processQiwi(transactionId, amount, paymentData.walletData!)
          break
        case 'bank_transfer':
          result = await this.processBankTransfer(transactionId, amount, paymentData.bankTransferData!)
          break
        case 'crypto':
          result = await this.processCrypto(transactionId, amount, paymentData.cryptoData!)
          break
        default:
          throw new Error(`Unsupported payment method: ${paymentData.method}`)
      }

      // Update transaction status
      transaction.status = result.success ? 'completed' : 'failed'
      transaction.transactionId = result.transactionId
      transaction.completedAt = new Date().toISOString()
      if (!result.success) {
        transaction.failureReason = result.message
      }
      
      await this.saveTransaction(transaction)

      return result

    } catch (error) {
      // Update transaction as failed
      transaction.status = 'failed'
      transaction.failureReason = error instanceof Error ? error.message : 'Unknown error'
      await this.saveTransaction(transaction)

      return {
        success: false,
        transactionId,
        message: error instanceof Error ? error.message : 'Payment processing failed'
      }
    }
  }

  private async processCardPayment(transactionId: string, amount: number, cardData: PaymentData['cardData']): Promise<PaymentResult> {
    // Simulate card payment processing
    await this.delay(2000)

    if (this.testMode) {
      // Test mode - simulate different outcomes based on card number
      const cardNumber = cardData!.number.replace(/\s/g, '')
      
      if (cardNumber.includes('4242')) {
        return {
          success: true,
          transactionId: `card_${transactionId}`,
          message: 'Payment successful'
        }
      } else if (cardNumber.includes('4000')) {
        return {
          success: false,
          transactionId: `card_${transactionId}`,
          message: 'Insufficient funds'
        }
      } else {
        return {
          success: true,
          transactionId: `card_${transactionId}`,
          message: 'Payment successful'
        }
      }
    }

    // In production, this would integrate with actual payment processors like:
    // - Stripe
    // - Square
    // - LiqPay (Ukraine)
    // - Fondy
    // etc.

    return {
      success: true,
      transactionId: `card_${transactionId}`,
      message: 'Payment successful'
    }
  }

  private async processApplePay(transactionId: string, amount: number): Promise<PaymentResult> {
    await this.delay(1500)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `apple_${transactionId}`,
        message: 'Apple Pay payment successful'
      }
    }

    // In production, integrate with Apple Pay API
    return {
      success: true,
      transactionId: `apple_${transactionId}`,
      message: 'Apple Pay payment successful'
    }
  }

  private async processGooglePay(transactionId: string, amount: number): Promise<PaymentResult> {
    await this.delay(1500)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `google_${transactionId}`,
        message: 'Google Pay payment successful'
      }
    }

    // In production, integrate with Google Pay API
    return {
      success: true,
      transactionId: `google_${transactionId}`,
      message: 'Google Pay payment successful'
    }
  }

  private async processPrivat24(transactionId: string, amount: number, bankData: PaymentData['bankData']): Promise<PaymentResult> {
    await this.delay(2500)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `privat_${transactionId}`,
        message: 'PrivatBank payment initiated',
        redirectUrl: `https://privat24.ua/payments?amount=${amount}&phone=${bankData!.phone}`
      }
    }

    // In production, integrate with PrivatBank API
    return {
      success: true,
      transactionId: `privat_${transactionId}`,
      message: 'PrivatBank payment initiated'
    }
  }

  private async processMonobank(transactionId: string, amount: number, bankData: PaymentData['bankData']): Promise<PaymentResult> {
    await this.delay(2000)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `mono_${transactionId}`,
        message: 'Monobank payment initiated',
        redirectUrl: `https://send.monobank.ua/?amount=${amount}&phone=${bankData!.phone}`
      }
    }

    // In production, integrate with Monobank API
    return {
      success: true,
      transactionId: `mono_${transactionId}`,
      message: 'Monobank payment initiated'
    }
  }

  private async processOschadbank(transactionId: string, amount: number, bankData: PaymentData['bankData']): Promise<PaymentResult> {
    await this.delay(2200)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `oschadbank_${transactionId}`,
        message: 'Oschadbank 24/7 payment initiated',
        redirectUrl: `https://online.oschadbank.ua/payment?amount=${amount}&phone=${bankData!.phone}`
      }
    }

    return {
      success: true,
      transactionId: `oschadbank_${transactionId}`,
      message: 'Oschadbank payment initiated'
    }
  }

  private async processUkrGasBank(transactionId: string, amount: number, bankData: PaymentData['bankData']): Promise<PaymentResult> {
    await this.delay(2100)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `ukrgasbank_${transactionId}`,
        message: 'UkrGasBank mobile payment initiated',
        redirectUrl: `https://my.ukrgasbank.com/payment?amount=${amount}&phone=${bankData!.phone}`
      }
    }

    return {
      success: true,
      transactionId: `ukrgasbank_${transactionId}`,
      message: 'UkrGasBank payment initiated'
    }
  }

  private async processIboxBank(transactionId: string, amount: number, bankData: PaymentData['bankData']): Promise<PaymentResult> {
    await this.delay(1800)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `ibox_${transactionId}`,
        message: 'iBox Bank mobile payment initiated',
        redirectUrl: `https://ibox.ua/payment?amount=${amount}&phone=${bankData!.phone}`
      }
    }

    return {
      success: true,
      transactionId: `ibox_${transactionId}`,
      message: 'iBox Bank payment initiated'
    }
  }

  private async processPayPal(transactionId: string, amount: number, walletData: PaymentData['walletData']): Promise<PaymentResult> {
    await this.delay(3000)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `paypal_${transactionId}`,
        message: 'PayPal payment initiated',
        redirectUrl: `https://www.paypal.com/checkoutnow?amount=${amount}`
      }
    }

    // In production, integrate with PayPal API
    return {
      success: true,
      transactionId: `paypal_${transactionId}`,
      message: 'PayPal payment initiated'
    }
  }

  private async processSkrill(transactionId: string, amount: number, walletData: PaymentData['walletData']): Promise<PaymentResult> {
    await this.delay(2800)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `skrill_${transactionId}`,
        message: 'Skrill payment initiated',
        redirectUrl: `https://www.skrill.com/pay?amount=${amount}&email=${walletData!.email}`
      }
    }

    return {
      success: true,
      transactionId: `skrill_${transactionId}`,
      message: 'Skrill payment initiated'
    }
  }

  private async processWebMoney(transactionId: string, amount: number, walletData: PaymentData['walletData']): Promise<PaymentResult> {
    await this.delay(2200)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `webmoney_${transactionId}`,
        message: 'WebMoney payment initiated',
        redirectUrl: `https://merchant.webmoney.ru/conf/purse?amount=${amount}&wmid=${walletData!.walletId}`
      }
    }

    return {
      success: true,
      transactionId: `webmoney_${transactionId}`,
      message: 'WebMoney payment initiated'
    }
  }

  private async processQiwi(transactionId: string, amount: number, walletData: PaymentData['walletData']): Promise<PaymentResult> {
    await this.delay(2500)
    
    if (this.testMode) {
      return {
        success: true,
        transactionId: `qiwi_${transactionId}`,
        message: 'QIWI payment initiated',
        redirectUrl: `https://qiwi.com/payment/form/99?amount=${amount}&account=${walletData!.phone}`
      }
    }

    return {
      success: true,
      transactionId: `qiwi_${transactionId}`,
      message: 'QIWI payment initiated'
    }
  }

  private async processBankTransfer(transactionId: string, amount: number, bankTransferData: PaymentData['bankTransferData']): Promise<PaymentResult> {
    await this.delay(1000)
    
    // Generate bank transfer instructions
    const instructions = {
      recipientBank: bankTransferData!.bankName,
      recipientAccount: 'UA213223130000026007233566001',
      recipientName: 'ТОВ "АкваФарм"',
      recipientCode: '12345678',
      amount: amount,
      purpose: bankTransferData!.purpose,
      payerAccount: bankTransferData!.accountNumber,
      payerName: bankTransferData!.recipientName
    }

    return {
      success: true,
      transactionId: `bank_transfer_${transactionId}`,
      message: 'Bank transfer instructions generated. Please complete the transfer through your bank.',
      redirectUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(instructions, null, 2))}`
    }
  }

  private async processCrypto(transactionId: string, amount: number, cryptoData: PaymentData['cryptoData']): Promise<PaymentResult> {
    await this.delay(1000)
    
    // Generate a crypto payment address (in production, this would be from a crypto payment processor)
    const paymentAddresses = {
      btc: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      eth: '0x742ED0b1C72e0F4Da9f732e5DEA8F1C3b3a6E6E2',
      usdt: '0x742ED0b1C72e0F4Da9f732e5DEA8F1C3b3a6E6E2'
    }

    const paymentAddress = paymentAddresses[cryptoData!.currency]
    
    // Calculate crypto amount (simplified conversion)
    const cryptoRates = { btc: 43000, eth: 2300, usdt: 1 } // USD rates
    const usdAmount = amount / 40 // Simplified UAH to USD conversion
    const cryptoAmount = usdAmount / cryptoRates[cryptoData!.currency]

    if (this.testMode) {
      return {
        success: true,
        transactionId: `crypto_${transactionId}`,
        message: `Send ${cryptoAmount.toFixed(6)} ${cryptoData!.currency.toUpperCase()} to the address below`,
        qrCode: `data:image/svg+xml;base64,${btoa(this.generateQRCode(paymentAddress))}`
      }
    }

    return {
      success: true,
      transactionId: `crypto_${transactionId}`,
      message: `Send ${cryptoAmount.toFixed(6)} ${cryptoData!.currency.toUpperCase()} to payment address`
    }
  }

  private generateQRCode(data: string): string {
    // Simple QR code SVG generation (in production, use a proper QR library)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8">${data}</text>
    </svg>`
  }

  private async saveTransaction(transaction: PaymentTransaction): Promise<void> {
    const transactions = await window.spark.kv.get<PaymentTransaction[]>('payment-transactions') || []
    const existingIndex = transactions.findIndex(t => t.id === transaction.id)
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction
    } else {
      transactions.push(transaction)
    }
    
    await window.spark.kv.set('payment-transactions', transactions)
  }

  async getTransaction(transactionId: string): Promise<PaymentTransaction | undefined> {
    const transactions = await window.spark.kv.get<PaymentTransaction[]>('payment-transactions') || []
    return transactions.find(t => t.id === transactionId)
  }

  async getTransactionsByOrder(orderId: string): Promise<PaymentTransaction[]> {
    const transactions = await window.spark.kv.get<PaymentTransaction[]>('payment-transactions') || []
    return transactions.filter(t => t.orderId === orderId)
  }

  async getAllTransactions(): Promise<PaymentTransaction[]> {
    return await window.spark.kv.get<PaymentTransaction[]>('payment-transactions') || []
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Admin methods for payment settings
  async updateSettings(apiKey: string, testMode: boolean): Promise<void> {
    await window.spark.kv.set('payment-settings', { apiKey, testMode })
    this.apiKey = apiKey
    this.testMode = testMode
  }

  async getSettings(): Promise<{ apiKey: string, testMode: boolean }> {
    return await window.spark.kv.get('payment-settings') || { apiKey: '', testMode: true }
  }
}

// Export singleton instance
export const paymentService = new PaymentService()

// React hook for using payment service
export function usePaymentService() {
  return {
    processPayment: paymentService.processPayment.bind(paymentService),
    getTransaction: paymentService.getTransaction.bind(paymentService),
    getTransactionsByOrder: paymentService.getTransactionsByOrder.bind(paymentService),
    getAllTransactions: paymentService.getAllTransactions.bind(paymentService),
    updateSettings: paymentService.updateSettings.bind(paymentService),
    getSettings: paymentService.getSettings.bind(paymentService)
  }
}