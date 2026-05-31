"use client"

import { QuizEditor } from "@/components/quiz-create/quiz-editor"
import { SiteHeader } from "@/components/site-header"

export default function CreateQuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-violet-50/40">
      <SiteHeader active="create" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
        <QuizEditor mode="create" />
      </main>
    </div>
  )
}
