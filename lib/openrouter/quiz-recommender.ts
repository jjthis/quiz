import {
  type QuizQuestionInput,
  type RecommendQuizInput,
  QUIZ_STYLE_LABELS,
  recommendedQuestionsSchema,
} from "@/lib/quiz-schema"
import { getOpenRouterClient, getOpenRouterModel } from "@/lib/openrouter/client"

const STYLE_INSTRUCTIONS: Record<RecommendQuizInput["style"], string> = {
  meme:
    "Write clues as dense, formal prose that describes the answer obliquely without naming it directly. Use the same language as the topic when natural.",
  classic:
    "Write clues as clear, detailed descriptions with precise vocabulary. The answer should be inferable from context alone.",
  tags:
    "Write clues as concise hints in the same language as the topic. Keep each clue short and focused on one distinguishing trait.",
}

function buildRecommendPrompt(input: RecommendQuizInput): string {
  const avoidList =
    input.existingAnswers && input.existingAnswers.length > 0
      ? `\nDo NOT reuse these answers: ${input.existingAnswers.join(", ")}`
      : ""

  return `You generate multiple-choice quiz questions for a general-purpose quiz app.

Topic: ${input.topic}
Style: ${QUIZ_STYLE_LABELS[input.style]}
Instructions: ${STYLE_INSTRUCTIONS[input.style]}
Count: ${input.count}${avoidList}

Return ONLY a JSON object with this exact shape:
{
  "questions": [
    {
      "clue": "string",
      "answer": "string",
      "options": ["string", "string", "string", "string"],
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Rules:
- Each question must have exactly 4 distinct options including the correct answer.
- difficulty must reflect actual challenge level.
- No markdown, no commentary, no code fences.`
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() ?? trimmed

  const start = candidate.indexOf("{")
  const end = candidate.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response did not contain JSON")
  }

  return JSON.parse(candidate.slice(start, end + 1))
}

export type RecommendQuestionsResult = {
  questions: QuizQuestionInput[]
  model: string
  rawText: string
}

export async function recommendQuizQuestions(
  input: RecommendQuizInput,
): Promise<RecommendQuestionsResult> {
  const openrouter = getOpenRouterClient()
  const model = getOpenRouterModel()

  const response = await openrouter.chat.send({
    chatRequest: {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a precise quiz authoring assistant. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: buildRecommendPrompt(input),
        },
      ],
      stream: false,
    },
  })

  const rawText = response.choices[0]?.message?.content?.trim() ?? ""
  if (!rawText) {
    throw new Error("LLM returned an empty response")
  }

  const parsedJson = extractJsonObject(rawText)
  const parsed = recommendedQuestionsSchema.safeParse(parsedJson)
  if (!parsed.success) {
    throw new Error("LLM response did not match the expected quiz schema")
  }

  return {
    questions: parsed.data.questions,
    model,
    rawText,
  }
}

export async function* streamRecommendQuizQuestions(
  input: RecommendQuizInput,
): AsyncGenerator<{ type: "delta"; text: string } | { type: "done"; result: RecommendQuestionsResult }> {
  const openrouter = getOpenRouterClient()
  const model = getOpenRouterModel()

  const stream = await openrouter.chat.send({
    chatRequest: {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a precise quiz authoring assistant. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: buildRecommendPrompt(input),
        },
      ],
      stream: true,
    },
  })

  let rawText = ""
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      rawText += content
      yield { type: "delta", text: content }
    }
  }

  const parsedJson = extractJsonObject(rawText)
  const parsed = recommendedQuestionsSchema.safeParse(parsedJson)
  if (!parsed.success) {
    throw new Error("LLM response did not match the expected quiz schema")
  }

  yield {
    type: "done",
    result: {
      questions: parsed.data.questions,
      model,
      rawText,
    },
  }
}
