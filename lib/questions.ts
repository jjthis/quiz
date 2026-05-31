export type QuizQuestion = {
  clue: string
  answer: string
  options: string[]
  difficulty: "easy" | "medium" | "hard"
}

export type QuizDefinition = {
  id: string
  title: string
  description: string
  questions: QuizQuestion[]
}

export type QuizMeta = {
  id: string
  title: string
  description: string
  questionCount: number
}

/** 이전 버전에서 사용하던 알고리즘 샘플 퀴즈 ID */
export const LEGACY_QUIZ_IDS = ["algorithm-meme", "algorithm-classic", "algorithm-tags"] as const

const WORLD_CAPITALS_QUESTIONS: QuizQuestion[] = [
  {
    clue: "프랑스의 수도는?",
    answer: "파리",
    options: ["파리", "리옹", "마르세유", "보르도"],
    difficulty: "easy",
  },
  {
    clue: "일본의 수도는?",
    answer: "도쿄",
    options: ["도쿄", "오사카", "교토", "요코하마"],
    difficulty: "easy",
  },
  {
    clue: "태국의 수도는?",
    answer: "방콕",
    options: ["방콕", "치엔마이", "푸켓", "치앙라이"],
    difficulty: "easy",
  },
  {
    clue: "브라질의 수도는?",
    answer: "브라질리아",
    options: ["브라질리아", "상파울루", "리우데자네이루", "살바도르"],
    difficulty: "medium",
  },
  {
    clue: "캐나다의 수도는?",
    answer: "오타와",
    options: ["오타와", "토론토", "밴쿠버", "몬트리올"],
    difficulty: "medium",
  },
  {
    clue: "이집트의 수도는?",
    answer: "카이로",
    options: ["카이로", "알렉산드리아", "룩소르", "기자"],
    difficulty: "easy",
  },
  {
    clue: "터키의 수도는?",
    answer: "앙카라",
    options: ["앙카라", "이스탄불", "이즈미르", "안탈리아"],
    difficulty: "medium",
  },
  {
    clue: "스위스의 수도는?",
    answer: "베른",
    options: ["베른", "취리히", "제네바", "로잔"],
    difficulty: "hard",
  },
  {
    clue: "뉴질랜드의 수도는?",
    answer: "웰링턴",
    options: ["웰링턴", "오클랜드", "크라이스트처치", "해밀턴"],
    difficulty: "medium",
  },
  {
    clue: "대한민국의 수도는?",
    answer: "서울",
    options: ["서울", "부산", "대구", "인천"],
    difficulty: "easy",
  },
]

const GENERAL_KNOWLEDGE_QUESTIONS: QuizQuestion[] = [
  {
    clue: "지구에서 가장 큰 대륙은?",
    answer: "아시아",
    options: ["아시아", "아프리카", "북아메리카", "유럽"],
    difficulty: "easy",
  },
  {
    clue: "1년은 보통 며칠인가?",
    answer: "365일",
    options: ["365일", "360일", "366일", "364일"],
    difficulty: "easy",
  },
  {
    clue: "태양계에서 가장 큰 행성은?",
    answer: "목성",
    options: ["목성", "토성", "해왕성", "지구"],
    difficulty: "easy",
  },
  {
    clue: "물의 화학식은?",
    answer: "H2O",
    options: ["H2O", "CO2", "O2", "NaCl"],
    difficulty: "easy",
  },
  {
    clue: "피라미드로 유명한 고대 문명의 나라는?",
    answer: "이집트",
    options: ["이집트", "그리스", "로마", "페르시아"],
    difficulty: "easy",
  },
  {
    clue: "올림픽 개최 주기는?",
    answer: "4년",
    options: ["4년", "2년", "3년", "5년"],
    difficulty: "easy",
  },
  {
    clue: "인간의 정상 체온(섭씨)에 가장 가까운 값은?",
    answer: "37도",
    options: ["37도", "35도", "39도", "41도"],
    difficulty: "medium",
  },
  {
    clue: "세계에서 가장 긴 강(일반적으로 알려진)은?",
    answer: "나일강",
    options: ["나일강", "아마존강", "양쯔강", "미시시피강"],
    difficulty: "medium",
  },
  {
    clue: "UN 본부가 있는 도시는?",
    answer: "뉴욕",
    options: ["뉴욕", "워싱턴 D.C.", "제네바", "파리"],
    difficulty: "medium",
  },
  {
    clue: "광합성에 필요한 기체 중 식물이 흡수하는 것은?",
    answer: "이산화탄소",
    options: ["이산화탄소", "질소", "수소", "헬륨"],
    difficulty: "medium",
  },
]

