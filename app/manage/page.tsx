"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type QuizListItem = {
  id: string
  title: string
  description: string
  questionCount: number
}

export default function ManageQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/quizzes", { cache: "no-store" })
      if (!response.ok) throw new Error("failed")
      setQuizzes((await response.json()) as QuizListItem[])
    } catch {
      setError("퀴즈 목록을 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDelete = async (quiz: QuizListItem) => {
    const confirmed = window.confirm(
      `"${quiz.title}" 퀴즈를 삭제할까요?\n문제와 랭킹 기록도 함께 삭제됩니다.`,
    )
    if (!confirmed) return

    try {
      setDeletingId(quiz.id)
      setError(null)
      const response = await fetch(`/api/quizzes/${quiz.id}`, { method: "DELETE" })
      const payload = (await response.json().catch(() => null)) as { message?: string } | null
      if (!response.ok) {
        throw new Error(payload?.message ?? "퀴즈 삭제에 실패했습니다.")
      }
      setQuizzes((prev) => prev.filter((item) => item.id !== quiz.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "퀴즈 삭제에 실패했습니다.")
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [fetchQuizzes])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50">
      <SiteHeader active="manage" />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4"
        >
          <div className="space-y-2">
            <Badge className="rounded-full bg-amber-600 text-white">Manage</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">퀴즈 관리</h1>
            <p className="text-sm text-slate-600">
              퀴즈를 수정·삭제하거나 새 퀴즈를 만들 수 있습니다.
            </p>
          </div>
          <Link href="/create" className={cn(buttonVariants(), "rounded-full")}>
            <Plus className="size-4" />
            새 퀴즈
          </Link>
        </motion.div>

        <Card className="border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle>퀴즈 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && <p className="text-sm text-rose-600">{error}</p>}
            {loading ? (
              <p className="text-sm text-slate-500">불러오는 중...</p>
            ) : quizzes.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">등록된 퀴즈가 없습니다.</p>
                <Link href="/create" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
                  첫 퀴즈 만들기
                </Link>
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{quiz.title}</p>
                    <p className="text-sm text-slate-600">{quiz.description}</p>
                    <p className="font-mono text-xs text-slate-400">{quiz.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full">
                      {quiz.questionCount}문항
                    </Badge>
                    <Link
                      href={`/edit/${quiz.id}`}
                      className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                    >
                      <Pencil className="size-3.5" />
                      수정
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      disabled={deletingId === quiz.id}
                      onClick={() => handleDelete(quiz)}
                    >
                      <Trash2 className="size-3.5" />
                      {deletingId === quiz.id ? "삭제 중..." : "삭제"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
