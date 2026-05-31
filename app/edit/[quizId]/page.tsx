"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { QuizEditor } from "@/components/quiz-create/quiz-editor"
import { SiteHeader } from "@/components/site-header"
import { Button, buttonVariants } from "@/components/ui/button"
import type { QuizQuestionInput } from "@/lib/quiz-schema"
import { cn } from "@/lib/utils"

type QuizDetail = {
  id: string
  title: string
  description: string
  questions: QuizQuestionInput[]
}

export default function EditQuizPage() {
  const params = useParams<{ quizId: string }>()
  const quizId = params.quizId

  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuiz = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/quizzes/${quizId}`, { cache: "no-store" })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(payload?.message ?? "퀴즈를 불러오지 못했습니다.")
      }
      const data = (await response.json()) as QuizDetail
      setQuiz(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "퀴즈를 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50/30">
      <SiteHeader active="manage" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-600">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">퀴즈 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-sm text-rose-600">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full" onClick={fetchQuiz}>
                다시 시도
              </Button>
              <Link href="/manage" className={cn(buttonVariants(), "rounded-full")}>
                퀴즈 관리로
              </Link>
            </div>
          </div>
        ) : quiz ? (
          <QuizEditor
            mode="edit"
            quizId={quiz.id}
            initialTitle={quiz.title}
            initialDescription={quiz.description}
            initialQuestions={quiz.questions}
          />
        ) : null}
      </main>
    </div>
  )
}