const FOOD_TRIVIA_QUESTIONS: QuizQuestion[] = [
  {
    clue: "이탈리아의 대표적인 치즈 토핑 피자 이름은?",
    answer: "마르게리타",
    options: ["마르게리타", "페퍼로니", "하와이안", "고르곤졸라"],
    difficulty: "easy",
  },
  {
    clue: "초밥의 밥에 넣는 대표적인 양념은?",
    answer: "초",
    options: ["초", "간장", "설탕", "소금"],
    difficulty: "medium",
  },
  {
    clue: "스페인의 대표적인 냄비 요리로 쌀과 해산물이 들어가는 음식은?",
    answer: "파에야",
    options: ["파에야", "타코", "리조또", "카레"],
    difficulty: "medium",
  },
  {
    clue: "한국의 발효 채소 반찬으로 배추를 주재료로 쓰는 것은?",
    answer: "김치",
    options: ["김치", "된장", "고추장", "절임"],
    difficulty: "easy",
  },
  {
    clue: "커피의 원두는 어떤 식물의 씨앗인가?",
    answer: "커피나무",
    options: ["커피나무", "코코아", "차나무", "올리브"],
    difficulty: "easy",
  },
  {
    clue: "프랑스의 버터 풍미가 강한 크로와상과 함께 자주 마시는 음료는?",
    answer: "커피",
    options: ["커피", "맥주", "와인", "사이다"],
    difficulty: "easy",
  },
  {
    clue: "멕시코의 옥수수빵으로 고기나 채소를 넣어 먹는 음식은?",
    answer: "타코",
    options: ["타코", "부리토", "나초", "퀘사디야"],
    difficulty: "easy",
  },
  {
    clue: "일본의 대표적인 미소 국물 요리는?",
    answer: "된장국",
    options: ["된장국", "김치국", "미소국", "라면"],
    difficulty: "medium",
  },
  {
    clue: "초콜릿의 원료가 되는 나무의 씨앗은?",
    answer: "카카오",
    options: ["카카오", "커피", "바닐라", "아몬드"],
    difficulty: "easy",
  },
  {
    clue: "그릭 요거트의 특징으로 맞는 것은?",
    answer: "농도가 진하다",
    options: ["농도가 진하다", "매우 단맛이 강하다", "항상 냉동이다", "콜라로 만든다"],
    difficulty: "medium",
  },
]

export const QUIZ_REGISTRY: Record<string, QuizDefinition> = {
  "world-capitals": {
    id: "world-capitals",
    title: "세계 수도 퀴즈",
    description: "나라 이름을 보고 수도를 맞혀보세요.",
    questions: WORLD_CAPITALS_QUESTIONS,
  },
  "general-knowledge": {
    id: "general-knowledge",
    title: "상식 퀴즈",
    description: "일상에서 자주 접하는 상식 문제입니다.",
    questions: GENERAL_KNOWLEDGE_QUESTIONS,
  },
  "food-trivia": {
    id: "food-trivia",
    title: "음식 퀴즈",
    description: "전 세계 음식과 재료에 관한 문제입니다.",
    questions: FOOD_TRIVIA_QUESTIONS,
  },
}

export const DEFAULT_QUIZ_ID = "world-capitals"

/** @deprecated QUIZ_REGISTRY[DEFAULT_QUIZ_ID].questions 사용 */
export const QUESTION_BANK = WORLD_CAPITALS_QUESTIONS

export function getQuizById(quizId: string): QuizDefinition | undefined {
  return QUIZ_REGISTRY[quizId]
}

export function getAllQuizMeta(): QuizMeta[] {
  return Object.values(QUIZ_REGISTRY).map(({ id, title, description, questions }) => ({
    id,
    title,
    description,
    questionCount: questions.length,
  }))
}

export function getQuizQuestionCount(quizId: string): number {
  return QUIZ_REGISTRY[quizId]?.questions.length ?? 0
}
