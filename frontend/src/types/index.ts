export type MediaType = 'image' | 'video' | 'thumbnail'

export interface ProjectMedia {
  id: string
  type: MediaType
  src: string
  sortOrder: number
}

export interface StatBox {
  value: string
  label: string
}

export interface Project {
  id: string
  slug: string
  name: string
  location: string
  kw: number
  date: string
  description: string
  about: string
  specs: string[]
  highlights: string[]
  statBoxes: StatBox[]
  category: string | null
  published: boolean
  instagramMediaId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  media: ProjectMedia[]
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  coverImage: string | null
  published: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Reference {
  id: string
  name: string
  logo: string | null
  sortOrder: number
  createdAt: string
}

export interface Faq {
  id: string
  question: string
  answer: string
  sortOrder: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRating {
  id: string
  rating: number
  messageCount: number
  conversation: ChatMessage[] | null
  createdAt: string
}

export interface ChatRatingStats {
  total: number
  average: number
  counts: Record<1 | 2 | 3 | 4 | 5, number>
}

export interface ChatLead {
  id: string
  sessionId: string
  conversation: ChatMessage[] | null
  messageCount: number
  status: 'active' | 'whatsapp'
  rating: number | null
  createdAt: string
  updatedAt: string
}

export interface ChatLeadStats {
  total: number
  active: number
  whatsapp: number
}

export interface ChatFunnel {
  days: number
  opened: number
  messaged: number
  whatsapp: number
  rated: number
}

export interface AppLog {
  id: string
  level: 'error' | 'warn'
  context: string | null
  message: string
  createdAt: string
}

export interface LogStats {
  total: number
  errors24h: number
  warns24h: number
}

export interface SyncStatus {
  running: boolean
  lastRun: string | null
  lastResult: { imported: number; skipped: number } | null
  lastError: string | null
}
