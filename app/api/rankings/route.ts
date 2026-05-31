import { NextResponse } from "next/server"
import { z } from "zod"

import { DEFAULT_QUIZ_ID } from "@/lib/questions"
import { listQuizScores, quizExists, saveQuizScore } from "@/lib/quiz-db"

const rankingInputSchema = z.object({
  nickname: z.string().trim().min(1).max(20),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  quizId: z.string().trim().min(1).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get("quizId") ?? DEFAULT_QUIZ_ID

    if (!quizExists(quizId)) {
      return NextResponse.json({ message: "퀴즈를 찾을 수 없습니다." }, { status: 404 })
    }

    const scores = listQuizScores(quizId)
    return NextResponse.json(scores)
  } catch (error) {
    console.error("Failed to fetch rankings", error)
    return NextResponse.json({ message: "랭킹을 불러오지 못했습니다." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = rankingInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "입력값이 올바르지 않습니다." }, { status: 400 })
    }

    const { nickname, score, totalQuestions, quizId = DEFAULT_QUIZ_ID } = parsed.data
    if (!quizExists(quizId)) {
      return NextResponse.json({ message: "퀴즈를 찾을 수 없습니다." }, { status: 404 })
    }

    saveQuizScore({ quizId, nickname, score, totalQuestions })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to save ranking", error)
    return NextResponse.json({ message: "랭킹 저장에 실패했습니다." }, { status: 500 })
  }
}
