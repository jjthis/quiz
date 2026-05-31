"use client"

import { Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type QuizDifficulty, type QuizQuestionInput } from "@/lib/quiz-schema"
import { cn } from "@/lib/utils"

type QuestionFormCardProps = {
  index: number
  question: QuizQuestionInput
  onChange: (next: QuizQuestionInput) => void
  onRemove: () => void
  canRemove: boolean
}

const DIFFICULTY_OPTIONS: QuizDifficulty[] = ["easy", "medium", "hard"]

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"

export function QuestionFormCard({
  index,
  question,
  onChange,
  onRemove,
  canRemove,
}: QuestionFormCardProps) {
  const updateOption = (optionIndex: number, value: string) => {
    const nextOptions = [...question.options]
    nextOptions[optionIndex] = value
    onChange({ ...question, options: nextOptions })
  }

  const addOption = () => {
    if (question.options.length >= 8) return
    onChange({ ...question, options: [...question.options, ""] })
  }

  const removeOption = (optionIndex: number) => {
    if (question.options.length <= 2) return
    onChange({
      ...question,
      options: question.options.filter((_, idx) => idx !== optionIndex),
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <Badge variant="outline" className="rounded-full">
            문제 {index + 1}
          </Badge>
          <CardTitle className="text-base">문항 편집</CardTitle>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">문제 / 힌트</label>
          <textarea
            value={question.clue}
            onChange={(e) => onChange({ ...question, clue: e.target.value })}
            rows={3}
            placeholder="문제 설명을 입력하세요"
            className={inputClassName}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">정답</label>
            <input
              value={question.answer}
              onChange={(e) => onChange({ ...question, answer: e.target.value })}
              placeholder="정답"
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">난이도</label>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => onChange({ ...question, difficulty })}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-2 text-xs font-medium capitalize transition",
                    question.difficulty === difficulty
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400",
                  )}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">보기 (options)</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={question.options.length >= 8}
              onClick={addOption}
            >
              <Plus className="size-3.5" />
              보기 추가
            </Button>
          </div>
          <div className="grid gap-2">
            {question.options.map((option, optionIndex) => {
              const isCorrect = option.trim() === question.answer.trim() && option.trim().length > 0
              return (
                <div key={optionIndex} className="flex items-center gap-2">
                  <input
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    placeholder={`보기 ${optionIndex + 1}`}
                    className={cn(
                      inputClassName,
                      isCorrect && "border-emerald-400 bg-emerald-50/60",
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="shrink-0 rounded-full"
                    disabled={question.options.length <= 2}
                    onClick={() => removeOption(optionIndex)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-500">정답과 일치하는 보기는 초록색으로 표시됩니다.</p>
        </div>
      </CardContent>
    </Card>
  )
}
