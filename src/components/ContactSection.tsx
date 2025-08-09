import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Phone,
  Envelope,
  MapPin,
  Clock,
  PaperPlaneTilt,
  ShoppingCart,
  Star,
  ArrowRight,
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface ContactSectionProps {
  onNavigate?: (section: string) => void
}

export function ContactSection({ onNavigate }: ContactSectionProps) {
  const { language, t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const contactInfo = [
    {
      icon: Phone,
      title_uk: 'Телефон',
      title_en: 'Phone',
      value: '+380 67 123 45 67',
      link: 'tel:+380671234567',
    },
    {
      icon: Envelope,
      title_uk: 'Електронна пошта',
      title_en: 'Email',
      value: 'info@aquafarm.ua',
      link: 'mailto:info@aquafarm.ua',
    },
    {
      icon: MapPin,
      title_uk: 'Адреса',
      title_en: 'Address',
      value: 'село Водяне, Київська область, Україна',
      link: '#',
    },
    {
      icon: Clock,
      title_uk: 'Години роботи',
      title_en: 'Working Hours',
      value: 'Пн-Пт: 8:00-18:00, Сб: 9:00-15:00',
      link: '#',
    },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.success(
      language === 'uk'
        ? "Повідомлення надіслано! Ми зв'яжемося з вами найближчим часом."
        : 'Message sent! We will contact you soon.'
    )

    setFormData({ name: '', email: '', phone: '', message: '' })
    setIsSubmitting(false)
  }

  const farmLocations = [
    {
      id: 1,
      name: 'Головна ферма',
      lat: 50.123,
      lng: 30.456,
      status: 'active',
    },
    {
      id: 2,
      name: 'Дослідний центр',
      lat: 50.234,
      lng: 30.567,
      status: 'active',
    },
    {
      id: 3,
      name: 'Центр обробки',
      lat: 50.345,
      lng: 30.678,
      status: 'active',
    },
  ]

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground heading-font mb-6">
            {t('nav.contact')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'uk'
              ? "Зв'яжіться з нами для замовлення або отримання додаткової інформації"
              : 'Contact us to place an order or get additional information'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div key={index} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <info.icon size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {language === 'uk' ? info.title_uk : info.title_en}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {info.value}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Interactive Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={24} className="text-primary" />
                  {language === 'uk' ? 'Наше розташування' : 'Our Location'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-80 bg-gradient-aqua rounded-lg overflow-hidden">
                  {/* Simplified map visualization */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <MapPin size={48} className="mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">AquaFarm</h3>
                      <p className="text-sm opacity-90">
                        {language === 'uk'
                          ? 'село Водяне, Київська область'
                          : 'Vodiane village, Kyiv region'}
                      </p>
                    </div>
                  </div>

                  {/* Farm location markers */}
                  {farmLocations.map((location, index) => (
                    <motion.div
                      key={location.id}
                      className="absolute w-4 h-4 bg-white rounded-full border-2 border-primary cursor-pointer"
                      style={{
                        left: `${20 + index * 25}%`,
                        top: `${30 + index * 15}%`,
                      }}
                      whileHover={{ scale: 1.5 }}
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.5,
                      }}
                      title={location.name}
                    />
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <Button variant="outline" className="w-full">
                    {language === 'uk' ? 'Відкрити в Google Maps' : 'Open in Google Maps'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'uk' ? 'Надішліть нам повідомлення' : 'Send us a message'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{language === 'uk' ? "Ім'я" : 'Name'} *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder={language === 'uk' ? "Ваше ім'я" : 'Your name'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{language === 'uk' ? 'Телефон' : 'Phone'}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+380 XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {language === 'uk' ? 'Електронна пошта' : 'Email'} *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder={language === 'uk' ? 'your@email.com' : 'your@email.com'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      {language === 'uk' ? 'Повідомлення' : 'Message'} *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      placeholder={
                        language === 'uk'
                          ? 'Розкажіть про ваші потреби або задайте питання...'
                          : 'Tell us about your needs or ask a question...'
                      }
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {language === 'uk' ? 'Відправляємо...' : 'Sending...'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <PaperPlaneTilt size={18} />
                        {language === 'uk' ? 'Надіслати повідомлення' : 'Send Message'}
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  {language === 'uk' ? 'Додаткова інформація' : 'Additional Information'}
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      {language === 'uk' ? 'Мінімальне замовлення: 1 кг' : 'Minimum order: 1 kg'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      {language === 'uk'
                        ? 'Безкоштовна доставка від 500 грн'
                        : 'Free delivery from 500 UAH'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      {language === 'uk'
                        ? 'Відповідаємо протягом 2 годин'
                        : 'We respond within 2 hours'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      {language === 'uk' ? 'Можливість екскурсії по фермі' : 'Farm tour available'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
            onClick={() => onNavigate?.('products')}
          >
            <CardContent className="p-8 text-center">
              <ShoppingCart
                size={48}
                className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-xl font-semibold mb-3">
                {language === 'uk' ? 'Зробити замовлення' : 'Place an Order'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk'
                  ? 'Перегляньте наш каталог та оберіть свіжі креветки'
                  : 'Browse our catalog and choose fresh prawns'}
              </p>
              <Button
                variant="ghost"
                className="group-hover:bg-primary group-hover:text-primary-foreground"
              >
                {language === 'uk' ? 'До каталогу' : 'To Catalog'}{' '}
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
            onClick={() => onNavigate?.('reviews')}
          >
            <CardContent className="p-8 text-center">
              <Star
                size={48}
                className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-xl font-semibold mb-3">
                {language === 'uk' ? 'Відгуки клієнтів' : 'Customer Reviews'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk'
                  ? 'Прочитайте що кажуть наші клієнти про якість продукції'
                  : 'Read what our customers say about product quality'}
              </p>
              <Button
                variant="ghost"
                className="group-hover:bg-primary group-hover:text-primary-foreground"
              >
                {language === 'uk' ? 'Читати відгуки' : 'Read Reviews'}{' '}
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
