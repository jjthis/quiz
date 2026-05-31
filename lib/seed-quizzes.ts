import type Database from "better-sqlite3"

import { LEGACY_QUIZ_IDS, QUIZ_REGISTRY, type QuizDefinition } from "@/lib/questions"

export function removeLegacyQuizzes(db: Database.Database) {
  const deleteQuiz = db.prepare(`DELETE FROM quizzes WHERE id = ?`)
  for (const id of LEGACY_QUIZ_IDS) {
    deleteQuiz.run(id)
  }
}

export function seedBuiltInQuizzes(db: Database.Database) {
  removeLegacyQuizzes(db)

  const upsertQuiz = db.prepare(`
    INSERT INTO quizzes (id, title, description)
    VALUES (@id, @title, @description)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description
  `)
  const countQuestions = db.prepare(`SELECT COUNT(*) AS count FROM questions WHERE quiz_id = ?`)
  const insertQuestion = db.prepare(`
    INSERT INTO questions (quiz_id, clue, answer, options, difficulty, sort_order)
    VALUES (@quizId, @clue, @answer, @options, @difficulty, @sortOrder)
  `)

  const seedTransaction = db.transaction((quiz: QuizDefinition) => {
    upsertQuiz.run({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
    })

    const existing = countQuestions.get(quiz.id) as { count: number }
    if (existing.count > 0) return

    quiz.questions.forEach((question, index) => {
      insertQuestion.run({
        quizId: quiz.id,
        clue: question.clue,
        answer: question.answer,
        options: JSON.stringify(question.options),
        difficulty: question.difficulty,
        sortOrder: index,
      })
    })
  })

  for (const quiz of Object.values(QUIZ_REGISTRY)) {
    seedTransaction(quiz)
  }
}
