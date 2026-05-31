import { z } from "zod"

export const quizDifficultySchema = z.enum(["easy", "medium", "hard"])

export const quizQuestionSchema = z.object({
  clue: z.string().trim().min(1),
  answer: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).min(2).max(8),
  difficulty: quizDifficultySchema,
})

export const createQuizSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "id는 소문자, 숫자, 하이픈만 사용할 수 있습니다."),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  questions: z.array(quizQuestionSchema).min(1),
})

export const updateQuizSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  questions: z.array(quizQuestionSchema).min(1),
})

export const recommendQuizSchema = z.object({
  topic: z.string().trim().min(2).max(300),
  style: z.enum(["meme", "classic", "tags"]).default("meme"),
  count: z.number().int().min(1).max(10).default(5),
  existingAnswers: z.array(z.string()).max(200).optional(),
})

export const recommendedQuestionsSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1).max(10),
})

export type QuizDifficulty = z.infer<typeof quizDifficultySchema>
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>
export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>
export type RecommendQuizInput = z.infer<typeof recommendQuizSchema>

export const QUIZ_STYLE_LABELS: Record<RecommendQuizInput["style"], string> = {
  meme: "격식체 / 학술적 설명",
  classic: "상세 설명",
  tags: "짧은 힌트",
}

export const emptyQuestion = (): QuizQuestionInput => ({
  clue: "",
  answer: "",
  options: ["", "", "", ""],
  difficulty: "medium",
})

export function slugifyQuizId(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

export function normalizeQuestion(question: QuizQuestionInput): QuizQuestionInput | null {
  const parsed = quizQuestionSchema.safeParse({
    ...question,
    options: question.options.map((option) => option.trim()).filter(Boolean),
  })
  return parsed.success ? parsed.data : null
}

export function isQuestionComplete(question: QuizQuestionInput): boolean {
  return normalizeQuestion(question) !== null
}
