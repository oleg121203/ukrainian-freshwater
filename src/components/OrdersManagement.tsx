import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  Envelope,
  Eye,
  ArrowLeft,
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { uk, enUS } from 'date-fns/locale'
import { useShoppingCart, Order } from '@/hooks/useShoppingCart'

interface OrdersManagementProps {
  onNavigate?: (section: string) => void
}

export function OrdersManagement({ onNavigate }: OrdersManagementProps) {
  const { language } = useLanguage()
  const { orders } = useShoppingCart()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500'
      case 'confirmed':
        return 'bg-blue-500'
      case 'preparing':
        return 'bg-purple-500'
      case 'shipped':
        return 'bg-orange-500'
      case 'delivered':
        return 'bg-green-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    if (language === 'uk') {
      switch (status) {
        case 'pending':
          return 'Очікує підтвердження'
        case 'confirmed':
          return 'Підтверджено'
        case 'preparing':
          return 'Готується'
        case 'shipped':
          return 'Відправлено'
        case 'delivered':
          return 'Доставлено'
        case 'cancelled':
          return 'Скасовано'
        default:
          return 'Невідомо'
      }
    } else {
      switch (status) {
        case 'pending':
          return 'Pending Confirmation'
        case 'confirmed':
          return 'Confirmed'
        case 'preparing':
          return 'Preparing'
        case 'shipped':
          return 'Shipped'
        case 'delivered':
          return 'Delivered'
        case 'cancelled':
          return 'Cancelled'
        default:
          return 'Unknown'
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />
      case 'confirmed':
        return <CheckCircle size={16} />
      case 'preparing':
        return <Package size={16} />
      case 'shipped':
        return <Truck size={16} />
      case 'delivered':
        return <CheckCircle size={16} />
      case 'cancelled':
        return <ArrowLeft size={16} />
      default:
        return <Package size={16} />
    }
  }

  const getDeliveryTimeText = (time: string) => {
    if (language === 'uk') {
      switch (time) {
        case 'morning':
          return 'Ранок (9:00 - 12:00)'
        case 'afternoon':
          return 'День (12:00 - 17:00)'
        case 'evening':
          return 'Вечір (17:00 - 20:00)'
        default:
          return time
      }
    } else {
      switch (time) {
        case 'morning':
          return 'Morning (9:00 - 12:00)'
        case 'afternoon':
          return 'Afternoon (12:00 - 17:00)'
        case 'evening':
          return 'Evening (17:00 - 20:00)'
        default:
          return time
      }
    }
  }

  const getPaymentMethodText = (method: string) => {
    if (language === 'uk') {
      switch (method) {
        case 'cash':
          return 'Готівка при отриманні'
        case 'card':
          return 'Картою при отриманні'
        case 'transfer':
          return 'Банківський переказ'
        default:
          return method
      }
    } else {
      switch (method) {
        case 'cash':
          return 'Cash on delivery'
        case 'card':
          return 'Card on delivery'
        case 'transfer':
          return 'Bank transfer'
        default:
          return method
      }
    }
  }

  if (selectedOrder) {
    return (
      <section className="py-20 px-6 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <Button variant="ghost" className="mb-4" onClick={() => setSelectedOrder(null)}>
                <ArrowLeft size={16} className="mr-2" />
                {language === 'uk' ? 'Повернутися до списку' : 'Back to orders'}
              </Button>

              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold heading-font">
                  {language === 'uk' ? 'Замовлення' : 'Order'} #{selectedOrder.id.split('-')[1]}
                </h1>
                <Badge className={`text-white ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1">{getStatusText(selectedOrder.status)}</span>
                </Badge>
              </div>

              <p className="text-muted-foreground">
                {language === 'uk' ? 'Створено:' : 'Created:'}{' '}
                {format(new Date(selectedOrder.createdAt), 'PPpp', {
                  locale: language === 'uk' ? uk : enUS,
                })}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Order Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package size={20} />
                      {language === 'uk' ? 'Товари' : 'Items'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="text-3xl">{item.image}</div>
                        <div className="flex-1">
                          <h3 className="font-medium">
                            {language === 'uk' ? item.name_uk : item.name_en}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.weight} • {language === 'uk' ? 'Кількість:' : 'Quantity:'}{' '}
                            {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {item.price * item.quantity} {item.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.price} {item.currency} {language === 'uk' ? 'за од.' : 'each'}
                          </p>
                        </div>
                      </div>
                    ))}

                    <Separator />

                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{language === 'uk' ? 'Всього:' : 'Total:'}</span>
                      <span className="text-primary">{selectedOrder.total} UAH</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Details */}
              <div className="space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Phone size={16} />
                      {language === 'uk' ? 'Покупець' : 'Customer'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">
                      {selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={14} />
                      {selectedOrder.customerInfo.phone}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Envelope size={14} />
                      {selectedOrder.customerInfo.email}
                    </p>
                  </CardContent>
                </Card>

                {/* Delivery Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin size={16} />
                      {language === 'uk' ? 'Доставка' : 'Delivery'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">{selectedOrder.deliveryInfo.city}</p>
                    <p className="text-muted-foreground">{selectedOrder.deliveryInfo.address}</p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">{language === 'uk' ? 'Час:' : 'Time:'} </span>
                      {getDeliveryTimeText(selectedOrder.deliveryInfo.deliveryTime)}
                    </p>
                    {selectedOrder.deliveryInfo.notes && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">
                          {language === 'uk' ? 'Примітки:' : 'Notes:'}{' '}
                        </span>
                        {selectedOrder.deliveryInfo.notes}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      <span className="font-medium">
                        {language === 'uk' ? 'Очікувана доставка:' : 'Expected delivery:'}{' '}
                      </span>
                      {format(new Date(selectedOrder.estimatedDelivery), 'PPP', {
                        locale: language === 'uk' ? uk : enUS,
                      })}
                    </p>
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package size={16} />
                      {language === 'uk' ? 'Оплата' : 'Payment'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="font-medium">
                      {getPaymentMethodText(selectedOrder.paymentMethod)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground heading-font mb-4">
            {language === 'uk' ? 'Мої замовлення' : 'My Orders'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'uk'
              ? 'Переглядайте статус та історію ваших замовлень'
              : 'View the status and history of your orders'}
          </p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Package size={80} className="text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-4">
              {language === 'uk' ? 'Поки що немає замовлень' : 'No orders yet'}
            </h3>
            <p className="text-muted-foreground mb-8">
              {language === 'uk'
                ? 'Зробіть ваше перше замовлення щоб побачити його тут'
                : 'Make your first order to see it here'}
            </p>
            <Button onClick={() => onNavigate?.('products')}>
              {language === 'uk' ? 'Переглянути продукцію' : 'View Products'}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Order Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-lg font-semibold">
                              {language === 'uk' ? 'Замовлення' : 'Order'} #{order.id.split('-')[1]}
                            </h3>
                            <Badge className={`text-white ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{getStatusText(order.status)}</span>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <p className="mb-1">
                                <span className="font-medium">
                                  {language === 'uk' ? 'Дата:' : 'Date:'}
                                </span>{' '}
                                {format(new Date(order.createdAt), 'PPP', {
                                  locale: language === 'uk' ? uk : enUS,
                                })}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {language === 'uk' ? 'Товарів:' : 'Items:'}
                                </span>{' '}
                                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1">
                                <span className="font-medium">
                                  {language === 'uk' ? 'Доставка:' : 'Delivery:'}
                                </span>{' '}
                                {order.deliveryInfo.city}
                              </p>
                              <p>
                                <span className="font-medium">
                                  {language === 'uk' ? 'Оплата:' : 'Payment:'}
                                </span>{' '}
                                {getPaymentMethodText(order.paymentMethod)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Order Total and Action */}
                        <div className="flex items-center justify-between lg:flex-col lg:items-end gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{order.total} UAH</p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'uk' ? 'Сума замовлення' : 'Order total'}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="group-hover:border-primary group-hover:text-primary"
                          >
                            <Eye size={16} className="mr-2" />
                            {language === 'uk' ? 'Переглянути' : 'View Details'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </section>
  )
}
