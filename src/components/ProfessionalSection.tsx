import { motion } from 'framer-motion'
import {
  ChefHat,
  Users,
  Star,
  ArrowLeft,
  Handshake,
  Trophy,
  Certificate,
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ProfessionalSectionProps {
  onNavigate?: (section: string) => void
}

export function ProfessionalSection({ onNavigate }: ProfessionalSectionProps) {
  const { language } = useLanguage()

  const partnerships = [
    {
      type_uk: 'Ресторани',
      type_en: 'Restaurants',
      icon: ChefHat,
      count: '50+',
      description_uk: 'Співпрацюємо з провідними ресторанами України',
      description_en: 'Partnering with leading restaurants in Ukraine',
      benefits: [
        {
          benefit_uk: 'Щоденні поставки',
          benefit_en: 'Daily deliveries',
        },
        {
          benefit_uk: 'Спеціальні ціни',
          benefit_en: 'Special pricing',
        },
        {
          benefit_uk: 'Гарантія якості',
          benefit_en: 'Quality guarantee',
        },
      ],
    },
    {
      type_uk: 'Готелі',
      type_en: 'Hotels',
      icon: Users,
      count: '25+',
      description_uk: 'Постачаємо продукцію для готельних комплексів',
      description_en: 'Supplying products to hotel complexes',
      benefits: [
        {
          benefit_uk: 'Великі обсяги',
          benefit_en: 'Large volumes',
        },
        {
          benefit_uk: 'Гнучкий графік',
          benefit_en: 'Flexible schedule',
        },
        {
          benefit_uk: 'Консультації шефа',
          benefit_en: 'Chef consultations',
        },
      ],
    },
    {
      type_uk: 'Кейтеринг',
      type_en: 'Catering',
      icon: Star,
      count: '15+',
      description_uk: 'Обслуговуємо кейтерингові компанії та банкети',
      description_en: 'Serving catering companies and banquets',
      benefits: [
        {
          benefit_uk: 'Короткі терміни',
          benefit_en: 'Short deadlines',
        },
        {
          benefit_uk: 'Індивідуальний підхід',
          benefit_en: 'Individual approach',
        },
        {
          benefit_uk: 'Консультації кухаря',
          benefit_en: 'Chef advice',
        },
      ],
    },
  ]

  const professionalPrograms = [
    {
      program_uk: 'Професійна програма',
      program_en: 'Professional Program',
      icon: Trophy,
      features: [
        {
          feature_uk: 'Знижка до 25% на великі замовлення',
          feature_en: 'Up to 25% discount on large orders',
        },
        {
          feature_uk: 'Пріоритетна доставка',
          feature_en: 'Priority delivery',
        },
        {
          feature_uk: 'Персональний менеджер',
          feature_en: 'Personal manager',
        },
        {
          feature_uk: 'Індивідуальні умови співпраці',
          feature_en: 'Individual cooperation terms',
        },
      ],
    },
    {
      program_uk: 'VIP обслуговування',
      program_en: 'VIP Service',
      icon: Certificate,
      features: [
        {
          feature_uk: 'Ексклюзивні сорти креветок',
          feature_en: 'Exclusive prawn varieties',
        },
        {
          feature_uk: 'Консультації технолога',
          feature_en: 'Technologist consultations',
        },
        {
          feature_uk: 'Тренінги для персоналу',
          feature_en: 'Staff training',
        },
        {
          feature_uk: 'Маркетингова підтримка',
          feature_en: 'Marketing support',
        },
      ],
    },
  ]

  const clientTestimonials = [
    {
      name_uk: 'Андрій Коваленко',
      name_en: 'Andriy Kovalenko',
      position_uk: 'Шеф-кухар ресторану "Морський бриз"',
      position_en: 'Chef at "Sea Breeze" Restaurant',
      testimonial_uk:
        'AquaFarm стали нашим надійним партнером. Якість креветок завжди на найвищому рівні, а доставка - точна до хвилини.',
      testimonial_en:
        'AquaFarm has become our reliable partner. The quality of prawns is always at the highest level, and delivery is accurate to the minute.',
      rating: 5,
      restaurant_uk: 'Ресторан "Морський бриз"',
      restaurant_en: '"Sea Breeze" Restaurant',
    },
    {
      name_uk: 'Олена Петрова',
      name_en: 'Olena Petrova',
      position_uk: 'Менеджер з закупівель готелю "Премієр"',
      position_en: 'Procurement Manager at "Premier" Hotel',
      testimonial_uk:
        'Співпрацюємо вже 3 роки. Особливо цінуємо можливість замовляти великі партії зі стабільною якістю.',
      testimonial_en:
        'We have been cooperating for 3 years. We especially value the ability to order large batches with stable quality.',
      rating: 5,
      restaurant_uk: 'Готель "Премієр"',
      restaurant_en: '"Premier" Hotel',
    },
    {
      name_uk: 'Максим Іваненко',
      name_en: 'Maksym Ivanenko',
      position_uk: 'Власник кейтерингової компанії "Смак"',
      position_en: 'Owner of "Taste" Catering Company',
      testimonial_uk:
        'Найкращі креветки на ринку! Клієнти завжди в захваті від страв з продукції AquaFarm.',
      testimonial_en:
        'The best prawns on the market! Clients are always delighted with dishes made from AquaFarm products.',
      rating: 5,
      restaurant_uk: 'Кейтеринг "Смак"',
      restaurant_en: '"Taste" Catering',
    },
  ]

  const supportServices = [
    {
      service_uk: 'Консультації кухаря',
      service_en: 'Chef Consultations',
      description_uk: 'Наш шеф-кухар допоможе розробити меню та навчить готувати креветки',
      description_en: 'Our chef will help develop a menu and teach how to cook prawns',
    },
    {
      service_uk: 'Тренінги персоналу',
      service_en: 'Staff Training',
      description_uk: 'Проводимо навчання персоналу правильній обробці та подачі морепродуктів',
      description_en: 'We conduct staff training on proper seafood handling and presentation',
    },
    {
      service_uk: 'Маркетингові матеріали',
      service_en: 'Marketing Materials',
      description_uk: 'Надаємо рекламні матеріали та сертифікати для вашого закладу',
      description_en: 'We provide promotional materials and certificates for your establishment',
    },
    {
      service_uk: 'Технічна підтримка',
      service_en: 'Technical Support',
      description_uk: 'Цілодобова підтримка з питань зберігання та приготування',
      description_en: '24/7 support on storage and preparation issues',
    },
  ]

  return (
    <section className="min-h-screen py-20 px-6 bg-gradient-to-b from-purple-50/50 to-indigo-50/50">
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
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ChefHat size={16} />
            {language === 'uk' ? 'Для професіоналів' : 'For Professionals'}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground heading-font mb-6">
            👨‍🍳 {language === 'uk' ? 'Для професіоналів' : 'For Professionals'}
          </h1>

          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-8">
            {language === 'uk'
              ? 'Ми працюємо з провідними ресторанами, готелями та кейтеринговими компаніями України, забезпечуючи найвищі стандарти якості та сервісу. Наша професійна програма розроблена спеціально для потреб HoReCa сектору.'
              : 'We work with leading restaurants, hotels and catering companies in Ukraine, ensuring the highest standards of quality and service. Our professional program is designed specifically for the needs of the HoReCa sector.'}
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">90+</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Професійних клієнтів' : 'Professional Clients'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">25%</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Знижка для партнерів' : 'Partner Discount'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Підтримка клієнтів' : 'Customer Support'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-2">5★</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Середній рейтинг' : 'Average Rating'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Partnership Types */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Типи партнерства' : 'Partnership Types'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnerships.map((partnership, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <partnership.icon size={32} className="text-white" />
                    </div>
                    <CardTitle className="text-xl">
                      {language === 'uk' ? partnership.type_uk : partnership.type_en}
                    </CardTitle>
                    <Badge className="bg-purple-100 text-purple-800 mx-auto">
                      {partnership.count}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-center">
                      {language === 'uk' ? partnership.description_uk : partnership.description_en}
                    </p>

                    <div className="space-y-2">
                      {partnership.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm">
                            {language === 'uk' ? benefit.benefit_uk : benefit.benefit_en}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Professional Programs */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Професійні програми' : 'Professional Programs'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {professionalPrograms.map((program, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-purple-500"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <program.icon size={32} className="text-purple-600" />
                    </div>
                    <CardTitle className="text-xl">
                      {language === 'uk' ? program.program_uk : program.program_en}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {program.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-purple-600 text-xs">✓</span>
                        </div>
                        <span className="text-sm">
                          {language === 'uk' ? feature.feature_uk : feature.feature_en}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Client Testimonials */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Відгуки партнерів' : 'Partner Testimonials'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clientTestimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, starIndex) => (
                      <Star key={starIndex} size={16} className="text-yellow-500 fill-current" />
                    ))}
                  </div>

                  <p className="text-muted-foreground mb-6 italic">
                    "{language === 'uk' ? testimonial.testimonial_uk : testimonial.testimonial_en}"
                  </p>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold">
                      {language === 'uk' ? testimonial.name_uk : testimonial.name_en}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {language === 'uk' ? testimonial.position_uk : testimonial.position_en}
                    </p>
                    <p className="text-sm text-purple-600 font-medium">
                      {language === 'uk' ? testimonial.restaurant_uk : testimonial.restaurant_en}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Support Services */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Сервіси підтримки' : 'Support Services'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportServices.map((service, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 bg-white rounded-lg border border-purple-200"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Handshake size={16} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {language === 'uk' ? service.service_uk : service.service_en}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'uk' ? service.description_uk : service.description_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Partnership CTA */}
        <motion.div
          className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Handshake size={64} className="mx-auto mb-6 opacity-80" />
          <h3 className="text-3xl font-bold heading-font mb-6">
            {language === 'uk' ? 'Стати партнером' : 'Become a Partner'}
          </h3>
          <p className="text-xl leading-relaxed mb-8 opacity-90 max-w-3xl mx-auto">
            {language === 'uk'
              ? 'Приєднуйтесь до нашої мережі професійних партнерів і отримайте доступ до ексклюзивних умов співпраці, індивідуального підходу та найвищої якості продукції.'
              : 'Join our network of professional partners and get access to exclusive cooperation terms, individual approach and highest quality products.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              onClick={() => onNavigate?.('contact')}
            >
              {language === 'uk' ? 'Обговорити партнерство' : 'Discuss Partnership'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/50 text-white hover:bg-white/10"
              onClick={() => onNavigate?.('products')}
            >
              {language === 'uk' ? 'Переглянути каталог' : 'Browse Catalog'}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
