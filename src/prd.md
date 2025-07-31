# AquaFarm - Робот-Креветка Кухар з ШІ

## Core Purpose & Success

**Mission Statement**: Створити інтерактивний досвід фермерського господарства креветок з ігровим роботом-кухарем, що використовує ШІ для генерації персоналізованих рецептів на основі взаємодії користувача.

**Success Indicators**: 
- Користувачі проводять час в 3D візуалізації та грають в кулінарну гру
- Успішна генерація рецептів через ШІ
- Збереження та поширення рецептів серед користувачів
- Високий рівень залученості через інтерактивні елементи

**Experience Qualities**: Інноваційний, Інтерактивний, Освітній

## Project Classification & Approach

**Complexity Level**: Complex Application (advanced functionality, AI integration, game mechanics)

**Primary User Activity**: Creating and Interacting (AI recipe generation through game completion)

## Essential Features

### 3D Robot-Chef Prawn Visualization
- **What it does**: Інтерактивна 3D модель креветки, що трансформується в робота-кухаря
- **Why it matters**: Унікальний досвід, що поєднує освіту про креветки з ігровою механікою
- **Success criteria**: Плавна анімація, реагування на дії користувача, візуальна трансформація

### Cooking Game Mechanics
- **What it does**: Кулінарна вікторина про креветки та кулінарію
- **Why it matters**: Освітній контент з геймифікацією для залучення
- **Success criteria**: 3 правильні відповіді відкривають ШІ-генератор

### AI Recipe Generator
- **What it does**: Створює унікальні рецепти на базі Gemini API з користувацьких інгредієнтів
- **Why it matters**: Персоналізований контент, унікальна цінність
- **Success criteria**: Генерація якісних рецептів, збереження в базі

### Recipe Management System
- **What it does**: Зберігає ШІ-рецепти з підписом автора, надсилає на email
- **Why it matters**: Дозволяє користувачам зберігати та ділитися створеним контентом
- **Success criteria**: Збереження в локальній базі, функція "надіслати"

## Design Direction

### Visual Tone & Identity
**Emotional Response**: Захват від технологій, цікавість до кулінарії, гордість за створений контент
**Design Personality**: Футуристичний але дружній, високотехнологічний з природними елементами
**Visual Metaphors**: Робототехніка + природа, ШІ + кулінарія, інновації + традиції

### Color Strategy
**Color Scheme Type**: Analogous з акцентами (синьо-зелений з помаранчевими акцентами)
**Primary Color**: Глибокий морський синій (представляє воду та технології)
**Secondary Colors**: Аквамариновий (вода), срібло (робототехніка)
**Accent Color**: Помаранчевий (кулінарія, тепло)
**Robot Mode Colors**: Кібер-синій з емісивним свіченням

### Typography System
**Font Pairing Strategy**: Inter для UI + Merriweather для заголовків
**Robot Mode**: Додаткові технологічні акценти в типографіці

### Game UI Elements
**Robot Transformation**: Матеріали з металевим блиском та емісивними ефектами
**Game Interface**: Футуристичні картки з градієнтами та анімаціями
**AI Badges**: Спеціальні позначки для ШІ-контенту

## Implementation Features

### Interactive Game Flow
1. **Exploration Phase**: Звичайна креветка з автоматичним плаванням
2. **Robot Activation**: Кнопка "Кулінарна Гра" активує трансформацію
3. **Game Phase**: Питання про кулінарію та креветки
4. **AI Cooking Phase**: Користувач вводить інгредієнти для ШІ
5. **Recipe Creation**: Gemini API генерує персоналізований рецепт
6. **Sharing**: Збереження з підписом автора та надсилання

### Technical Integration
- **Gemini API**: Конфігурується через адмін-панель
- **Persistent Storage**: useKV для збереження рецептів та налаштувань
- **Real-time Animation**: Three.js з роботичними ефектами
- **Responsive Design**: Адаптивний інтерфейс для всіх пристроїв

### Admin Features
- API ключ конфігурація
- Статистика рецептів
- Перегляд створеного контенту

## Edge Cases & Problem Scenarios

**API Limitations**: Graceful fallback якщо немає API ключа
**Empty Ingredients**: Валідація вводу користувача
**Network Issues**: Індикатори завантаження та помилок
**Game State**: Збереження прогресу між сесіями

## Accessibility & Readability

**Sound Design**: Опціональні звукові ефекти з можливістю вимкнення
**Visual Feedback**: Чіткі індикатори стану гри та трансформації
**Input Validation**: Зрозумілі повідомлення про помилки
**Mobile Support**: Адаптивний дизайн для мобільних пристроїв

## Innovation Elements

**AI-Driven Content**: Унікальні рецепти створені на основі вподобань користувача
**3D Transformation**: Креветка трансформується в робота-кухаря
**Gamified Learning**: Освітній контент через гру
**Community Recipes**: ШІ-рецепти доступні всім користувачам
**Cross-Device Sharing**: Надсилання рецептів на email для доступу з будь-якого пристрою

## Success Metrics

- Кількість завершених ігор
- Кількість згенерованих рецептів
- Час, проведений в 3D режимі
- Кількість збережених рецептів
- Повторні відвідування для нових рецептів