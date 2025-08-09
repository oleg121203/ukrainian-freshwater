import { motion } from 'framer-motion'
import {
  Truck,
  Clock,
  Package,
  MapPin,
  ArrowLeft,
  Lightning,
  Shield,
  ThermometerSimple,
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DeliverySectionProps {
  onNavigate?: (section: string) => void
}

export function DeliverySection({ onNavigate }: DeliverySectionProps) {
  const { language } = useLanguage()

  const deliverySteps = [
    {
      step: 1,
      icon: Package,
      title_uk: 'Збір та упакування',
      title_en: 'Harvest and Packaging',
      description_uk:
        'Креветки збираються вранці та одразу упаковуються в спеціальні контейнери з льодом',
      description_en:
        'Prawns are harvested in the morning and immediately packed in special containers with ice',
      time_uk: '6:00 - 8:00',
      time_en: '6:00 - 8:00 AM',
    },
    {
      step: 2,
      icon: ThermometerSimple,
      title_uk: 'Контроль температури',
      title_en: 'Temperature Control',
      description_uk:
        'Упакована продукція зберігається при температурі 0-2°C протягом всього шляху',
      description_en: 'Packaged products are stored at 0-2°C throughout the journey',
      time_uk: 'Постійно',
      time_en: 'Continuous',
    },
    {
      step: 3,
      icon: Truck,
      title_uk: 'Швидка доставка',
      title_en: 'Fast Delivery',
      description_uk:
        'Спеціалізований транспорт з холодильними камерами доставляє продукцію протягом дня',
      description_en:
        'Specialized transport with refrigeration chambers delivers products during the day',
      time_uk: '8:00 - 20:00',
      time_en: '8:00 AM - 8:00 PM',
    },
    {
      step: 4,
      icon: Clock,
      title_uk: 'Отримання',
      title_en: 'Delivery',
      description_uk: 'Клієнт отримує найсвіжішу продукцію максимум через 24 години після вилову',
      description_en: 'Customer receives the freshest products within 24 hours of harvest',
      time_uk: 'До 24 годин',
      time_en: 'Within 24 hours',
    },
  ]

  const deliveryZones = [
    {
      zone_uk: 'Київ та область',
      zone_en: 'Kyiv and Region',
      time_uk: '6-12 годин',
      time_en: '6-12 hours',
      price_uk: 'Безкоштовно від 500 грн',
      price_en: 'Free from 500 UAH',
      express: true,
    },
    {
      zone_uk: 'Великі міста України',
      zone_en: 'Major Ukrainian Cities',
      time_uk: '12-18 годин',
      time_en: '12-18 hours',
      price_uk: 'Від 80 грн',
      price_en: 'From 80 UAH',
      express: true,
    },
    {
      zone_uk: 'Інші регіони',
      zone_en: 'Other Regions',
      time_uk: '18-24 години',
      time_en: '18-24 hours',
      price_uk: 'Від 120 грн',
      price_en: 'From 120 UAH',
      express: false,
    },
    {
      zone_uk: 'Самовивіз з ферми',
      zone_en: 'Farm Pickup',
      time_uk: 'Одразу',
      time_en: 'Immediate',
      price_uk: 'Безкоштовно',
      price_en: 'Free',
      express: true,
    },
  ]

  const packagingTypes = [
    {
      type_uk: 'Стандартна упаковка',
      type_en: 'Standard Packaging',
      description_uk: 'Вакуумні пакети з льодом, зберігають свіжість до 48 годин',
      description_en: 'Vacuum bags with ice, keep fresh up to 48 hours',
      icon: Package,
      temperature: '0-2°C',
      shelf_life_uk: '48 годин',
      shelf_life_en: '48 hours',
    },
    {
      type_uk: 'Преміум упаковка',
      type_en: 'Premium Packaging',
      description_uk: 'Ізотермічні контейнери з гелевими акумуляторами холоду',
      description_en: 'Isothermal containers with gel cooling elements',
      icon: Shield,
      temperature: '0-1°C',
      shelf_life_uk: '72 години',
      shelf_life_en: '72 hours',
    },
    {
      type_uk: 'Експрес упаковка',
      type_en: 'Express Packaging',
      description_uk: 'Спеціальні контейнери для доставки протягом 6 годин',
      description_en: 'Special containers for 6-hour delivery',
      icon: Lightning,
      temperature: '1-3°C',
      shelf_life_uk: '24 години',
      shelf_life_en: '24 hours',
    },
  ]

  const qualityGuarantees = [
    {
      title_uk: 'Гарантія свіжості',
      title_en: 'Freshness Guarantee',
      description_uk: 'Повернемо гроші, якщо продукція не відповідає стандартам свіжості',
      description_en: "Money back guarantee if products don't meet freshness standards",
    },
    {
      title_uk: 'Контроль температури',
      title_en: 'Temperature Control',
      description_uk: 'Постійний моніторинг температури з звітами для кожного замовлення',
      description_en: 'Continuous temperature monitoring with reports for each order',
    },
    {
      title_uk: 'Страхування вантажу',
      title_en: 'Cargo Insurance',
      description_uk: 'Всі замовлення автоматично застраховані на повну вартість',
      description_en: 'All orders are automatically insured for full value',
    },
    {
      title_uk: 'Відстеження доставки',
      title_en: 'Delivery Tracking',
      description_uk: 'SMS та email оповіщення на кожному етапі доставки',
      description_en: 'SMS and email notifications at every delivery stage',
    },
  ]

  return (
    <section className="min-h-screen py-20 px-6 bg-gradient-to-b from-orange-50/50 to-red-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate?.('about')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            {language === 'uk' ? 'Назад' : 'Back'}
          </Button>
        </div>

        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Truck size={16} />
            {language === 'uk' ? 'Швидка доставка' : 'Fast Delivery'}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground heading-font mb-6">
            🚚 {language === 'uk' ? 'Швидка доставка' : 'Fast Delivery'}
          </h1>

          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-8">
            {language === 'uk'
              ? 'Ми доставляємо найсвіжіші креветки протягом 24 годин після вилову прямо до вашого порогу. Наша логістична система забезпечує збереження якості та свіжості продукції протягом всього шляху.'
              : 'We deliver the freshest prawns within 24 hours of harvest right to your doorstep. Our logistics system ensures product quality and freshness throughout the journey.'}
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">24</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Години максимум' : 'Hours Maximum'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">0-2°C</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Контроль температури' : 'Temperature Control'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">99.8%</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Вчасна доставка' : 'On-time Delivery'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">100%</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Гарантія якості' : 'Quality Guarantee'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Delivery Process */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Процес доставки' : 'Delivery Process'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {deliverySteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Connector Line */}
                {index < deliverySteps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-orange-300 to-transparent transform -translate-y-1/2 z-0" />
                )}

                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-500/50 relative z-10">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg relative">
                      {step.step}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <step.icon size={16} className="text-orange-600" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">
                      {language === 'uk' ? step.title_uk : step.title_en}
                    </CardTitle>
                    <Badge variant="outline" className="mx-auto">
                      {language === 'uk' ? step.time_uk : step.time_en}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center leading-relaxed">
                      {language === 'uk' ? step.description_uk : step.description_en}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Delivery Zones */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Зони доставки' : 'Delivery Zones'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliveryZones.map((zone, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">
                      {language === 'uk' ? zone.zone_uk : zone.zone_en}
                    </h3>
                    {zone.express && (
                      <Badge className="bg-orange-100 text-orange-800">
                        {language === 'uk' ? 'Експрес' : 'Express'}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <span className="text-sm">
                        {language === 'uk' ? zone.time_uk : zone.time_en}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="text-sm">
                        {language === 'uk' ? zone.price_uk : zone.price_en}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Packaging Types */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Типи упаковки' : 'Packaging Types'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packagingTypes.map((pkg, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-orange-500"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <pkg.icon size={32} className="text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">
                      {language === 'uk' ? pkg.type_uk : pkg.type_en}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {language === 'uk' ? pkg.description_uk : pkg.description_en}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === 'uk' ? 'Температура:' : 'Temperature:'}
                      </span>
                      <span className="text-sm font-medium">{pkg.temperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === 'uk' ? 'Зберігання:' : 'Storage:'}
                      </span>
                      <span className="text-sm font-medium">
                        {language === 'uk' ? pkg.shelf_life_uk : pkg.shelf_life_en}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Quality Guarantees */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Гарантії якості' : 'Quality Guarantees'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {qualityGuarantees.map((guarantee, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 bg-white rounded-lg border border-orange-200"
              >
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-bold text-sm">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {language === 'uk' ? guarantee.title_uk : guarantee.title_en}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'uk' ? guarantee.description_uk : guarantee.description_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Order CTA */}
        <motion.div
          className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-8 md:p-12 text-white text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Truck size={64} className="mx-auto mb-6 opacity-80" />
          <h3 className="text-3xl font-bold heading-font mb-6">
            {language === 'uk' ? 'Замовити зараз' : 'Order Now'}
          </h3>
          <p className="text-xl leading-relaxed mb-8 opacity-90 max-w-3xl mx-auto">
            {language === 'uk'
              ? 'Замовте свіжі креветки прямо зараз і отримайте їх завтра! Ми працюємо цілодобово, щоб забезпечити найкращий сервіс доставки в Україні.'
              : 'Order fresh prawns right now and get them tomorrow! We work around the clock to provide the best delivery service in Ukraine.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              onClick={() => onNavigate?.('products')}
            >
              {language === 'uk' ? 'Переглянути каталог' : 'Browse Catalog'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/50 text-white hover:bg-white/10"
              onClick={() => onNavigate?.('contact')}
            >
              {language === 'uk' ? "Зв'язатися з нами" : 'Contact Us'}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
