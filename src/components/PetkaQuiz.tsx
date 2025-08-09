import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface PetkaQuizProps {
  isOpen: boolean
  onClose: () => void
  onPassed: () => void
  requiredCorrect?: number
}

type Q = {
  q: string
  options: string[]
  correctIndex: number
}

export function PetkaQuiz({ isOpen, onClose, onPassed, requiredCorrect = 3 }: PetkaQuizProps) {
  const questions = useMemo<Q[]>(
    () => [
      {
        q: 'Скільки ніг у креветки?',
        options: ['4', '6', '10'],
        correctIndex: 2,
      },
      {
        q: 'Що креветка робить хвостом під час плавання?',
        options: ['Гальмує', 'Рухається вперед', 'Сигналізує іншим'],
        correctIndex: 1,
      },
      {
        q: 'Який інгредієнт найкраще підкреслює смак креветки?',
        options: ['Цукор', 'Лимонний сік', 'Какао'],
        correctIndex: 1,
      },
      {
        q: 'Скільки солі потрібно додати зазвичай?',
        options: ['Трохи, за смаком', 'Пів склянки', 'Не солити'],
        correctIndex: 0,
      },
      {
        q: 'Що з наведеного — трава?',
        options: ['Базилік', 'Перець', 'Борошно'],
        correctIndex: 0,
      },
    ],
    []
  )

  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1))
  const [submitted, setSubmitted] = useState(false)

  const correctCount = answers.reduce((acc, a, i) => acc + (a === questions[i].correctIndex ? 1 : 0), 0)
  const passed = correctCount >= requiredCorrect

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white/95 border rounded-xl shadow-2xl w-full max-w-xl p-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">🤖 Петька: кулінарний квіз</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>Закрити</Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Дайте мінімум {requiredCorrect} правильних відповідей, щоб розблокувати приготування рецепту.</p>

            <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
              {questions.map((item, idx) => (
                <div key={idx} className="p-3 rounded-md bg-white/80 border">
                  <p className="font-medium mb-2">{idx + 1}. {item.q}</p>
                  <div className="grid gap-2">
                    {item.options.map((opt, oi) => (
                      <label key={oi} className={`flex items-center gap-2 text-sm p-2 rounded border cursor-pointer ${answers[idx] === oi ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'}`}>
                        <input
                          type="radio"
                          name={`q-${idx}`}
                          className="accent-primary"
                          checked={answers[idx] === oi}
                          onChange={() => setAnswers(prev => prev.map((v, i) => (i === idx ? oi : v)))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  {submitted && (
                    <p className={`text-xs mt-2 ${answers[idx] === item.correctIndex ? 'text-green-600' : 'text-red-600'}`}>
                      {answers[idx] === item.correctIndex ? 'Правильно' : 'Неправильно'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm">Результат: <span className="font-semibold">{correctCount}</span> / {questions.length}</p>
              {!submitted ? (
                <Button onClick={() => setSubmitted(true)}>Перевірити</Button>
              ) : passed ? (
                <Button onClick={() => { onPassed(); onClose(); }}>Розблокувати рецепт</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setAnswers(Array(questions.length).fill(-1)); setSubmitted(false); }}>Спробувати знову</Button>
                  <Button onClick={() => setSubmitted(false)}>Змінити відповіді</Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PetkaQuiz
