import { OpenRouter } from "@openrouter/sdk"

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-20b:free"

declare global {
  var __openRouterClient: OpenRouter | undefined
}

export function getOpenRouterClient(): OpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured")
  }

  if (!global.__openRouterClient) {
    global.__openRouterClient = new OpenRouter({ apiKey })
  }

  return global.__openRouterClient
}

export function getOpenRouterModel(): string {
  return DEFAULT_MODEL
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY)
}
