"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, Plus, Save } from "lucide-react"

import { LlmRecommendPanel } from "@/components/quiz-create/llm-recommend-panel"
import { QuestionFormCard } from "@/components/quiz-create/question-form-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  emptyQuestion,
  isQuestionComplete,
  normalizeQuestion,
  slugifyQuizId,
  type QuizQuestionInput,
} from "@/lib/quiz-schema"
import { cn } from "@/lib/utils"

type QuizEditorProps = {
  mode: "create" | "edit"
  quizId?: string
  initialTitle?: string
  initialDescription?: string
  initialQuestions?: QuizQuestionInput[]
}

export function QuizEditor({
  mode,
  quizId: fixedQuizId,
  initialTitle = "",
  initialDescription = "",
  initialQuestions,
}: QuizEditorProps) {
  const router = useRouter()
  const isEdit = mode === "edit"

  const [quizId, setQuizId] = useState(fixedQuizId ?? "")
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [idTouched, setIdTouched] = useState(isEdit)
  const [questions, setQuestions] = useState<QuizQuestionInput[]>(
    initialQuestions?.length ? initialQuestions : [emptyQuestion()],
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const existingAnswers = useMemo(
    () => questions.map((question) => question.answer.trim()).filter(Boolean),
    [questions],
  )

  const validQuestions = useMemo(
    () =>
      questions
        .map(normalizeQuestion)
        .filter((question): question is QuizQuestionInput => question !== null),
    [questions],
  )

  const canSubmit =
    (isEdit ? Boolean(fixedQuizId) : quizId.trim().length >= 2) &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    validQuestions.length > 0 &&
    !submitting

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!idTouched && !isEdit) {
      setQuizId(slugifyQuizId(value))
    }
  }

  const updateQuestion = (index: number, next: QuizQuestionInput) => {
    setQuestions((prev) => prev.map((question, idx) => (idx === index ? next : question)))
  }

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index))
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()])
  }

  const addRecommendedQuestions = (recommended: QuizQuestionInput[]) => {
    setQuestions((prev) => {
      const normalized = recommended
        .map(normalizeQuestion)
        .filter((question): question is QuizQuestionInput => question !== null)

      const hasOnlyEmptyDraft =
        prev.length === 1 &&
        !prev[0].clue.trim() &&
        !prev[0].answer.trim() &&
        prev[0].options.every((option) => !option.trim())

      if (hasOnlyEmptyDraft) return normalized
      return [...prev, ...normalized]
    })
    setSuccessMessage(`${recommended.length}개의 AI 추천 문제를 추가했습니다.`)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    try {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)

      const payload = {
        title: title.trim(),
        description: description.trim(),
        questions: validQuestions,
      }

      const response = await fetch(
        isEdit ? `/api/quizzes/${fixedQuizId}` : "/api/quizzes",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit ? payload : { id: quizId.trim(), ...payload },
          ),
        },
      )

      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        throw new Error(result.message ?? (isEdit ? "퀴즈 수정에 실패했습니다." : "퀴즈 생성에 실패했습니다."))
      }

      setSuccessMessage(
        isEdit ? "퀴즈가 수정되었습니다. 홈으로 이동합니다..." : "퀴즈가 생성되었습니다. 홈으로 이동합니다...",
      )
      setTimeout(() => router.push("/"), 900)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "퀴즈 수정에 실패했습니다."
            : "퀴즈 생성에 실패했습니다.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-2"
      >
        <Badge className={cn("rounded-full text-white", isEdit ? "bg-amber-600" : "bg-violet-600")}>
          {isEdit ? "Edit Quiz" : "Create Quiz"}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {isEdit ? "퀴즈 수정" : "새 퀴즈 만들기"}
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
          {isEdit
            ? "제목, 설명, 문제를 수정한 뒤 저장하세요. 퀴즈 ID는 변경할 수 없습니다."
            : "직접 문제를 작성하거나 AI 추천을 받아 선택한 뒤, 보기와 정답을 수정해 퀴즈를 완성하세요."}
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle>퀴즈 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">제목</label>
                <input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="예: 세계 수도 퀴즈"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">퀴즈 ID</label>
                <input
                  value={isEdit ? fixedQuizId : quizId}
                  onChange={(e) => {
                    setIdTouched(true)
                    setQuizId(e.target.value)
                  }}
                  placeholder="world-capitals-quiz"
                  disabled={isEdit}
                  className={cn(
                    "h-11 w-full rounded-2xl border border-slate-200 px-4 font-mono text-sm outline-none focus:border-slate-500",
                    isEdit && "cursor-not-allowed bg-slate-100 text-slate-500",
                  )}
                />
                <p className="text-xs text-slate-500">
                  {isEdit ? "퀴즈 ID는 수정할 수 없습니다." : "소문자, 숫자, 하이픈만 사용 가능합니다."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="퀴즈에 대한 간단한 설명"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>
            </CardContent>
          </Card>

          <LlmRecommendPanel
            onAddSelected={addRecommendedQuestions}
            existingAnswers={existingAnswers}
          />
        </div>

        <div className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <Card className="border-slate-200 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>문제 목록</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    완성 {validQuestions.length} / {questions.length}문항
                  </p>
                </div>
                <Button type="button" variant="outline" className="rounded-full" onClick={addQuestion}>
                  <Plus className="size-4" />
                  문제 추가
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, index) => (
                  <QuestionFormCard
                    key={index}
                    index={index}
                    question={question}
                    onChange={(next) => updateQuestion(index, next)}
                    onRemove={() => removeQuestion(index)}
                    canRemove={questions.length > 1}
                  />
                ))}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 border-t border-slate-100">
                {successMessage && (
                  <div className="flex w-full items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2 className="size-4 shrink-0" />
                    {successMessage}
                  </div>
                )}
                {error && <p className="w-full text-sm text-rose-600">{error}</p>}
                <Button
                  type="button"
                  className={cn(
                    "h-12 w-full rounded-full text-base",
                    canSubmit ? (isEdit ? "bg-amber-600 hover:bg-amber-600/90" : "bg-slate-900 hover:bg-slate-800") : "",
                  )}
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  <Save className="size-4" />
                  {submitting
                    ? isEdit
                      ? "수정 저장 중..."
                      : "퀴즈 저장 중..."
                    : isEdit
                      ? "수정 저장"
                      : "퀴즈 생성하기"}
                </Button>
                <p className="text-center text-xs text-slate-500">
                  완성되지 않은 문항은 자동으로 제외됩니다.
                  {questions.some((question) => !isQuestionComplete(question)) &&
                    " 빈 문항이 있으면 저장되지 않습니다."}
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
