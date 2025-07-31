import { motion } from 'framer-motion'
import { Leaf, Award, Users, Heart } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'

export function AboutSection() {
  const { language, t } = useLanguage()

  const stats = [
    {
      icon: Award,
      number: '5+',
      label_uk: 'років досвіду',
      label_en: 'years experience'
    },
    {
      icon: Leaf,
      number: '100%',
      label_uk: 'екологічно чисто',
      label_en: 'eco-friendly'
    },
    {
      icon: Users,
      number: '500+',
      label_uk: 'задоволених клієнтів',
      label_en: 'happy customers'
    },
    {
      icon: Heart,
      number: '24/7',
      label_uk: 'турбота про якість',
      label_en: 'quality care'
    }
  ]

  const features = [
    {
      icon: '🌿',
      title_uk: 'Екологічне вирощування',
      title_en: 'Eco-friendly Growing',
      description_uk: 'Використовуємо лише природні методи без хімікатів та антибіотиків',
      description_en: 'Using only natural methods without chemicals and antibiotics'
    },
    {
      icon: '🔬',
      title_uk: 'Сучасні технології',
      title_en: 'Modern Technologies',
      description_uk: 'Автоматизовані системи контролю якості води та температури',
      description_en: 'Automated water quality and temperature control systems'
    },
    {
      icon: '🚚',
      title_uk: 'Швидка доставка',
      title_en: 'Fast Delivery',
      description_uk: 'Доставляємо свіжу продукцію протягом 24 годин після вилову',
      description_en: 'Delivering fresh products within 24 hours of harvest'
    },
    {
      icon: '👨‍🍳',
      title_uk: 'Для професіоналів',
      title_en: 'For Professionals',
      description_uk: 'Співпрацюємо з ресторанами та готельними комплексами',
      description_en: 'Working with restaurants and hotel complexes'
    }
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
            {t('about.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('about.description')}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 border-2 hover:border-primary/30 transition-colors duration-300">
                <CardContent className="p-0">
                  <stat.icon size={48} className="text-primary mx-auto mb-4" />
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stat.number}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {language === 'uk' ? stat.label_uk : stat.label_en}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {language === 'uk' ? feature.title_uk : feature.title_en}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'uk' ? feature.description_uk : feature.description_en}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Story Section */}
        <motion.div
          className="bg-gradient-aqua rounded-3xl p-8 md:p-12 text-white"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold heading-font mb-6">
              {language === 'uk' ? 'Наша історія' : 'Our Story'}
            </h3>
            <p className="text-lg leading-relaxed mb-8 opacity-90">
              {language === 'uk' 
                ? 'Ми почали свою діяльність у 2018 році з мрією створити найякісніші умови для вирощування малайзійських креветок в Україні. Наша сім\'я завжди мала пристрасть до аквакультури, і ми вирішили поєднати традиційні методи з сучасними технологіями. Сьогодні наша ферма є прикладом сталого розвитку та якості в галузі.'
                : 'We started our business in 2018 with a dream to create the highest quality conditions for growing Malaysian prawns in Ukraine. Our family has always had a passion for aquaculture, and we decided to combine traditional methods with modern technology. Today our farm is an example of sustainable development and quality in the industry.'
              }
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl">👨‍🌾</span>
                </div>
                <p className="font-semibold">
                  {language === 'uk' ? 'Михайло Петренко' : 'Mykhailo Petrenko'}
                </p>
                <p className="text-sm opacity-80">
                  {language === 'uk' ? 'Засновник та головний спеціаліст' : 'Founder and Chief Specialist'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl">👩‍💼</span>
                </div>
                <p className="font-semibold">
                  {language === 'uk' ? 'Олена Петренко' : 'Olena Petrenko'}
                </p>
                <p className="text-sm opacity-80">
                  {language === 'uk' ? 'Директор з якості' : 'Quality Director'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}