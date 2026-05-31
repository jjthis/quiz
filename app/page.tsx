"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Pencil } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { QuizQuestion } from "@/lib/questions"
import { cn } from "@/lib/utils"

type SelectedCount = 5 | 10 | 20 | "all"

type QuizListItem = {
  id: string
  title: string
  description: string
  questionCount: number
}

type RankingItem = {
  id: number
  quizId: string
  nickname: string
  score: number
  totalQuestions: number
  accuracy: number
  createdAt: string
}

const COUNT_OPTIONS: SelectedCount[] = [5, 10, 20, "all"]

const shuffle = <T,>(arr: T[]) => {
  const cloned = [...arr]
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cloned[i], cloned[j]] = [cloned[j], cloned[i]]
  }
  return cloned
}

export default function Home() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])
  const [quizzesLoading, setQuizzesLoading] = useState(true)
  const [quizzesError, setQuizzesError] = useState<string | null>(null)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedCount, setSelectedCount] = useState<SelectedCount>(10)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [gameFinished, setGameFinished] = useState(false)
  const [nickname, setNickname] = useState("")
  const [isSavingRank, setIsSavingRank] = useState(false)
  const [rankSaved, setRankSaved] = useState(false)
  const [rankingError, setRankingError] = useState<string | null>(null)
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [isStartingGame, setIsStartingGame] = useState(false)

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === selectedQuizId) ?? null,
    [quizzes, selectedQuizId],
  )

  const currentQuestion = quizQuestions[currentQuestionIndex]
  const progress = useMemo(() => {
    if (!quizQuestions.length) return 0
    return ((currentQuestionIndex + 1) / quizQuestions.length) * 100
  }, [currentQuestionIndex, quizQuestions.length])

  const fetchQuizzes = useCallback(async () => {
    try {
      setQuizzesLoading(true)
      setQuizzesError(null)
      const response = await fetch("/api/quizzes", { cache: "no-store" })
      if (!response.ok) throw new Error("failed")
      const data = (await response.json()) as QuizListItem[]
      setQuizzes(data)
      setSelectedQuizId((prev) => prev ?? data[0]?.id ?? null)
    } catch {
      setQuizzesError("퀴즈 목록을 불러오지 못했습니다. DB 연결을 확인해주세요.")
    } finally {
      setQuizzesLoading(false)
    }
  }, [])

  const startGame = async (count: SelectedCount) => {
    if (!selectedQuizId) return

    try {
      setIsStartingGame(true)
      setRankingError(null)
      const response = await fetch(`/api/quizzes/${selectedQuizId}`, { cache: "no-store" })
      if (!response.ok) throw new Error("퀴즈를 불러오지 못했습니다.")

      const data = (await response.json()) as {
        questions: QuizQuestion[]
      }

      const pool = shuffle(data.questions)
      const pickedQuestions =
        count === "all" ? pool : pool.slice(0, Math.min(count, pool.length))
      const nextQuestions = pickedQuestions.map((question) => ({
        clue: question.clue,
        answer: question.answer,
        difficulty: question.difficulty,
        options: shuffle(question.options),
      }))

      setQuizQuestions(nextQuestions)
      setGameStarted(true)
      setCurrentQuestionIndex(0)
      setScore(0)
      setSelectedOption(null)
      setShowAnswer(false)
      setGameFinished(false)
      setNickname("")
      setIsSavingRank(false)
      setRankSaved(false)
      setRankingError(null)
    } catch (error) {
      setRankingError(error instanceof Error ? error.message : "게임을 시작하지 못했습니다.")
    } finally {
      setIsStartingGame(false)
    }
  }

  const handleSelectOption = (option: string) => {
    if (!currentQuestion || showAnswer) return

    setSelectedOption(option)
    setShowAnswer(true)
    if (option === currentQuestion.answer) {
      setScore((prev) => prev + 1)
    }
  }

  const goNextQuestion = useCallback(() => {
    if (!quizQuestions.length) return
    const isLast = currentQuestionIndex >= quizQuestions.length - 1

    if (isLast) {
      setGameFinished(true)
      return
    }

    setCurrentQuestionIndex((prev) => prev + 1)
    setSelectedOption(null)
    setShowAnswer(false)
  }, [currentQuestionIndex, quizQuestions.length])

  const resetToSettings = () => {
    setGameStarted(false)
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedOption(null)
    setShowAnswer(false)
    setQuizQuestions([])
    setGameFinished(false)
    setNickname("")
    setIsSavingRank(false)
    setRankSaved(false)
    setRankingError(null)
    setRankings([])
  }

  const fetchRankings = useCallback(async () => {
    if (!selectedQuizId) return

    try {
      const response = await fetch(`/api/quizzes/${selectedQuizId}/scores`, { cache: "no-store" })
      if (!response.ok) throw new Error("failed")
      const data = (await response.json()) as RankingItem[]
      setRankings(data)
    } catch {
      setRankingError("랭킹을 불러오지 못했습니다. DB 연결을 확인해주세요.")
    }
  }, [selectedQuizId])

  const submitRanking = async () => {
    const safeNickname = nickname.trim()
    if (!safeNickname || rankSaved || isSavingRank || !quizQuestions.length || !selectedQuizId) return

    try {
      setIsSavingRank(true)
      setRankingError(null)
      const response = await fetch(`/api/quizzes/${selectedQuizId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: safeNickname,
          score,
          totalQuestions: quizQuestions.length,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(payload?.message ?? "랭킹 저장 실패")
      }

      setRankSaved(true)
      await fetchRankings()
    } catch (error) {
      setRankingError(error instanceof Error ? error.message : "랭킹 저장에 실패했습니다.")
    } finally {
      setIsSavingRank(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [fetchQuizzes])

  useEffect(() => {
    if (!showAnswer || gameFinished) return

    const timer = setTimeout(() => {
      goNextQuestion()
    }, 1000)

    return () => clearTimeout(timer)
  }, [showAnswer, gameFinished, goNextQuestion])

  useEffect(() => {
    if (!gameFinished) return
    fetchRankings()
  }, [gameFinished, fetchRankings])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      <SiteHeader active="home" />
      <main className="px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!gameStarted && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <Card className="w-full border-slate-200 shadow-xl">
                <CardHeader className="space-y-3">
                  <Badge className="w-fit rounded-full bg-slate-900 text-white">Quiz Hub</Badge>
                  <CardTitle className="text-2xl leading-tight sm:text-3xl">
                    퀴즈를 선택하고 시작하세요
                  </CardTitle>
                  <p className="text-sm text-slate-600 sm:text-base">
                    퀴즈마다 별도의 랭킹이 저장됩니다. 원하는 퀴즈를 고른 뒤 문제 수를 선택하세요.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-700">퀴즈 선택</p>
                    {quizzesLoading ? (
                      <p className="text-sm text-slate-500">퀴즈 목록 불러오는 중...</p>
                    ) : quizzesError ? (
                      <div className="space-y-2">
                        <p className="text-sm text-rose-600">{quizzesError}</p>
                        <Button variant="outline" className="rounded-full" onClick={fetchQuizzes}>
                          다시 시도
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {quizzes.map((quiz) => {
                          const selected = selectedQuizId === quiz.id
                          return (
                            <div
                              key={quiz.id}
                              className={cn(
                                "rounded-2xl border transition-all",
                                selected
                                  ? "border-slate-900 bg-slate-900 text-white shadow-md"
                                  : "border-slate-200 bg-white",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedQuizId(quiz.id)}
                                className="w-full px-4 py-4 text-left"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <p className="text-base font-semibold">{quiz.title}</p>
                                    <p
                                      className={cn(
                                        "text-sm",
                                        selected ? "text-slate-200" : "text-slate-600",
                                      )}
                                    >
                                      {quiz.description}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={selected ? "secondary" : "outline"}
                                    className="shrink-0 rounded-full"
                                  >
                                    {quiz.questionCount}문항
                                  </Badge>
                                </div>
                              </button>
                              <div
                                className={cn(
                                  "flex justify-end border-t px-4 py-2",
                                  selected ? "border-slate-700" : "border-slate-100",
                                )}
                              >
                                <Link
                                  href={`/edit/${quiz.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className={cn(
                                    buttonVariants({ variant: "outline", size: "sm" }),
                                    "rounded-full",
                                    selected && "border-slate-600 bg-slate-800 text-white hover:bg-slate-700",
                                  )}
                                >
                                  <Pencil className="size-3.5" />
                                  수정
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-700">문제 수 선택</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {COUNT_OPTIONS.map((count) => {
                        const label = count === "all" ? "All" : `${count}`
                        const selected = selectedCount === count
                        const maxCount = selectedQuiz?.questionCount ?? 0
                        const disabled =
                          count !== "all" && typeof count === "number" && count > maxCount

                        return (
                          <Button
                            key={label}
                            variant={selected ? "default" : "outline"}
                            disabled={disabled || !selectedQuizId}
                            className={cn(
                              "h-11 rounded-full text-base transition-all",
                              selected && "shadow-md",
                            )}
                            onClick={() => setSelectedCount(count)}
                          >
                            {label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {rankingError && !gameStarted && (
                    <p className="text-sm text-rose-600">{rankingError}</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="h-11 w-full rounded-full text-base"
                    disabled={!selectedQuizId || quizzesLoading || isStartingGame}
                    onClick={() => startGame(selectedCount)}
                  >
                    {isStartingGame ? "퀴즈 불러오는 중..." : "게임 시작"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {gameStarted && !gameFinished && currentQuestion && (
            <motion.div
              key={`quiz-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <Card className="w-full border-slate-200 shadow-xl">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                    <Badge variant="outline" className="rounded-full">
                      {selectedQuiz?.title ?? "Quiz"}
                    </Badge>
                    <span>
                      {currentQuestionIndex + 1} / {quizQuestions.length}
                    </span>
                    <span>점수: {score}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <Badge variant="secondary" className="w-fit rounded-full">
                    {currentQuestion.difficulty}
                  </Badge>
                  <CardTitle className="text-lg leading-relaxed sm:text-xl">
                    {currentQuestion.clue}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOption === option
                    const isCorrect = option === currentQuestion.answer
                    const shouldHighlightWrong = showAnswer && isSelected && !isCorrect
                    const shouldHighlightCorrect = showAnswer && isCorrect

                    return (
                      <motion.div
                        key={option}
                        animate={shouldHighlightCorrect ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          variant="outline"
                          disabled={showAnswer}
                          onClick={() => handleSelectOption(option)}
                          className={cn(
                            "h-auto min-h-12 w-full justify-start rounded-2xl px-4 py-3 text-left text-sm whitespace-normal sm:text-base",
                            showAnswer && "opacity-100",
                            shouldHighlightCorrect &&
                              "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
                            shouldHighlightWrong &&
                              "border-rose-500 bg-rose-50 text-rose-700 hover:bg-rose-50",
                          )}
                        >
                          {option}
                        </Button>
                      </motion.div>
                    )
                  })}
                </CardContent>

                <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-medium text-slate-700">
                    {showAnswer ? (
                      selectedOption === currentQuestion.answer ? (
                        <span className="text-emerald-600">정답!</span>
                      ) : (
                        <span className="text-rose-600">
                          오답! 정답: <strong>{currentQuestion.answer}</strong>
                        </span>
                      )
                    ) : (
                      <span className="text-slate-500">보기를 선택하면 즉시 채점됩니다.</span>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={goNextQuestion}
                    disabled={!showAnswer}
                  >
                    다음 문제
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {gameStarted && gameFinished && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <Card className="w-full border-slate-200 shadow-xl">
                <CardHeader className="space-y-2">
                  <Badge className="w-fit rounded-full bg-emerald-600 text-white">Game Finished</Badge>
                  <CardTitle className="text-2xl sm:text-3xl">{selectedQuiz?.title ?? "결과"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-slate-700">
                  <p className="text-lg font-semibold">
                    {score} / {quizQuestions.length} 정답
                  </p>
                  <p className="text-base">
                    정확도 {Math.round((score / Math.max(quizQuestions.length, 1)) * 100)}%
                  </p>
                  <div className="space-y-2 pt-3">
                    <p className="text-sm font-semibold text-slate-700">닉네임 등록</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="닉네임 (최대 20자)"
                        maxLength={20}
                        className="h-10 flex-1 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none ring-0 transition focus:border-slate-500"
                        disabled={isSavingRank || rankSaved}
                      />
                      <Button
                        onClick={submitRanking}
                        disabled={!nickname.trim() || isSavingRank || rankSaved}
                        className="rounded-full"
                      >
                        {rankSaved ? "등록 완료" : isSavingRank ? "저장 중..." : "랭킹 등록"}
                      </Button>
                    </div>
                  </div>
                  {rankingError && <p className="text-sm text-rose-600">{rankingError}</p>}
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-semibold text-slate-700">
                      {selectedQuiz?.title ?? "퀴즈"} 랭킹 TOP 20
                    </p>
                    <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                      {rankings.length === 0 ? (
                        <p className="text-sm text-slate-500">아직 등록된 기록이 없습니다.</p>
                      ) : (
                        rankings.map((rank, index) => (
                          <div
                            key={rank.id}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                          >
                            <span className="font-semibold">
                              #{index + 1} {rank.nickname}
                            </span>
                            <span className="text-slate-700">
                              {rank.score}/{rank.totalQuestions} ({Math.round(rank.accuracy)}%)
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    className="rounded-full"
                    disabled={isStartingGame}
                    onClick={() => startGame(selectedCount)}
                  >
                    다시 시작
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={resetToSettings}>
                    퀴즈 선택으로
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </main>
    </div>
  )
}
