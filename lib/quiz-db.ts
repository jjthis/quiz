import type Database from "better-sqlite3"

import {
  type QuizMeta,
  type QuizQuestion,
} from "@/lib/questions"
import { getDb } from "@/lib/db"

export type DbQuiz = {
  id: string
  title: string
  description: string
  createdAt: string
  questionCount: number
}

export type DbQuestion = QuizQuestion & {
  id: number
  sortOrder: number
}

export type DbQuizScore = {
  id: number
  quizId: string
  nickname: string
  score: number
  totalQuestions: number
  accuracy: number
  createdAt: string
}

type QuizRow = {
  id: string
  title: string
  description: string
  created_at: string
}

type QuestionRow = {
  id: number
  quiz_id: string
  clue: string
  answer: string
  options: string
  difficulty: "easy" | "medium" | "hard"
  sort_order: number
}

type ScoreRow = {
  id: number
  quiz_id: string
  nickname: string
  score: number
  total_questions: number
  accuracy: number
  created_at: string
}

const mapQuestionRow = (row: QuestionRow): DbQuestion => ({
  id: row.id,
  sortOrder: row.sort_order,
  clue: row.clue,
  answer: row.answer,
  options: JSON.parse(row.options) as string[],
  difficulty: row.difficulty,
})


export function listQuizzes(): DbQuiz[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT q.id, q.title, q.description, q.created_at,
              COUNT(qu.id) AS question_count
       FROM quizzes q
       LEFT JOIN questions qu ON qu.quiz_id = q.id
       GROUP BY q.id
       ORDER BY q.created_at ASC`,
    )
    .all() as (QuizRow & { question_count: number })[]

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    questionCount: row.question_count,
  }))
}

export function getQuizMeta(quizId: string): (DbQuiz & { questionCount: number }) | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT q.id, q.title, q.description, q.created_at,
              COUNT(qu.id) AS question_count
       FROM quizzes q
       LEFT JOIN questions qu ON qu.quiz_id = q.id
       WHERE q.id = ?
       GROUP BY q.id`,
    )
    .get(quizId) as (QuizRow & { question_count: number }) | undefined

  if (!row) return null

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    questionCount: row.question_count,
  }
}

export function getQuizQuestions(quizId: string): DbQuestion[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT id, quiz_id, clue, answer, options, difficulty, sort_order
       FROM questions
       WHERE quiz_id = ?
       ORDER BY sort_order ASC, id ASC`,
    )
    .all(quizId) as QuestionRow[]

  return rows.map(mapQuestionRow)
}

export function createQuiz(input: {
  id: string
  title: string
  description: string
  questions: QuizQuestion[]
}): DbQuiz {
  const db = getDb()
  const existing = db.prepare(`SELECT id FROM quizzes WHERE id = ?`).get(input.id)
  if (existing) {
    throw new Error("QUIZ_EXISTS")
  }

  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (id, title, description)
    VALUES (?, ?, ?)
  `)
  const insertQuestion = db.prepare(`
    INSERT INTO questions (quiz_id, clue, answer, options, difficulty, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const createTransaction = db.transaction(() => {
    insertQuiz.run(input.id, input.title, input.description)
    input.questions.forEach((question, index) => {
      insertQuestion.run(
        input.id,
        question.clue,
        question.answer,
        JSON.stringify(question.options),
        question.difficulty,
        index,
      )
    })
  })

  createTransaction()

  const quiz = getQuizMeta(input.id)
  if (!quiz) throw new Error("QUIZ_CREATE_FAILED")
  return quiz
}

export function updateQuiz(
  quizId: string,
  input: {
    title: string
    description: string
    questions: QuizQuestion[]
  },
): DbQuiz {
  const db = getDb()
  if (!quizExists(quizId)) {
    throw new Error("QUIZ_NOT_FOUND")
  }

  const updateQuizRow = db.prepare(`
    UPDATE quizzes
    SET title = ?, description = ?
    WHERE id = ?
  `)
  const deleteQuestions = db.prepare(`DELETE FROM questions WHERE quiz_id = ?`)
  const insertQuestion = db.prepare(`
    INSERT INTO questions (quiz_id, clue, answer, options, difficulty, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const updateTransaction = db.transaction(() => {
    updateQuizRow.run(input.title, input.description, quizId)
    deleteQuestions.run(quizId)
    input.questions.forEach((question, index) => {
      insertQuestion.run(
        quizId,
        question.clue,
        question.answer,
        JSON.stringify(question.options),
        question.difficulty,
        index,
      )
    })
  })

  updateTransaction()

  const quiz = getQuizMeta(quizId)
  if (!quiz) throw new Error("QUIZ_UPDATE_FAILED")
  return quiz
}

export function saveQuizScore(input: {
  quizId: string
  nickname: string
  score: number
  totalQuestions: number
}) {
  const accuracy = Number(((input.score / input.totalQuestions) * 100).toFixed(2))
  const db = getDb()
  db.prepare(
    `INSERT INTO quiz_scores (quiz_id, nickname, score, total_questions, accuracy)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(input.quizId, input.nickname, input.score, input.totalQuestions, accuracy)
}

export function listQuizScores(quizId: string, limit = 20): DbQuizScore[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT id, quiz_id, nickname, score, total_questions, accuracy, created_at
       FROM quiz_scores
       WHERE quiz_id = ?
       ORDER BY score DESC, accuracy DESC, created_at ASC
       LIMIT ?`,
    )
    .all(quizId, limit) as ScoreRow[]

  return rows.map((row) => ({
    id: row.id,
    quizId: row.quiz_id,
    nickname: row.nickname,
    score: row.score,
    totalQuestions: row.total_questions,
    accuracy: Number(row.accuracy),
    createdAt: row.created_at,
  }))
}

export function quizExists(quizId: string): boolean {
  const db = getDb()
  const row = db.prepare(`SELECT id FROM quizzes WHERE id = ?`).get(quizId)
  return Boolean(row)
}

export function deleteQuiz(quizId: string) {
  const db = getDb()
  const result = db.prepare(`DELETE FROM quizzes WHERE id = ?`).run(quizId)
  if (result.changes === 0) {
    throw new Error("QUIZ_NOT_FOUND")
  }
}

export function toQuizMetaList(quizzes: (DbQuiz & { questionCount: number })[]): QuizMeta[] {
  return quizzes.map(({ id, title, description, questionCount }) => ({
    id,
    title,
    description,
    questionCount,
  }))
}
