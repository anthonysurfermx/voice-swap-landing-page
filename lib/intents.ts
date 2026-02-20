// Bilingual intent parser (EN/ES) with synonym matching

export type IntentType = 'SEARCH_MARKET' | 'PLACE_BET' | 'TRENDING' | 'UNKNOWN'

export interface ParsedIntent {
  type: IntentType
  query?: string
  amount?: number
  side?: 'Yes' | 'No'
  raw: string
}

// Synonym maps for fuzzy matching
const BET_WORDS = ['bet', 'bets', 'apuesta', 'apostar', 'puse', 'send', 'wager', 'put']
const YES_WORDS = ['yes', 'si', 'sí', 'yeah', 'yep', 'a favor', 'bull', 'bullish']
const NO_WORDS = ['no', 'nah', 'nope', 'en contra', 'bear', 'bearish', 'against']
const TRENDING_WORDS = ['trending', 'hot', 'popular', 'top', 'tendencia', 'populares', 'caliente']
const SEARCH_WORDS = ['odds', 'show', 'what about', 'que hay', 'como esta', 'cómo está', 'search', 'find', 'busca', 'muestra', 'probabilidades']

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[?¿!¡.,]/g, '')
    .trim()
}

function containsAny(text: string, words: string[]): boolean {
  return words.some(w => text.includes(w))
}

function extractAmount(text: string): number | undefined {
  // Match: $20, 20 usdc, 0.5 mon, 20, $0.01
  const match = text.match(/\$?([\d.]+)\s*(?:usdc|mon|usd|pesos)?/i)
  return match ? parseFloat(match[1]) : undefined
}

function extractSide(text: string): 'Yes' | 'No' | undefined {
  if (containsAny(text, YES_WORDS)) return 'Yes'
  if (containsAny(text, NO_WORDS)) return 'No'
  return undefined
}

function extractQuery(text: string): string {
  // Remove known command words to isolate the search query
  let cleaned = text
  const removeWords = [
    ...BET_WORDS, ...TRENDING_WORDS, ...SEARCH_WORDS,
    'on', 'the', 'me', 'de', 'los', 'las', 'el', 'la', 'hey', 'gemini',
    'what', 'are', 'whats', 'que', 'como', 'for',
  ]
  for (const w of removeWords) {
    cleaned = cleaned.replace(new RegExp(`\\b${w}\\b`, 'gi'), '')
  }
  return cleaned.replace(/\s+/g, ' ').trim()
}

export function parseIntent(rawText: string): ParsedIntent {
  const text = normalize(rawText)

  // Check for bet intent first (most specific)
  if (containsAny(text, BET_WORDS)) {
    return {
      type: 'PLACE_BET',
      amount: extractAmount(text),
      side: extractSide(text),
      raw: rawText,
    }
  }

  // Check for trending
  if (containsAny(text, TRENDING_WORDS)) {
    return { type: 'TRENDING', raw: rawText }
  }

  // Check for search
  if (containsAny(text, SEARCH_WORDS)) {
    return {
      type: 'SEARCH_MARKET',
      query: extractQuery(text),
      raw: rawText,
    }
  }

  // Default: treat as search query if there's meaningful text
  const query = extractQuery(text)
  if (query.length > 1) {
    return {
      type: 'SEARCH_MARKET',
      query,
      raw: rawText,
    }
  }

  return { type: 'UNKNOWN', raw: rawText }
}
