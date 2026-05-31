import { NextResponse } from "next/server"
import { z } from "zod"

import { isOpenRouterConfigured, recommendQuizQuestions } from "@/lib/openrouter"
import { recommendQuizSchema } from "@/lib/quiz-schema"

export async function POST(request: Request) {
  try {
    if (!isOpenRouterConfigured()) {
      return NextResponse.json(
        { message: "OPENROUTER_API_KEY가 설정되지 않았습니다." },
        { status: 503 },
      )
    }

    const body = await request.json()
    const parsed = recommendQuizSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "입력값이 올바르지 않습니다." }, { status: 400 })
    }

    const result = await recommendQuizQuestions(parsed.data)
    return NextResponse.json({
      questions: result.questions,
      model: result.model,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "입력값이 올바르지 않습니다." }, { status: 400 })
    }

    console.error("Failed to recommend quiz questions", error)
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "AI 추천 생성에 실패했습니다.",
      },
      { status: 500 },
    )
  }
}
