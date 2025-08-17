import { motion } from 'framer-motion'
import { Leaf, Drop, Recycle, Shield, ArrowLeft, CheckCircle, Globe } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface EcoFarmingSectionProps {
  onNavigate?: (section: string) => void
}

export function EcoFarmingSection({ onNavigate }: EcoFarmingSectionProps) {
  const { language } = useLanguage()

  const ecoMethods = [
    {
      icon: Drop,
      title_uk: 'Природна фільтрація води',
      title_en: 'Natural Water Filtration',
      description_uk:
        'Використовуємо біологічні фільтри з водними рослинами для очищення води в басейнах. Це створює природний екосистемний баланс.',
      description_en:
        'We use biological filters with aquatic plants to purify pool water. This creates a natural ecosystem balance.',
    },
    {
      icon: Leaf,
      title_uk: 'Органічне харчування',
      title_en: 'Organic Feeding',
      description_uk:
        'Наші креветки отримують виключно органічні корми з водоростей, планктону та природних білків без штучних добавок.',
      description_en:
        'Our prawns receive exclusively organic feed from algae, plankton and natural proteins without artificial additives.',
    },
    {
      icon: Recycle,
      title_uk: 'Замкнутий цикл виробництва',
      title_en: 'Closed Production Cycle',
      description_uk:
        'Відходи від креветок стають добривом для рослин, а рослини очищують воду. Повна екологічна циркуляція.',
      description_en:
        'Prawn waste becomes fertilizer for plants, and plants purify the water. Complete ecological circulation.',
    },
    {
      icon: Shield,
      title_uk: 'Без антибіотиків та хімії',
      title_en: 'No Antibiotics or Chemicals',
      description_uk:
        "Ми ніколи не використовуємо антибіотики, гормони росту або штучні стимулятори. Лише природні методи підтримки здоров'я.",
      description_en:
        'We never use antibiotics, growth hormones or artificial stimulants. Only natural health support methods.',
    },
  ]

  const certifications = [
    {
      name_uk: 'Органічне виробництво',
      name_en: 'Organic Production',
      code: 'EU-ORG-2024',
      description_uk: 'Сертифікат органічного виробництва ЄС',
      description_en: 'EU Organic Production Certificate',
    },
    {
      name_uk: 'Екологічний стандарт',
      name_en: 'Environmental Standard',
      code: 'ECO-FARM-UA',
      description_uk: 'Українські екологічні стандарти аквакультури',
      description_en: 'Ukrainian Environmental Aquaculture Standards',
    },
    {
      name_uk: 'Біобезпека',
      name_en: 'Biosafety',
      code: 'BIO-SAFE-2024',
      description_uk: 'Міжнародний стандарт біологічної безпеки',
      description_en: 'International Biological Safety Standard',
    },
  ]

  const benefits = [
    {
      title_uk: 'Вищий вміст Omega-3',
      title_en: 'Higher Omega-3 Content',
      description_uk: 'На 40% більше корисних жирних кислот завдяки природному харчуванню',
      description_en: '40% more beneficial fatty acids due to natural nutrition',
    },
    {
      title_uk: 'Чистіший смак',
      title_en: 'Cleaner Taste',
      description_uk: "Відсутність медикаментозного присмаку, природна солодкість м'яса",
      description_en: 'No medicinal aftertaste, natural sweetness of meat',
    },
    {
      title_uk: 'Довший термін зберігання',
      title_en: 'Longer Shelf Life',
      description_uk: 'Природні антиоксиданти подовжують свіжість продукту',
      description_en: 'Natural antioxidants extend product freshness',
    },
    {
      title_uk: "Безпека для здоров'я",
      title_en: 'Health Safety',
      description_uk: 'Нульовий ризик алергічних реакцій на антибіотики',
      description_en: 'Zero risk of allergic reactions to antibiotics',
    },
  ]

  return (
    <section className="min-h-screen py-20 px-6 bg-gradient-to-b from-green-50/50 to-blue-50/50">
      <div className="max-w-7xl mx-auto">
  {/* Header removed: глобальная кнопка Назад уже существует в App.tsx */}
  <div className="mb-4" />

        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Leaf size={16} />
            {language === 'uk' ? 'Екологічне виробництво' : 'Ecological Production'}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground heading-font mb-6">
            🌿 {language === 'uk' ? 'Екологічне вирощування' : 'Eco-Friendly Growing'}
          </h1>

          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-8">
            {language === 'uk'
              ? 'Ми використовуємо виключно природні методи вирощування креветок, створюючи ідеальну екосистему без шкоди для навколишнього середовища. Наш підхід забезпечує найвищу якість продукції та збереження природних ресурсів.'
              : 'We use exclusively natural prawn farming methods, creating a perfect ecosystem without harming the environment. Our approach ensures the highest product quality and preservation of natural resources.'}
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">0%</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Хімічних добавок' : 'Chemical Additives'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Природні корми' : 'Natural Feed'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">40%</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Більше Omega-3' : 'More Omega-3'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-2">5★</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Екологічний рейтинг' : 'Eco Rating'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Eco Methods */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Наші екологічні методи' : 'Our Ecological Methods'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ecoMethods.map((method, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <method.icon size={32} className="text-green-600" />
                      </div>
                      <CardTitle className="text-xl">
                        {language === 'uk' ? method.title_uk : method.title_en}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {language === 'uk' ? method.description_uk : method.description_en}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Сертифікати та стандарти' : 'Certificates and Standards'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield size={32} className="text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {language === 'uk' ? cert.name_uk : cert.name_en}
                  </h3>
                  <Badge variant="outline" className="mb-3">
                    {cert.code}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {language === 'uk' ? cert.description_uk : cert.description_en}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? "Переваги для здоров'я" : 'Health Benefits'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-lg border">
                <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {language === 'uk' ? benefit.title_uk : benefit.title_en}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'uk' ? benefit.description_uk : benefit.description_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Environmental Impact */}
        <motion.div
          className="bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-8 md:p-12 text-white text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Globe size={64} className="mx-auto mb-6 opacity-80" />
          <h3 className="text-3xl font-bold heading-font mb-6">
            {language === 'uk' ? 'Наш вплив на довкілля' : 'Our Environmental Impact'}
          </h3>
          <p className="text-xl leading-relaxed mb-8 opacity-90 max-w-3xl mx-auto">
            {language === 'uk'
              ? 'За 5 років роботи ми заощадили понад 2 мільйони літрів води завдяки системі рециркуляції, зменшили викиди CO₂ на 60% порівняно з традиційними фермами та створили робочі місця для 15 місцевих сімей.'
              : 'Over 5 years of operation, we have saved over 2 million liters of water through our recirculation system, reduced CO₂ emissions by 60% compared to traditional farms, and created jobs for 15 local families.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              onClick={() => onNavigate?.('contact')}
            >
              {language === 'uk' ? 'Дізнатися більше' : 'Learn More'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/50 text-white hover:bg-white/10"
              onClick={() => onNavigate?.('gallery')}
            >
              {language === 'uk' ? 'Переглянути ферму' : 'Tour the Farm'}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
