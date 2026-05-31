import { NextResponse } from "next/server"
import { z } from "zod"

import { getQuizMeta, listQuizScores, quizExists, saveQuizScore } from "@/lib/quiz-db"

const scoreInputSchema = z.object({
  nickname: z.string().trim().min(1).max(20),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
})

type RouteContext = {
  params: Promise<{ quizId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { quizId } = await context.params
    if (!quizExists(quizId)) {
      return NextResponse.json({ message: "퀴즈를 찾을 수 없습니다." }, { status: 404 })
    }

    const scores = listQuizScores(quizId)
    return NextResponse.json(scores)
  } catch (error) {
    console.error("Failed to fetch quiz scores", error)
    return NextResponse.json({ message: "랭킹을 불러오지 못했습니다." }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { quizId } = await context.params
    if (!quizExists(quizId)) {
      return NextResponse.json({ message: "퀴즈를 찾을 수 없습니다." }, { status: 404 })
    }

    const body = await request.json()
    const parsed = scoreInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "입력값이 올바르지 않습니다." }, { status: 400 })
    }

    const { nickname, score, totalQuestions } = parsed.data
    const quiz = getQuizMeta(quizId)
    if (!quiz) {
      return NextResponse.json({ message: "퀴즈를 찾을 수 없습니다." }, { status: 404 })
    }

    if (score > totalQuestions || totalQuestions > quiz.questionCount) {
      return NextResponse.json({ message: "점수 정보가 올바르지 않습니다." }, { status: 400 })
    }

    saveQuizScore({ quizId, nickname, score, totalQuestions })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to save quiz score", error)
    return NextResponse.json({ message: "랭킹 저장에 실패했습니다." }, { status: 500 })
  }
}
