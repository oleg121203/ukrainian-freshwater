import { motion } from 'framer-motion'
import { Gear, Thermometer, DropletHalf, ChartLineUp, ArrowLeft, Cpu, WifiHigh, Timer } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface TechnologySectionProps {
  onNavigate?: (section: string) => void
}

export function TechnologySection({ onNavigate }: TechnologySectionProps) {
  const { language } = useLanguage()

  const technologies = [
    {
      icon: Thermometer,
      title_uk: 'Контроль температури',
      title_en: 'Temperature Control',
      description_uk: 'Автоматичні системи підтримують оптимальну температуру 28-32°C цілодобово з точністю ±0.5°C',
      description_en: 'Automatic systems maintain optimal temperature 28-32°C 24/7 with ±0.5°C accuracy',
      specs: {
        range_uk: 'Діапазон: 26-35°C',
        range_en: 'Range: 26-35°C',
        accuracy_uk: 'Точність: ±0.5°C',
        accuracy_en: 'Accuracy: ±0.5°C',
        monitoring_uk: 'Моніторинг: 24/7',
        monitoring_en: 'Monitoring: 24/7'
      }
    },
    {
      icon: DropletHalf,
      title_uk: 'Якість води',
      title_en: 'Water Quality',
      description_uk: 'Постійний аналіз pH, розчиненого кисню, амонію та нітратів з автоматичним коригуванням',
      description_en: 'Continuous analysis of pH, dissolved oxygen, ammonia and nitrates with automatic correction',
      specs: {
        ph_uk: 'pH: 7.5-8.5',
        ph_en: 'pH: 7.5-8.5',
        oxygen_uk: 'Кисень: >6 мг/л',
        oxygen_en: 'Oxygen: >6 mg/l',
        tests_uk: 'Тестів на день: 96',
        tests_en: 'Tests per day: 96'
      }
    },
    {
      icon: ChartLineUp,
      title_uk: 'Аналітика росту',
      title_en: 'Growth Analytics',
      description_uk: 'ШІ-система відстежує ріст кожної особини, прогнозує врожайність та оптимізує годування',
      description_en: 'AI system tracks individual growth, predicts yield and optimizes feeding',
      specs: {
        tracking_uk: 'Відстеження: Індивідуальне',
        tracking_en: 'Tracking: Individual',
        prediction_uk: 'Прогноз: 95% точність',
        prediction_en: 'Prediction: 95% accuracy',
        optimization_uk: 'Оптимізація: Автоматична',
        optimization_en: 'Optimization: Automatic'
      }
    },
    {
      icon: WifiHigh,
      title_uk: 'IoT мережа',
      title_en: 'IoT Network',
      description_uk: 'Більше 200 датчиків підключені до єдиної мережі для комплексного моніторингу',
      description_en: 'Over 200 sensors connected to a unified network for comprehensive monitoring',
      specs: {
        sensors_uk: 'Датчики: 250+',
        sensors_en: 'Sensors: 250+',
        connectivity_uk: 'Зв\'язок: 99.9%',
        connectivity_en: 'Connectivity: 99.9%',
        latency_uk: 'Затримка: <100мс',
        latency_en: 'Latency: <100ms'
      }
    }
  ]

  const automationFeatures = [
    {
      name_uk: 'Автоматичне годування',
      name_en: 'Automatic Feeding',
      description_uk: 'Розумні годівниці дозують корм за розкладом та потребами',
      description_en: 'Smart feeders dispense food according to schedule and needs',
      efficiency: 95
    },
    {
      name_uk: 'Очищення води',
      name_en: 'Water Purification',
      description_uk: 'Автоматична система фільтрації та рециркуляції',
      description_en: 'Automatic filtration and recirculation system',
      efficiency: 98
    },
    {
      name_uk: 'Контроль середовища',
      name_en: 'Environment Control',
      description_uk: 'Підтримка оптимальних умов без втручання людини',
      description_en: 'Maintaining optimal conditions without human intervention',
      efficiency: 99
    },
    {
      name_uk: 'Моніторинг здоров\'я',
      name_en: 'Health Monitoring',
      description_uk: 'Раннє виявлення захворювань через аналіз поведінки',
      description_en: 'Early disease detection through behavior analysis',
      efficiency: 92
    }
  ]

  const benefits = [
    {
      icon: Timer,
      title_uk: 'Швидший ріст',
      title_en: 'Faster Growth',
      value: '+25%',
      description_uk: 'Прискорення росту завдяки оптимальним умовам',
      description_en: 'Growth acceleration through optimal conditions'
    },
    {
      icon: DropletHalf,
      title_uk: 'Економія води',
      title_en: 'Water Savings',
      value: '60%',
      description_uk: 'Зменшення споживання води через рециркуляцію',
      description_en: 'Reduced water consumption through recirculation'
    },
    {
      icon: Gear,
      title_uk: 'Ефективність',
      title_en: 'Efficiency',
      value: '40%',
      description_uk: 'Підвищення загальної ефективності виробництва',
      description_en: 'Increased overall production efficiency'
    },
    {
      icon: ChartLineUp,
      title_uk: 'Якість',
      title_en: 'Quality',
      value: '99.5%',
      description_uk: 'Стабільність якості продукції',
      description_en: 'Product quality consistency'
    }
  ]

  return (
    <section className="min-h-screen py-20 px-6 bg-gradient-to-b from-blue-50/50 to-indigo-50/50">
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
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Cpu size={16} />
            {language === 'uk' ? 'Інноваційні технології' : 'Innovative Technologies'}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground heading-font mb-6">
            🔬 {language === 'uk' ? 'Сучасні технології' : 'Modern Technologies'}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-8">
            {language === 'uk' 
              ? 'Наша ферма оснащена найсучаснішими автоматизованими системами, які забезпечують ідеальні умови для вирощування креветок. Використання ШІ та IoT технологій дозволяє досягти максимальної ефективності та якості.'
              : 'Our farm is equipped with state-of-the-art automated systems that provide perfect conditions for prawn farming. The use of AI and IoT technologies allows us to achieve maximum efficiency and quality.'
            }
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">250+</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'IoT датчиків' : 'IoT Sensors'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">24/7</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Автоматичний моніторинг' : 'Automatic Monitoring'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">99.5%</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Точність системи' : 'System Accuracy'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-2">AI</div>
              <p className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Штучний інтелект' : 'Artificial Intelligence'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Technology Systems */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Технологічні системи' : 'Technology Systems'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <tech.icon size={32} className="text-blue-600" />
                      </div>
                      <CardTitle className="text-xl">
                        {language === 'uk' ? tech.title_uk : tech.title_en}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {language === 'uk' ? tech.description_uk : tech.description_en}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(tech.specs).map(([key, value]) => {
                        if (key.includes('_')) {
                          const baseKey = key.replace('_uk', '').replace('_en', '')
                          if (key.endsWith(`_${language}`)) {
                            return (
                              <Badge key={baseKey} variant="outline" className="justify-start">
                                {value}
                              </Badge>
                            )
                          }
                        }
                        return null
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Automation Features */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Автоматизація процесів' : 'Process Automation'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {automationFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">
                      {language === 'uk' ? feature.name_uk : feature.name_en}
                    </h3>
                    <Badge variant="secondary">{feature.efficiency}%</Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {language === 'uk' ? feature.description_uk : feature.description_en}
                  </p>
                  <Progress value={feature.efficiency} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 heading-font">
            {language === 'uk' ? 'Результати впровадження' : 'Implementation Results'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon size={32} className="text-white" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {benefit.value}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {language === 'uk' ? benefit.title_uk : benefit.title_en}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'uk' ? benefit.description_uk : benefit.description_en}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Future Technologies */}
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Cpu size={64} className="mx-auto mb-6 opacity-80" />
          <h3 className="text-3xl font-bold heading-font mb-6">
            {language === 'uk' ? 'Майбутні технології' : 'Future Technologies'}
          </h3>
          <p className="text-xl leading-relaxed mb-8 opacity-90 max-w-3xl mx-auto">
            {language === 'uk'
              ? 'Ми постійно інвестуємо в дослідження та розробку нових технологій. В планах: впровадження машинного навчання для прогнозування захворювань, робототехніка для автоматичного збору врожаю та блокчейн для відстеження продукції.'
              : 'We continuously invest in research and development of new technologies. Plans include: implementing machine learning for disease prediction, robotics for automatic harvesting, and blockchain for product traceability.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              onClick={() => onNavigate?.('contact')}
            >
              {language === 'uk' ? 'Технічна консультація' : 'Technical Consultation'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/50 text-white hover:bg-white/10"
              onClick={() => onNavigate?.('gallery')}
            >
              {language === 'uk' ? 'Віртуальний тур' : 'Virtual Tour'}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}