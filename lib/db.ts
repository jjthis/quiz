import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"

import { seedBuiltInQuizzes } from "@/lib/seed-quizzes"

const canWriteDbFile = (dbPath: string) => {
  const dir = path.dirname(dbPath)

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (fs.existsSync(dbPath)) {
      fs.accessSync(dbPath, fs.constants.W_OK)
      return true
    }

    fs.writeFileSync(dbPath, "", { flag: "a" })
    return true
  } catch {
    return false
  }
}

const getDbPath = () => {
  const candidates: string[] = []

  if (process.env.SQLITE_DB_PATH) {
    candidates.push(process.env.SQLITE_DB_PATH)
  }

  if (process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    candidates.push(path.join("/tmp", "rankings.db"))
  }

  candidates.push(path.join(process.cwd(), "data", "rankings.db"))

  for (const candidate of candidates) {
    if (canWriteDbFile(candidate)) {
      return candidate
    }
  }

  throw new Error("No writable path found for SQLite database.")
}

declare global {
  var __sqliteDb: Database.Database | undefined
}

const migrateLegacyRankings = (db: Database.Database) => {
  const tableInfo = db.prepare(`PRAGMA table_info(rankings)`).all() as { name: string }[]
  if (tableInfo.length === 0) return

  const hasQuizId = tableInfo.some((column) => column.name === "quiz_id")
  if (!hasQuizId) {
    db.exec(`ALTER TABLE rankings ADD COLUMN quiz_id TEXT NOT NULL DEFAULT 'world-capitals'`)
  }

  db.exec(`
    INSERT OR IGNORE INTO quiz_scores (quiz_id, nickname, score, total_questions, accuracy, created_at)
    SELECT quiz_id, nickname, score, total_questions, accuracy, created_at
    FROM rankings
    WHERE NOT EXISTS (
      SELECT 1 FROM quiz_scores qs
      WHERE qs.quiz_id = rankings.quiz_id
        AND qs.nickname = rankings.nickname
        AND qs.score = rankings.score
        AND qs.total_questions = rankings.total_questions
        AND qs.created_at = rankings.created_at
    )
  `)
}

const initialize = (db: Database.Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      clue TEXT NOT NULL,
      answer TEXT NOT NULL,
      options TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_questions_quiz
    ON questions(quiz_id, sort_order);

    CREATE TABLE IF NOT EXISTS quiz_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      nickname TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_quiz_scores_ranking
    ON quiz_scores(quiz_id, score DESC, accuracy DESC, created_at ASC);

    CREATE TABLE IF NOT EXISTS rankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_rankings_score
    ON rankings(score DESC, accuracy DESC, created_at ASC);
  `)

  seedBuiltInQuizzes(db)
  migrateLegacyRankings(db)
}

export const getDb = () => {
  if (!global.__sqliteDb) {
    const dbPath = getDbPath()
    global.__sqliteDb = new Database(dbPath)
    initialize(global.__sqliteDb)
  }

  return global.__sqliteDb
}
