import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Heart, Trophy, Gift, ShoppingCart, Phone, ArrowRight } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'

interface Review {
  id: string
  name: string
  rating: number
  comment_uk: string
  comment_en: string
  date: string
  verified: boolean
  location: string
}

interface LoyaltyProgram {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  points: number
  pointsToNext: number
  benefits: string[]
}

interface ReviewsSectionProps {
  onNavigate?: (section: string) => void
}

export function ReviewsSection({ onNavigate }: ReviewsSectionProps) {
  const { language } = useLanguage()
  const [loyaltyData, setLoyaltyData] = useKV<LoyaltyProgram>('loyalty-program', {
    level: 'Bronze',
    points: 0,
    pointsToNext: 100,
    benefits: []
  })

  const reviews: Review[] = [
    {
      id: '1',
      name: 'Андрій Коваленко',
      rating: 5,
      comment_uk: 'Найкращі креветки, які я коли-небудь куштував! Свіжість неймовірна, а смак просто фантастичний. Обов\'язково замовлю ще.',
      comment_en: 'The best prawns I have ever tasted! The freshness is incredible, and the taste is simply fantastic. Will definitely order again.',
      date: '2024-01-15',
      verified: true,
      location: 'Київ'
    },
    {
      id: '2',
      name: 'Марія Петрова',
      rating: 5,
      comment_uk: 'Замовляємо для нашого ресторану вже пів року. Якість завжди на висоті, доставка швидка. Клієнти в захваті!',
      comment_en: 'We have been ordering for our restaurant for half a year. Quality is always top-notch, delivery is fast. Customers are delighted!',
      date: '2024-01-10',
      verified: true,
      location: 'Львів'
    },
    {
      id: '3',
      name: 'Олексій Мельник',
      rating: 4,
      comment_uk: 'Відмінна продукція, швидка доставка. Трохи дорого, але якість того варта. Система лояльності дуже приємна.',
      comment_en: 'Excellent product, fast delivery. A bit pricey, but the quality is worth it. The loyalty system is very nice.',
      date: '2024-01-08',
      verified: true,
      location: 'Одеса'
    },
    {
      id: '4',
      name: 'Тетяна Шевченко',
      rating: 5,
      comment_uk: 'Креветки просто чудові! Готувала для сім\'ї на день народження - всі були в захваті. Дякую за якість!',
      comment_en: 'The prawns are simply wonderful! Cooked for the family birthday - everyone was delighted. Thank you for the quality!',
      date: '2024-01-05',
      verified: true,
      location: 'Харків'
    }
  ]

  const loyaltyLevels = {
    Bronze: { min: 0, max: 100, color: 'bg-orange-500', benefits: ['5% знижка', '2 бали за 100 грн'] },
    Silver: { min: 100, max: 300, color: 'bg-gray-400', benefits: ['10% знижка', '3 бали за 100 грн', 'Пріоритетна доставка'] },
    Gold: { min: 300, max: 600, color: 'bg-yellow-500', benefits: ['15% знижка', '4 бали за 100 грн', 'Безкоштовна доставка'] },
    Platinum: { min: 600, max: 1000, color: 'bg-purple-500', benefits: ['20% знижка', '5 балів за 100 грн', 'Ексклюзивні товари'] }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={18}
        weight={i < rating ? 'fill' : 'regular'}
        className={i < rating ? 'text-yellow-500' : 'text-gray-300'}
      />
    ))
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

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
            {language === 'uk' ? 'Відгуки клієнтів' : 'Customer Reviews'}
          </h2>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              {renderStars(Math.round(averageRating))}
            </div>
            <span className="text-2xl font-bold text-foreground">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              ({reviews.length} {language === 'uk' ? 'відгуків' : 'reviews'})
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reviews */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{review.name}</h3>
                          <p className="text-sm text-muted-foreground">{review.location}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              {language === 'uk' ? 'Підтверджено' : 'Verified'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {language === 'uk' ? review.comment_uk : review.comment_en}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Loyalty Program */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="sticky top-8">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy size={32} className="text-primary" />
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {language === 'uk' ? 'Програма лояльності' : 'Loyalty Program'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {language === 'uk' ? 'Збирайте бали та отримуйте знижки' : 'Collect points and get discounts'}
                      </p>
                    </div>
                  </div>

                  {/* Current Level */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        {language === 'uk' ? 'Поточний рівень:' : 'Current Level:'}
                      </span>
                      <Badge className={`${loyaltyLevels[loyaltyData.level].color} text-white`}>
                        {loyaltyData.level}
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <Progress 
                        value={(loyaltyData.points / (loyaltyData.points + loyaltyData.pointsToNext)) * 100} 
                        className="h-2"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {loyaltyData.points} {language === 'uk' ? 'балів' : 'points'} • 
                      {loyaltyData.pointsToNext} {language === 'uk' ? 'до наступного рівня' : 'to next level'}
                    </p>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Benefits */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-3">
                      {language === 'uk' ? 'Ваші переваги:' : 'Your Benefits:'}
                    </h4>
                    <ul className="space-y-2">
                      {loyaltyLevels[loyaltyData.level].benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Gift size={16} className="text-primary" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Level Cards */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">
                      {language === 'uk' ? 'Всі рівні:' : 'All Levels:'}
                    </h4>
                    {Object.entries(loyaltyLevels).map(([level, data]) => (
                      <div
                        key={level}
                        className={`p-3 rounded-lg border ${
                          loyaltyData.level === level ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{level}</span>
                          <span className="text-xs text-muted-foreground">
                            {data.min}-{data.max} {language === 'uk' ? 'балів' : 'points'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {data.benefits[0]}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full mt-6">
                    <Heart size={18} className="mr-2" />
                    {language === 'uk' ? 'Приєднатися до програми' : 'Join the Program'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50" onClick={() => onNavigate?.('products')}>
            <CardContent className="p-8 text-center">
              <ShoppingCart size={48} className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold mb-3">
                {language === 'uk' ? 'Спробуйте самі' : 'Try for Yourself'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk' 
                  ? 'Замовте креветки та переконайтеся в їх якості'
                  : 'Order prawns and experience their quality'
                }
              </p>
              <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                {language === 'uk' ? 'Зробити замовлення' : 'Place Order'} <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50" onClick={() => onNavigate?.('contact')}>
            <CardContent className="p-8 text-center">
              <Phone size={48} className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold mb-3">
                {language === 'uk' ? 'Залишити відгук' : 'Leave a Review'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk' 
                  ? 'Поділіться своїм досвідом з нашими креветками'
                  : 'Share your experience with our prawns'
                }
              </p>
              <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                {language === 'uk' ? 'Зв\'язатися' : 'Contact Us'} <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}