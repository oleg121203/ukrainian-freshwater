#!/bin/bash

echo "🔧 Починаю автоматичне виправлення коду..."

# Форматування коду
echo "📝 Форматування за допомогою Prettier..."
npx prettier --write "src/**/*.{ts,tsx,js,jsx}" --ignore-unknown

# Виправлення ESLint помилок
echo "🔍 Виправлення ESLint помилок..."
npx eslint . --fix --quiet

# Перевірка TypeScript
echo "🔧 Перевірка TypeScript..."
npx tsc --noEmit

echo "✅ Автоматичне виправлення завершено!"
