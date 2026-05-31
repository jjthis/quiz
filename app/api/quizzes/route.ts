import { NextResponse } from "next/server"
import { z } from "zod"

import { createQuiz, listQuizzes } from "@/lib/quiz-db"
import { createQuizSchema } from "@/lib/quiz-schema"

export async function GET() {
  try {
    const quizzes = listQuizzes()
    return NextResponse.json(quizzes)
  } catch (error) {
    console.error("Failed to fetch quizzes", error)
    return NextResponse.json({ message: "퀴즈 목록을 불러오지 못했습니다." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createQuizSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "입력값이 올바르지 않습니다." }, { status: 400 })
    }

    const quiz = createQuiz(parsed.data)
    return NextResponse.json(quiz, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "QUIZ_EXISTS") {
      return NextResponse.json({ message: "이미 존재하는 퀴즈 ID입니다." }, { status: 409 })
    }

    console.error("Failed to create quiz", error)
    return NextResponse.json({ message: "퀴즈 생성에 실패했습니다." }, { status: 500 })
  }
}
