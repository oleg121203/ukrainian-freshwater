import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, ChefHat, Heart, ShoppingCart, Images, ArrowRight } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKV } from '@github/spark/hooks'

interface Recipe {
  id: string
  title_uk: string
  title_en: string
  description_uk: string
  description_en: string
  cookTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  servings: number
  ingredients_uk: string[]
  ingredients_en: string[]
  instructions_uk: string[]
  instructions_en: string[]
  category: 'appetizer' | 'main' | 'soup' | 'salad'
  image: string
}

interface RecipesSectionProps {
  onNavigate?: (section: string) => void
}

export function RecipesSection({ onNavigate }: RecipesSectionProps) {
  const { language } = useLanguage()
  const [favoriteRecipes, setFavoriteRecipes] = useKV<string[]>('favorite-recipes', [])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const recipes: Recipe[] = [
    {
      id: 'grilled-prawns',
      title_uk: 'Креветки гриль з часником',
      title_en: 'Grilled Prawns with Garlic',
      description_uk: 'Ароматні креветки з часником та травами, приготовані на грилі',
      description_en: 'Aromatic prawns with garlic and herbs, grilled to perfection',
      cookTime: 15,
      difficulty: 'easy',
      servings: 4,
      ingredients_uk: [
        '500г свіжих креветок',
        '4 зубчики часнику',
        '2 ст.л. оливкової олії',
        'Сіль та перець за смаком',
        'Свіжий розмарин',
        'Лимон для подачі'
      ],
      ingredients_en: [
        '500g fresh prawns',
        '4 garlic cloves',
        '2 tbsp olive oil',
        'Salt and pepper to taste',
        'Fresh rosemary',
        'Lemon for serving'
      ],
      instructions_uk: [
        'Очистити креветки, залишивши хвостики',
        'Подрібнити часник та змішати з олією',
        'Замаринувати креветки 10 хвилин',
        'Розігріти гриль',
        'Смажити креветки 2-3 хвилини з кожного боку',
        'Подавати з лимоном та зеленню'
      ],
      instructions_en: [
        'Clean prawns, leaving tails on',
        'Mince garlic and mix with oil',
        'Marinate prawns for 10 minutes',
        'Heat the grill',
        'Grill prawns 2-3 minutes each side',
        'Serve with lemon and herbs'
      ],
      category: 'main',
      image: '🍤'
    },
    {
      id: 'prawn-salad',
      title_uk: 'Салат з креветками та авокадо',
      title_en: 'Prawn and Avocado Salad',
      description_uk: 'Легкий та освіжаючий салат з креветками, авокадо та мікс-зеленню',
      description_en: 'Light and refreshing salad with prawns, avocado and mixed greens',
      cookTime: 10,
      difficulty: 'easy',
      servings: 2,
      ingredients_uk: [
        '300г варених креветок',
        '2 авокадо',
        '100г мікс-салату',
        '1 огірок',
        'Помідори черрі',
        'Лимонний дресинг'
      ],
      ingredients_en: [
        '300g cooked prawns',
        '2 avocados',
        '100g mixed salad',
        '1 cucumber',
        'Cherry tomatoes',
        'Lemon dressing'
      ],
      instructions_uk: [
        'Нарізати авокадо та огірок',
        'Розділити помідори навпіл',
        'Змішати з салатом та креветками',
        'Заправити лимонним дресингом',
        'Подавати охолодженим'
      ],
      instructions_en: [
        'Dice avocado and cucumber',
        'Halve cherry tomatoes',
        'Mix with salad and prawns',
        'Dress with lemon dressing',
        'Serve chilled'
      ],
      category: 'salad',
      image: '🥗'
    },
    {
      id: 'prawn-soup',
      title_uk: 'Креветковий біск',
      title_en: 'Prawn Bisque',
      description_uk: 'Витончений вершковий суп з креветками та ароматними травами',
      description_en: 'Elegant cream soup with prawns and aromatic herbs',
      cookTime: 45,
      difficulty: 'medium',
      servings: 6,
      ingredients_uk: [
        '600г креветок з панцирами',
        '200мл вершків',
        '1 цибулина',
        '2 моркви',
        'Селера',
        'Томатна паста',
        'Білий бульйон'
      ],
      ingredients_en: [
        '600g prawns with shells',
        '200ml cream',
        '1 onion',
        '2 carrots',
        'Celery',
        'Tomato paste',
        'White stock'
      ],
      instructions_uk: [
        'Очистити креветки, панцирі залишити',
        'Обсмажити овочі',
        'Додати панцирі та томатну пасту',
        'Залити бульйоном, варити 30 хвилин',
        'Протерти через сито',
        'Додати вершки та креветки'
      ],
      instructions_en: [
        'Clean prawns, keep shells',
        'Sauté vegetables',
        'Add shells and tomato paste',
        'Add stock, simmer 30 minutes',
        'Strain through sieve',
        'Add cream and prawns'
      ],
      category: 'soup',
      image: '🍲'
    },
    {
      id: 'prawn-tempura',
      title_uk: 'Креветки темпура',
      title_en: 'Prawn Tempura',
      description_uk: 'Хрусткі креветки в легкому тісті темпура з соусом для макання',
      description_en: 'Crispy prawns in light tempura batter with dipping sauce',
      cookTime: 20,
      difficulty: 'medium',
      servings: 4,
      ingredients_uk: [
        '400г великих креветок',
        '150г борошна',
        '200мл холодної води',
        '1 яйце',
        'Олія для фритюру',
        'Соєвий соус для подачі'
      ],
      ingredients_en: [
        '400g large prawns',
        '150g flour',
        '200ml cold water',
        '1 egg',
        'Oil for deep frying',
        'Soy sauce for serving'
      ],
      instructions_uk: [
        'Очистити креветки',
        'Приготувати тісто з борошна, води та яйця',
        'Розігріти олію до 180°C',
        'Занурити креветки в тісто',
        'Смажити 2-3 хвилини до золотистого кольору',
        'Подавати з соусом'
      ],
      instructions_en: [
        'Clean prawns',
        'Make batter with flour, water and egg',
        'Heat oil to 180°C',
        'Dip prawns in batter',
        'Fry 2-3 minutes until golden',
        'Serve with sauce'
      ],
      category: 'appetizer',
      image: '🍤'
    }
  ]

  const categories = [
    { key: 'all', label_uk: 'Всі рецепти', label_en: 'All Recipes' },
    { key: 'appetizer', label_uk: 'Закуски', label_en: 'Appetizers' },
    { key: 'main', label_uk: 'Основні страви', label_en: 'Main Courses' },
    { key: 'soup', label_uk: 'Супи', label_en: 'Soups' },
    { key: 'salad', label_uk: 'Салати', label_en: 'Salads' }
  ]

  const filteredRecipes = selectedCategory === 'all' 
    ? recipes 
    : recipes.filter(recipe => recipe.category === selectedCategory)

  const toggleFavorite = (recipeId: string) => {
    setFavoriteRecipes((current) => {
      if (current.includes(recipeId)) {
        return current.filter(id => id !== recipeId)
      } else {
        return [...current, recipeId]
      }
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    const labels = {
      easy: { uk: 'Легко', en: 'Easy' },
      medium: { uk: 'Середньо', en: 'Medium' },
      hard: { uk: 'Складно', en: 'Hard' }
    }
    return language === 'uk' ? labels[difficulty as keyof typeof labels].uk : labels[difficulty as keyof typeof labels].en
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
            {language === 'uk' ? 'Рецепти з креветками' : 'Prawn Recipes'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'uk' 
              ? 'Відкрийте для себе смачні способи приготування наших креветок'
              : 'Discover delicious ways to cook our prawns'
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

        {/* Recipes grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="relative">
                    <div className="text-6xl text-center mb-4">{recipe.image}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 p-2"
                      onClick={() => toggleFavorite(recipe.id)}
                    >
                      <Heart 
                        size={20} 
                        weight={favoriteRecipes.includes(recipe.id) ? 'fill' : 'regular'}
                        className={favoriteRecipes.includes(recipe.id) ? 'text-red-500' : 'text-gray-400'}
                      />
                    </Button>
                  </div>
                  
                  <CardTitle className="text-xl leading-tight">
                    {language === 'uk' ? recipe.title_uk : recipe.title_en}
                  </CardTitle>
                  
                  <p className="text-sm text-muted-foreground">
                    {language === 'uk' ? recipe.description_uk : recipe.description_en}
                  </p>

                  {/* Recipe meta */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{recipe.cookTime} {language === 'uk' ? 'хв' : 'min'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{recipe.servings} {language === 'uk' ? 'порц' : 'serv'}</span>
                    </div>
                    <Badge className={`${getDifficultyColor(recipe.difficulty)} text-white text-xs`}>
                      {getDifficultyLabel(recipe.difficulty)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Ingredients preview */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <ChefHat size={16} />
                      {language === 'uk' ? 'Інгредієнти:' : 'Ingredients:'}
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {(language === 'uk' ? recipe.ingredients_uk : recipe.ingredients_en)
                        .slice(0, 3)
                        .map((ingredient, i) => (
                        <li key={i} className="text-xs">• {ingredient}</li>
                      ))}
                      {(language === 'uk' ? recipe.ingredients_uk : recipe.ingredients_en).length > 3 && (
                        <li className="text-xs text-primary">
                          +{(language === 'uk' ? recipe.ingredients_uk : recipe.ingredients_en).length - 3} {language === 'uk' ? 'більше' : 'more'}
                        </li>
                      )}
                    </ul>
                  </div>

                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {language === 'uk' ? 'Переглянути рецепт' : 'View Recipe'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional sections */}
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
                {language === 'uk' ? 'Купити креветки' : 'Buy Prawns'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk' 
                  ? 'Замовте свіжі креветки для приготування цих страв'
                  : 'Order fresh prawns to cook these dishes'
                }
              </p>
              <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                {language === 'uk' ? 'До магазину' : 'Go to Shop'} <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50" onClick={() => onNavigate?.('gallery')}>
            <CardContent className="p-8 text-center">
              <Images size={48} className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold mb-3">
                {language === 'uk' ? 'Галерея страв' : 'Dish Gallery'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk' 
                  ? 'Подивіться фото готових страв з наших креветок'
                  : 'See photos of dishes made with our prawns'
                }
              </p>
              <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                {language === 'uk' ? 'Переглянути' : 'View Gallery'} <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}