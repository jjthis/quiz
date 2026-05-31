import { NextResponse } from "next/server"

import { deleteQuiz, getQuizMeta, getQuizQuestions, updateQuiz } from "@/lib/quiz-db"
import { updateQuizSchema } from "@/lib/quiz-schema"

type RouteContext = {
  params: Promise<{ quizId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { quizId } = await context.params
    const quiz = getQuizMeta(quizId)
    if (!quiz) {
      return NextResponse.json({ message: "퀴즈를 찾을 수 없습니다." }, { status: 404 })
    }

    const questions = getQuizQuestions(quizId).map(({ id, sortOrder, ...question }) => ({
      ...question,
      id,
      sortOrder,
    }))

    return NextResponse.json({ ...quiz, questions })
  } catch (error) {
    console.error("Failed to fetch quiz", error)
    return NextResponse.json({ message: "퀴즈를 불러오지 못했습니다." }, { status: 500 })
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { quizId } = await context.params
    const body = await request.json()
    const parsed = updateQuizSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "입력값이 올바르지 않습니다." }, { status: 400 })
    }

    const quiz = updateQuiz(quizId, parsed.data)
    return NextResponse.json(quiz)
  } catch (error) {
    if (error instanceof Error && error.message === "QUIZ_NOT_FOUND") {
      return NextResponse.json({ message: "퀴즈를 찾을 수 없습니다." }, { status: 404 })
    }

    console.error("Failed to update quiz", error)
    return NextResponse.json({ message: "퀴즈 수정에 실패했습니다." }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { quizId } = await context.params
    deleteQuiz(quizId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "QUIZ_NOT_FOUND") {
      return NextResponse.json({ message: "퀴즈를 찾을 수 없습니다." }, { status: 404 })
    }

    console.error("Failed to delete quiz", error)
    return NextResponse.json({ message: "퀴즈 삭제에 실패했습니다." }, { status: 500 })
  }
}
