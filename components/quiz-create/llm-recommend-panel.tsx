"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Wand2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type QuizQuestionInput,
  QUIZ_STYLE_LABELS,
  type RecommendQuizInput,
} from "@/lib/quiz-schema"
import { cn } from "@/lib/utils"

type RecommendPanelProps = {
  onAddSelected: (questions: QuizQuestionInput[]) => void
  existingAnswers: string[]
}

const STYLE_OPTIONS: RecommendQuizInput["style"][] = ["meme", "classic", "tags"]
const COUNT_OPTIONS = [3, 5, 8] as const

export function LlmRecommendPanel({ onAddSelected, existingAnswers }: RecommendPanelProps) {
  const [topic, setTopic] = useState("")
  const [style, setStyle] = useState<RecommendQuizInput["style"]>("meme")
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<QuizQuestionInput[]>([])
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set())
  const [model, setModel] = useState<string | null>(null)

  const selectedCount = selectedIndexes.size

  const toggleSelection = (index: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIndexes(new Set(recommendations.map((_, index) => index)))
  }

  const clearSelection = () => {
    setSelectedIndexes(new Set())
  }

  const handleRecommend = async () => {
    const safeTopic = topic.trim()
    if (!safeTopic || loading) return

    try {
      setLoading(true)
      setError(null)
      setRecommendations([])
      setSelectedIndexes(new Set())
      setModel(null)

      const response = await fetch("/api/quizzes/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: safeTopic,
          style,
          count,
          existingAnswers,
        }),
      })

      const payload = (await response.json()) as {
        message?: string
        questions?: QuizQuestionInput[]
        model?: string
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "AI 추천 생성에 실패했습니다.")
      }

      setRecommendations(payload.questions ?? [])
      setModel(payload.model ?? null)
      setSelectedIndexes(new Set((payload.questions ?? []).map((_, index) => index)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 추천 생성에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddSelected = () => {
    const selected = recommendations.filter((_, index) => selectedIndexes.has(index))
    if (!selected.length) return
    onAddSelected(selected)
    setRecommendations([])
    setSelectedIndexes(new Set())
  }

  const styleHint = useMemo(() => QUIZ_STYLE_LABELS[style], [style])

  return (
    <Card className="overflow-hidden border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-violet-600 text-white">
            <Sparkles className="size-5" />
          </div>
          <div>
            <CardTitle className="text-xl">AI 문제 추천</CardTitle>
            <p className="text-sm text-slate-600">OpenRouter LLM으로 문제를 생성하고 선택해 추가하세요.</p>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit rounded-full">
          {styleHint}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">주제 / 프롬프트</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 세계 수도, K-POP 가수, 영화 OST, 역사 인물..."
            rows={3}
            className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">스타일</p>
            <div className="grid gap-2">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStyle(option)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm transition",
                    style === option
                      ? "border-violet-500 bg-violet-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-violet-300",
                  )}
                >
                  {QUIZ_STYLE_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">생성 개수</p>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={count === option ? "default" : "outline"}
                  className={cn(
                    "flex-1 rounded-full",
                    count === option && "bg-violet-600 hover:bg-violet-600/90",
                  )}
                  onClick={() => setCount(option)}
                >
                  {option}개
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="button"
          className="h-11 w-full rounded-full bg-violet-600 hover:bg-violet-600/90"
          disabled={!topic.trim() || loading}
          onClick={handleRecommend}
        >
          <Wand2 className="size-4" />
          {loading ? "AI가 문제를 생성하는 중..." : "AI 추천 받기"}
        </Button>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        {loading && (
          <div className="space-y-2 rounded-2xl border border-violet-100 bg-white/80 p-4">
            <div className="h-2 animate-pulse rounded-full bg-violet-100" />
            <div className="h-2 w-4/5 animate-pulse rounded-full bg-violet-100" />
            <div className="h-2 w-3/5 animate-pulse rounded-full bg-violet-100" />
            <p className="text-xs text-slate-500">모델이 JSON 형식의 문제를 작성하고 있습니다...</p>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-700">
                추천 결과 {recommendations.length}개
                {model && <span className="ml-2 font-normal text-slate-500">({model})</span>}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={selectAll}>
                  전체 선택
                </Button>
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={clearSelection}>
                  선택 해제
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {recommendations.map((question, index) => {
                const selected = selectedIndexes.has(index)
                return (
                  <motion.button
                    key={`${question.answer}-${index}`}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => toggleSelection(index)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      selected
                        ? "border-violet-500 bg-violet-50 shadow-sm ring-2 ring-violet-200"
                        : "border-slate-200 bg-white hover:border-violet-300",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        {question.difficulty}
                      </Badge>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          selected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {selected ? "선택됨" : "클릭하여 선택"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-800">{question.clue}</p>
                    <p className="mt-2 text-sm font-semibold text-violet-700">정답: {question.answer}</p>
                    <div className="mt-3 grid gap-1 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <span
                          key={option}
                          className={cn(
                            "rounded-lg px-2 py-1 text-xs",
                            option === question.answer
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-50 text-slate-600",
                          )}
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>

      {recommendations.length > 0 && (
        <CardFooter className="border-t border-violet-100 bg-white/70">
          <Button
            type="button"
            className="h-11 w-full rounded-full bg-slate-900 hover:bg-slate-800"
            disabled={selectedCount === 0}
            onClick={handleAddSelected}
          >
            선택한 {selectedCount}개 문제 추가하기
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
