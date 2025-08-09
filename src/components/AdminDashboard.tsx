import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useKV } from '@/hooks/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Plus,
  PencilSimple,
  Trash,
  Package,
  ShoppingCart,
  Users,
  TrendUp,
  CurrencyDollar,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// Types for data structures
interface Product {
  id: string
  name: { uk: string; en: string }
  description: { uk: string; en: string }
  price: number
  category: string
  stock: number
  imageUrl: string
  active: boolean
  createdAt: string
}

interface Order {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  products: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
  }>
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: string
  createdAt: string
  updatedAt: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  totalOrders: number
  totalSpent: number
  loyaltyPoints: number
  registeredAt: string
  lastOrderAt?: string
}

interface AdminDashboardProps {
  onNavigate?: (section: string) => void
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps = {}) {
  const { t } = useLanguage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adminPassword, setAdminPassword] = useState('')

  // Data storage - move all hooks to the top
  const [products, setProducts] = useKV<Product[]>('admin-products', [])
  const [orders, setOrders] = useKV<Order[]>('admin-orders', [])
  const [customers, setCustomers] = useKV<Customer[]>('admin-customers', [])

  // UI State
  const [activeTab, setActiveTab] = useState('overview')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [productFilter, setProductFilter] = useState<string>('all')

  // New product form
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'createdAt'>>({
    name: { uk: '', en: '' },
    description: { uk: '', en: '' },
    price: 0,
    category: 'prawns',
    image: '',
    stock: 0,
    weight: '',
    origin: { uk: '', en: '' },
    isActive: true,
  })

  // Check authentication on mount
  useEffect(() => {
    // For now, skip the owner check and go straight to loading state
    setIsLoading(false)
  }, [])

  const handlePasswordLogin = () => {
    // Simple password protection (in real app, use proper authentication)
    if (adminPassword === 'aquafarm2024') {
      setIsAuthenticated(true)
      toast.success('Доступ надано!')
    } else {
      toast.error('Неправильний пароль!')
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Перевірка доступу...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl heading-font">Адміністраторський вхід</CardTitle>
            <CardDescription>Увійдіть для доступу до панелі адміністратора</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Пароль</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handlePasswordLogin()}
                placeholder="Введіть пароль адміністратора"
              />
            </div>
            <Button onClick={handlePasswordLogin} className="w-full" disabled={!adminPassword}>
              Увійти
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Тільки для власника господарства
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Initialize sample data if empty
  useEffect(() => {
    if (products.length === 0) {
      initializeSampleData()
    }
  }, [])

  const initializeSampleData = () => {
    const sampleProducts: Product[] = [
      {
        id: 'prod-1',
        name: {
          uk: 'Креветки Macrobrachium Преміум',
          en: 'Premium Macrobrachium Prawns',
        },
        description: {
          uk: 'Свіжі великі креветки найвищої якості',
          en: 'Fresh large prawns of highest quality',
        },
        price: 450,
        category: 'fresh',
        stock: 25,
        imageUrl: '/api/placeholder/300/200',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-2',
        name: {
          uk: 'Креветки Заморожені',
          en: 'Frozen Prawns',
        },
        description: {
          uk: 'Швидко заморожені креветки для довготривалого зберігання',
          en: 'Quick-frozen prawns for long-term storage',
        },
        price: 320,
        category: 'frozen',
        stock: 50,
        imageUrl: '/api/placeholder/300/200',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ]

    const sampleCustomers: Customer[] = [
      {
        id: 'cust-1',
        name: 'Олексій Петренко',
        email: 'o.petrenko@example.com',
        phone: '+380501234567',
        address: 'вул. Хрещатик 1, Київ',
        totalOrders: 5,
        totalSpent: 2250,
        loyaltyPoints: 225,
        registeredAt: new Date('2024-01-15').toISOString(),
        lastOrderAt: new Date('2024-12-01').toISOString(),
      },
      {
        id: 'cust-2',
        name: 'Марія Іваненко',
        email: 'm.ivanenko@example.com',
        phone: '+380679876543',
        address: 'пр. Миру 45, Львів',
        totalOrders: 3,
        totalSpent: 1350,
        loyaltyPoints: 135,
        registeredAt: new Date('2024-02-20').toISOString(),
        lastOrderAt: new Date('2024-11-28').toISOString(),
      },
    ]

    const sampleOrders: Order[] = [
      {
        id: 'order-1',
        customerId: 'cust-1',
        customerName: 'Олексій Петренко',
        customerEmail: 'o.petrenko@example.com',
        products: [
          {
            productId: 'prod-1',
            productName: 'Креветки Macrobrachium Преміум',
            quantity: 2,
            price: 450,
          },
        ],
        total: 900,
        status: 'delivered',
        shippingAddress: 'вул. Хрещатик 1, Київ',
        createdAt: new Date('2024-12-01').toISOString(),
        updatedAt: new Date('2024-12-03').toISOString(),
      },
      {
        id: 'order-2',
        customerId: 'cust-2',
        customerName: 'Марія Іваненко',
        customerEmail: 'm.ivanenko@example.com',
        products: [
          {
            productId: 'prod-2',
            productName: 'Креветки Заморожені',
            quantity: 3,
            price: 320,
          },
        ],
        total: 960,
        status: 'processing',
        shippingAddress: 'пр. Миру 45, Львів',
        createdAt: new Date('2024-12-15').toISOString(),
        updatedAt: new Date('2024-12-15').toISOString(),
      },
    ]

    setProducts(sampleProducts)
    setCustomers(sampleCustomers)
    setOrders(sampleOrders)
  }

  // Product management functions
  const handleSaveProduct = () => {
    if (!newProduct.name.uk || !newProduct.name.en || newProduct.price <= 0) {
      toast.error("Будь ласка, заповніть всі обов'язкові поля")
      return
    }

    if (editingProduct) {
      // Update existing product
      setProducts(currentProducts =>
        currentProducts.map(p =>
          p.id === editingProduct.id
            ? { ...newProduct, id: editingProduct.id, createdAt: editingProduct.createdAt }
            : p
        )
      )
      toast.success('Продукт оновлено!')
    } else {
      // Create new product
      const product: Product = {
        ...newProduct,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      setProducts(currentProducts => [...currentProducts, product])
      toast.success('Продукт створено!')
    }

    // Reset form
    setNewProduct({
      name: { uk: '', en: '' },
      description: { uk: '', en: '' },
      price: 0,
      category: '',
      stock: 0,
      imageUrl: '',
      active: true,
    })
    setEditingProduct(null)
    setShowProductDialog(false)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct(product)
    setShowProductDialog(true)
  }

  const handleDeleteProduct = (productId: string) => {
    setProducts(currentProducts => currentProducts.filter(p => p.id !== productId))
    toast.success('Продукт видалено!')
  }

  // Order management functions
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(currentOrders =>
      currentOrders.map(order =>
        order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
      )
    )
    toast.success('Статус замовлення оновлено!')
  }

  const handleBulkOrderUpdate = (status: Order['status']) => {
    if (selectedOrders.length === 0) {
      toast.error('Оберіть замовлення для оновлення')
      return
    }

    setOrders(currentOrders =>
      currentOrders.map(order =>
        selectedOrders.includes(order.id)
          ? { ...order, status, updatedAt: new Date().toISOString() }
          : order
      )
    )
    setSelectedOrders([])
    toast.success(`Оновлено ${selectedOrders.length} замовлень`)
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    )
  }

  const toggleAllOrders = () => {
    setSelectedOrders(prev => (prev.length === orders.length ? [] : orders.map(o => o.id)))
  }

  // Export functions
  const exportOrdersToCSV = () => {
    const csvContent = [
      ['ID', 'Клієнт', 'Email', 'Продукти', 'Сума', 'Статус', 'Дата'].join(','),
      ...orders.map(order =>
        [
          order.id,
          order.customerName,
          order.customerEmail,
          order.products.map(p => `${p.productName} (${p.quantity})`).join(';'),
          order.total,
          order.status,
          new Date(order.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Замовлення експортовано!')
  }

  const exportCustomersToCSV = () => {
    const csvContent = [
      [
        "Ім'я",
        'Email',
        'Телефон',
        'Замовлень',
        'Витрачено',
        'Бали лояльності',
        'Дата реєстрації',
      ].join(','),
      ...customers.map(customer =>
        [
          customer.name,
          customer.email,
          customer.phone,
          customer.totalOrders,
          customer.totalSpent,
          customer.loyaltyPoints,
          new Date(customer.registeredAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Клієнтів експортовано!')
  }

  // Statistics calculations
  const totalRevenue = orders.reduce(
    (sum, order) => (order.status !== 'cancelled' ? sum + order.total : sum),
    0
  )

  const totalProducts = products.length
  const totalCustomers = customers.length
  const pendingOrders = orders.filter(order => order.status === 'pending').length

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Очікує' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Package, label: 'Обробляється' },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: TrendUp, label: 'Відправлено' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Доставлено' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Скасовано' },
    }

    const config = statusConfig[status]
    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent size={12} />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground heading-font mb-2">
            Панель Адміністратора AquaFarm
          </h1>
          <p className="text-muted-foreground">Управління продуктами, замовленнями та клієнтами</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Огляд</TabsTrigger>
            <TabsTrigger value="products">Продукти</TabsTrigger>
            <TabsTrigger value="orders">Замовлення</TabsTrigger>
            <TabsTrigger value="customers">Клієнти</TabsTrigger>
            <TabsTrigger value="payments">Платежі</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Загальний дохід</CardTitle>
                  <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₴{totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">За всі замовлення</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Продукти</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Активних продуктів</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Замовлення</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingOrders}</div>
                  <p className="text-xs text-muted-foreground">Очікують обробки</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Клієнти</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">Зареєстровані клієнти</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Останні замовлення</CardTitle>
                  <CardDescription>Нещодавні замовлення клієнтів</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map(order => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{order.customerName}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {order.products.map(p => `${p.productName} (${p.quantity})`).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">₴{order.total}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Швидкі дії</CardTitle>
                  <CardDescription>Часто використовувані функції</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab('products')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Додати новий продукт
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab('orders')}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Переглянути всі замовлення
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => {
                      const lowStockProducts = products.filter(p => p.stock < 10)
                      if (lowStockProducts.length > 0) {
                        toast.warning(`${lowStockProducts.length} продуктів з низьким запасом!`)
                      } else {
                        toast.success('Усі продукти в наявності!')
                      }
                    }}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Перевірити запаси
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => {
                      const todayOrders = orders.filter(order => {
                        const today = new Date().toDateString()
                        return new Date(order.createdAt).toDateString() === today
                      })
                      toast.info(
                        `Сьогодні: ${todayOrders.length} замовлень на ₴${todayOrders.reduce((sum, o) => sum + o.total, 0)}`
                      )
                    }}
                  >
                    <TrendUp className="mr-2 h-4 w-4" />
                    Статистика дня
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Управління продуктами</h2>
              <div className="flex gap-3">
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Фільтр за категорією" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі категорії</SelectItem>
                    <SelectItem value="fresh">Свіжі</SelectItem>
                    <SelectItem value="frozen">Заморожені</SelectItem>
                    <SelectItem value="processed">Оброблені</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Додати продукт
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? 'Редагувати продукт' : 'Новий продукт'}
                      </DialogTitle>
                      <DialogDescription>Заповніть інформацію про продукт</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name-uk">Назва (УК)</Label>
                          <Input
                            id="name-uk"
                            value={newProduct.name.uk}
                            onChange={e =>
                              setNewProduct(prev => ({
                                ...prev,
                                name: { ...prev.name, uk: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name-en">Name (EN)</Label>
                          <Input
                            id="name-en"
                            value={newProduct.name.en}
                            onChange={e =>
                              setNewProduct(prev => ({
                                ...prev,
                                name: { ...prev.name, en: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Ціна (₴)</Label>
                          <Input
                            id="price"
                            type="number"
                            value={newProduct.price}
                            onChange={e =>
                              setNewProduct(prev => ({
                                ...prev,
                                price: parseInt(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stock">Залишок</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={newProduct.stock}
                            onChange={e =>
                              setNewProduct(prev => ({
                                ...prev,
                                stock: parseInt(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Категорія</Label>
                        <Select
                          value={newProduct.category}
                          onValueChange={value =>
                            setNewProduct(prev => ({
                              ...prev,
                              category: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть категорію" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fresh">Свіжі</SelectItem>
                            <SelectItem value="frozen">Заморожені</SelectItem>
                            <SelectItem value="processed">Оброблені</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description-uk">Опис (УК)</Label>
                        <Textarea
                          id="description-uk"
                          value={newProduct.description.uk}
                          onChange={e =>
                            setNewProduct(prev => ({
                              ...prev,
                              description: { ...prev.description, uk: e.target.value },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description-en">Description (EN)</Label>
                        <Textarea
                          id="description-en"
                          value={newProduct.description.en}
                          onChange={e =>
                            setNewProduct(prev => ({
                              ...prev,
                              description: { ...prev.description, en: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowProductDialog(false)}>
                        Скасувати
                      </Button>
                      <Button onClick={handleSaveProduct}>
                        {editingProduct ? 'Оновити' : 'Створити'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Назва</TableHead>
                      <TableHead>Ціна</TableHead>
                      <TableHead>Залишок</TableHead>
                      <TableHead>Категорія</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products
                      .filter(
                        product => productFilter === 'all' || product.category === productFilter
                      )
                      .map(product => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name.uk}</div>
                              <div className="text-sm text-muted-foreground">{product.name.en}</div>
                            </div>
                          </TableCell>
                          <TableCell>₴{product.price}</TableCell>
                          <TableCell>
                            <Badge variant={product.stock > 10 ? 'default' : 'destructive'}>
                              {product.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{product.category}</TableCell>
                          <TableCell>
                            <Badge variant={product.active ? 'default' : 'secondary'}>
                              {product.active ? 'Активний' : 'Неактивний'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <PencilSimple className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Управління замовленнями</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportOrdersToCSV}>
                  Експорт CSV
                </Button>
                {selectedOrders.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkOrderUpdate('processing')}
                    >
                      Обробити ({selectedOrders.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkOrderUpdate('shipped')}
                    >
                      Відправити ({selectedOrders.length})
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrders([])}>
                      Скасувати вибір
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.length === orders.length && orders.length > 0}
                          onCheckedChange={toggleAllOrders}
                        />
                      </TableHead>
                      <TableHead>ID замовлення</TableHead>
                      <TableHead>Клієнт</TableHead>
                      <TableHead>Продукти</TableHead>
                      <TableHead>Сума</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.customerEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.products.map((product, idx) => (
                              <div key={idx} className="text-sm">
                                {product.productName} × {product.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>₴{order.total}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(status: Order['status']) =>
                              handleUpdateOrderStatus(order.id, status)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Очікує</SelectItem>
                              <SelectItem value="processing">Обробляється</SelectItem>
                              <SelectItem value="shipped">Відправлено</SelectItem>
                              <SelectItem value="delivered">Доставлено</SelectItem>
                              <SelectItem value="cancelled">Скасовано</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Управління клієнтами</h2>
              <Button variant="outline" onClick={exportCustomersToCSV}>
                Експорт CSV
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ім'я</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Замовлень</TableHead>
                      <TableHead>Витрачено</TableHead>
                      <TableHead>Бали лояльності</TableHead>
                      <TableHead>Дата реєстрації</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.totalOrders}</TableCell>
                        <TableCell>₴{customer.totalSpent.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.loyaltyPoints} балів</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(customer.registeredAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Налаштування платежів</h2>
              <Button variant="outline" onClick={() => onNavigate?.('payment-admin')}>
                <CreditCard className="w-4 h-4 mr-2" />
                Детальні налаштування
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Payment Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Успішні платежі</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'delivered').length}
                  </div>
                  <p className="text-xs text-muted-foreground">За поточний місяць</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">В очікуванні</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {orders.filter(o => o.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Потребують обробки</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Невдалі</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {orders.filter(o => o.status === 'cancelled').length}
                  </div>
                  <p className="text-xs text-muted-foreground">За поточний місяць</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods Status */}
            <Card>
              <CardHeader>
                <CardTitle>Стан платіжних систем</CardTitle>
                <CardDescription>Поточний статус інтеграції з платіжними системами</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Банківські картки', status: 'active', icon: '💳' },
                    { name: 'Apple Pay', status: 'active', icon: '🍎' },
                    { name: 'Google Pay', status: 'active', icon: '🟢' },
                    { name: 'Приват24', status: 'active', icon: '🏦' },
                    { name: 'Monobank', status: 'active', icon: '⚫' },
                    { name: 'Ощадбанк', status: 'active', icon: '🏛️' },
                    { name: 'УкрГазБанк', status: 'active', icon: '⛽' },
                    { name: 'iBox Bank', status: 'active', icon: '📱' },
                    { name: 'PayPal', status: 'active', icon: '💙' },
                    { name: 'Skrill', status: 'active', icon: '🔷' },
                    { name: 'WebMoney', status: 'active', icon: '💰' },
                    { name: 'QIWI', status: 'active', icon: '🥝' },
                    { name: 'Банківський переказ', status: 'active', icon: '🏪' },
                    { name: 'Bitcoin', status: 'active', icon: '₿' },
                    { name: 'Ethereum', status: 'active', icon: '⟠' },
                    { name: 'USDT', status: 'active', icon: '💚' },
                  ].map(method => (
                    <div
                      key={method.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{method.icon}</span>
                        <span className="text-sm font-medium">{method.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Активний
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Швидкі дії</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => onNavigate?.('payment-admin')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Налаштування платежів
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      toast.info('Функція буде доступна незабаром')
                    }}
                  >
                    <TrendUp className="w-4 h-4 mr-2" />
                    Звіти по платежах
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      toast.info('Функція буде доступна незабаром')
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Аналітика платежів
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      toast.info('Функція буде доступна незабаром')
                    }}
                  >
                    <CurrencyDollar className="w-4 h-4 mr-2" />
                    Налаштування комісій
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
