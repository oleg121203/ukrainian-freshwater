import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, ChefHat, Heart, ShoppingCart, Images, ArrowRight, Robot } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKV } from '@/hooks/useKV'

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

// AI-generated recipe interface
interface AIRecipe {
  id: string
  title: string
  ingredients: string[]
  instructions: string[]
  authorName: string
  authorEmail: string
  createdAt: string
  aiGenerated: boolean
}

interface RecipesSectionProps {
  onNavigate?: (section: string) => void
}

export function RecipesSection({ onNavigate }: RecipesSectionProps) {
  const { language } = useLanguage()
  const [favoriteRecipes, setFavoriteRecipes] = useKV<string[]>('favorite-recipes', [])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [aiRecipes] = useKV<AIRecipe[]>('chef-prawn-recipes', [])

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
    { key: 'salad', label_uk: 'Салати', label_en: 'Salads' },
    { key: 'ai-generated', label_uk: '🤖 ШІ-рецепти', label_en: '🤖 AI Recipes' }
  ]

  const filteredRecipes = selectedCategory === 'all' 
    ? recipes 
    : selectedCategory === 'ai-generated'
      ? []  // AI recipes will be shown separately
      : recipes.filter(recipe => recipe.category === selectedCategory)

  const filteredAIRecipes = selectedCategory === 'all' || selectedCategory === 'ai-generated'
    ? aiRecipes
    : []

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

        {/* AI-Generated Recipes */}
        {filteredAIRecipes.length > 0 && (
          <>
            <motion.div
              className="mt-12 mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Robot size={32} className="text-primary" />
                <h3 className="text-2xl font-bold text-gradient-primary">
                  {language === 'uk' ? 'Рецепти створені ШІ-кухарем' : 'AI Chef Created Recipes'}
                </h3>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {filteredAIRecipes.length} {language === 'uk' ? 'рецептів' : 'recipes'}
                </Badge>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAIRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 h-full relative overflow-hidden">
                    {/* AI Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        🤖 ШІ
                      </Badge>
                    </div>

                    <div className="text-6xl text-center pt-8 pb-4 group-hover:scale-110 transition-transform duration-300">
                      🦐
                    </div>

                    <CardContent className="p-6 pt-0">
                      <h3 className="text-lg font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {recipe.title}
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ChefHat size={16} />
                            <span>{recipe.authorName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {language === 'uk' ? 'Інгредієнти:' : 'Ingredients:'}
                          </h4>
                          <ul className="text-sm space-y-1">
                            {recipe.ingredients.slice(0, 3).map((ingredient, i) => (
                              <li key={i} className="flex items-center text-muted-foreground">
                                <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                                {ingredient}
                              </li>
                            ))}
                            {recipe.ingredients.length > 3 && (
                              <li className="text-xs text-primary">
                                +{recipe.ingredients.length - 3} {language === 'uk' ? 'більше' : 'more'}
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground mb-2">
                            {language === 'uk' ? 'Автор:' : 'Author:'} {recipe.authorName}
                          </p>
                          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {language === 'uk' ? 'Переглянути рецепт' : 'View Recipe'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Show message if no AI recipes when AI category is selected */}
        {selectedCategory === 'ai-generated' && filteredAIRecipes.length === 0 && (
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="p-12 border-dashed border-2">
              <Robot size={64} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-muted-foreground">
                {language === 'uk' ? 'Поки що немає ШІ-рецептів' : 'No AI recipes yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {language === 'uk' 
                  ? 'Поверніться до 3D креветки та зіграйте в кулінарну гру, щоб створити перший рецепт!'
                  : 'Return to the 3D prawn and play the cooking game to create your first recipe!'
                }
              </p>
              <Button 
                onClick={() => onNavigate?.('hero')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                🤖 {language === 'uk' ? 'Грати з ШІ-кухарем' : 'Play with AI Chef'}
              </Button>
            </Card>
          </motion.div>
        )}

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