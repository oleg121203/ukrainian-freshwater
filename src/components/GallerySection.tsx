import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ShoppingCart, BookOpen, ArrowRight } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface GalleryImage {
  id: string
  src: string
  title_uk: string
  title_en: string
  description_uk: string
  description_en: string
  category: 'farm' | 'process' | 'product'
}

interface GallerySectionProps {
  onNavigate?: (section: string) => void
}

export function GallerySection({ onNavigate }: GallerySectionProps) {
  const { language } = useLanguage()
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Mock gallery data - in real app this would come from a server or CMS
  const galleryImages: GalleryImage[] = [
    {
      id: '1',
      src: '🏞️', // In real app, these would be actual image URLs
      title_uk: 'Наша ферма з висоти',
      title_en: 'Our Farm from Above',
      description_uk: 'Вид на наше господарство з дрона - чисті басейни та природне середовище',
      description_en: 'Drone view of our farm - clean pools and natural environment',
      category: 'farm'
    },
    {
      id: '2',
      src: '🦐',
      title_uk: 'Свіжі креветки',
      title_en: 'Fresh Prawns',
      description_uk: 'Щойно виловлені креветки готові до упаковки',
      description_en: 'Freshly caught prawns ready for packaging',
      category: 'product'
    },
    {
      id: '3',
      src: '⚗️',
      title_uk: 'Контроль якості води',
      title_en: 'Water Quality Control',
      description_uk: 'Щоденна перевірка параметрів води в наших басейнах',
      description_en: 'Daily water parameter checks in our pools',
      category: 'process'
    },
    {
      id: '4',
      src: '🌊',
      title_uk: 'Система фільтрації',
      title_en: 'Filtration System',
      description_uk: 'Сучасна система очищення води забезпечує ідеальні умови',
      description_en: 'Modern water purification system ensures perfect conditions',
      category: 'farm'
    },
    {
      id: '5',
      src: '👨‍🔬',
      title_uk: 'Процес сортування',
      title_en: 'Sorting Process',
      description_uk: 'Ретельний відбір креветок за розміром та якістю',
      description_en: 'Careful selection of prawns by size and quality',
      category: 'process'
    },
    {
      id: '6',
      src: '📦',
      title_uk: 'Упаковка продукції',
      title_en: 'Product Packaging',
      description_uk: 'Вакуумна упаковка для збереження свіжості',
      description_en: 'Vacuum packaging to maintain freshness',
      category: 'product'
    },
    {
      id: '7',
      src: '🌱',
      title_uk: 'Мальки креветок',
      title_en: 'Prawn Juveniles',
      description_uk: 'Молоді креветки в спеціальних інкубаторах',
      description_en: 'Young prawns in special incubators',
      category: 'process'
    },
    {
      id: '8',
      src: '🍽️',
      title_uk: 'Готова продукція',
      title_en: 'Final Product',
      description_uk: 'Красиво подані креветки готові до сервірування',
      description_en: 'Beautifully presented prawns ready to serve',
      category: 'product'
    }
  ]

  const categories = [
    { key: 'all', label_uk: 'Всі фото', label_en: 'All Photos' },
    { key: 'farm', label_uk: 'Ферма', label_en: 'Farm' },
    { key: 'process', label_uk: 'Процес', label_en: 'Process' },
    { key: 'product', label_uk: 'Продукція', label_en: 'Products' }
  ]

  const filteredImages = selectedCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory)

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!selectedImage) return
    
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id)
    let newIndex
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredImages.length
    } else {
      newIndex = currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1
    }
    
    setSelectedImage(filteredImages[newIndex])
  }

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground heading-font mb-6">
            {language === 'uk' ? 'Наша галерея' : 'Our Gallery'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'uk' 
              ? 'Подивіться, як ми вирощуємо найкращі креветки'
              : 'See how we grow the best prawns'
            }
          </p>
        </motion.div>

        {/* Category filters */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {categories.map((category) => (
            <Button
              key={category.key}
              variant={selectedCategory === category.key ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.key)}
              className="rounded-full"
            >
              {language === 'uk' ? category.label_uk : category.label_en}
            </Button>
          ))}
        </motion.div>

        {/* Gallery grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          layout
        >
          <AnimatePresence mode="wait">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
                onClick={() => openLightbox(image)}
              >
                <div className="relative aspect-square bg-gradient-aqua rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl">
                    {image.src}
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="font-semibold text-sm leading-tight">
                        {language === 'uk' ? image.title_uk : image.title_en}
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
            >
              <motion.div
                className="relative max-w-4xl max-h-full bg-white rounded-2xl overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 z-10 text-black hover:bg-black/10"
                  onClick={closeLightbox}
                >
                  <X size={24} />
                </Button>

                {/* Navigation buttons */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-black hover:bg-black/10"
                  onClick={() => navigateLightbox('prev')}
                >
                  <ChevronLeft size={24} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-black hover:bg-black/10"
                  onClick={() => navigateLightbox('next')}
                >
                  <ChevronRight size={24} />
                </Button>

                {/* Image */}
                <div className="aspect-video bg-gradient-aqua flex items-center justify-center text-8xl">
                  {selectedImage.src}
                </div>

                {/* Image info */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {language === 'uk' ? selectedImage.title_uk : selectedImage.title_en}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'uk' ? selectedImage.description_uk : selectedImage.description_en}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Additional Actions */}
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
                {language === 'uk' ? 'Замовити креветки' : 'Order Prawns'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk' 
                  ? 'Оберіть та замовте свіжі креветки з нашої ферми'
                  : 'Choose and order fresh prawns from our farm'
                }
              </p>
              <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                {language === 'uk' ? 'До каталогу' : 'To Catalog'} <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50" onClick={() => onNavigate?.('recipes')}>
            <CardContent className="p-8 text-center">
              <BookOpen size={48} className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold mb-3">
                {language === 'uk' ? 'Рецепти з креветками' : 'Prawn Recipes'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk' 
                  ? 'Дізнайтеся як готувати смачні страви з креветок'
                  : 'Learn how to cook delicious dishes with prawns'
                }
              </p>
              <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                {language === 'uk' ? 'Переглянути рецепти' : 'View Recipes'} <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}