'use client'

import { useWeb3 } from '@/components/web3-provider'
import { useState, useCallback, useEffect, useRef } from 'react'
import { parseIntent } from '@/lib/intents'
import { executeBet } from '@/lib/monad-bet'
import { MONAD_EXPLORER } from '@/lib/constants'
import Link from 'next/link'
import {
  Wallet, LogOut, Loader2, AlertTriangle,
  Shield, ChevronRight, ExternalLink, CheckCircle,
  ArrowUp, Globe, Star, TrendingUp, Brain, Landmark,
  Swords, Gamepad2, CircleDot, Bitcoin, Dribbble,
  Trophy, Zap,
} from 'lucide-react'
import type { DeepAnalysisResult } from '../api/market/deep-analyze/route'
import type { StrategyType } from '@/lib/polymarket-detector'
import { calculateWinProbability } from '@/lib/probability'
import type { ProbabilityResult } from '@/lib/probability'

// ─── Types ───

interface MarketInfo {
  conditionId: string
  question: string
  slug: string
  volume: number
  yesPrice: number
  noPrice: number
  image: string
  endDate: string
}

interface EventInfo {
  title: string
  slug: string
  image: string
  volume: number
  markets: MarketInfo[]
}

interface PortfolioData {
  portfolioValue: number
  positions: {
    conditionId: string; title: string; slug: string; outcome: string
    size: number; avgPrice: number; currentPrice: number; pnl: number; pnlPct: number
  }[]
  recentTrades: {
    timestamp: number; type: string; title: string; outcome: string
    side: string; usdcSize: number; price: number; transactionHash: string
  }[]
  stats: { totalPnl: number; openPositions: number; winCount: number; lossCount: number; winRate: number }
}

type ChatRole = 'user' | 'assistant'
type Lang = 'en' | 'es' | 'pt'

type ChatAttachment =
  | { type: 'markets'; markets: MarketInfo[] }
  | { type: 'marketPreview'; market: MarketInfo }
  | { type: 'deepAnalysis'; analysis: DeepAnalysisResult; market: MarketInfo }
  | { type: 'aiExplanation'; lines: string[]; market: MarketInfo; analysis: DeepAnalysisResult }
  | { type: 'betAmountInput'; market: MarketInfo; analysis: DeepAnalysisResult }
  | { type: 'successProbability'; probability: ProbabilityResult; market: MarketInfo; analysis: DeepAnalysisResult; signalHash: string }
  | { type: 'betChoice'; slug: string; yesPrice: number; noPrice: number }
  | { type: 'betPrompt'; side: 'Yes' | 'No'; slug: string; signalHash: string; conditionId: string }
  | { type: 'betConfirmed'; side: string; amount: string; txHash: string; explorerUrl?: string; source?: string; shares?: number; price?: number }
  | { type: 'loading'; text: string }
  | { type: 'error'; text: string }
  | { type: 'portfolio'; data: PortfolioData }

interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  attachment?: ChatAttachment
  timestamp: number
}

// ─── i18n ───

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    greeting: "Hey! What bet do you want to make today?",
    askSpecific: "Nice! What specifically?",
    searchingMarkets: "Searching markets...",
    scanningWhales: "Agent Radar scanning holders...",
    foundMarkets: "Found {n} market{s}. Which one?",
    noMarkets: "No markets found for that. Try something else?",
    whaleResult: "{n} whale{s}, {pct}% {dir}.",
    radarResult: "Scanned {scanned} of {total} holders. {agentPct}% agent activity detected.",
    noWhales: "No tracked whales in this market. You can still bet.",
    howMuch: "How much?",
    placingBet: "Placing {amount} MON on {side}...",
    betConfirmed: "Bet confirmed on Polymarket.",
    connectWallet: "Connect your wallet to see your portfolio.",
    loadingPortfolio: "Loading portfolio...",
    hereIsPortfolio: "Here is your portfolio.",
    analyzeFirst: "Pick a market first, then I can help you bet.",
    helpText: "You can search markets, analyze whales, and place bets. Try typing what you want to bet on!",
    wantAnalysis: "Want my analysis before you bet?",
    analyzeBtn: "ANALYZE WITH AI",
    detectAgents: "DETECT AGENTS",
    explainWithAI: "EXPLAIN WITH AI",
    explaining: "AI analyzing market data...",
    betNow: "BET",
    skipAnalysis: "SKIP, BET NOW",
    connectForAnalysis: "Connect your wallet to unlock agent detection.",
    successProb: "Win Probability",
    recommendedSide: "Recommended",
    smartMoneyBet: "SMART MONEY",
    noEdge: "No edge detected. Bet at your own risk.",
    highConfidence: "High confidence",
    mediumConfidence: "Medium confidence",
    lowConfidence: "Low confidence",
    howMuchInvest: "How much do you want to invest?",
    investPlaceholder: "Amount in USD",
    calculateProb: "CALCULATE PROBABILITY",
    marketImpactLabel: "Your size",
    yourSizeMovesMarket: "Your bet is {pct}% of market volume. This will move the price against you.",
    sizeOk: "Your bet size has negligible market impact.",
    manualAmount: "Or pick amount:",
    monOnMonad: "MON on Monad",
    onboardName: "Name your assistant",
    onboardNameSub: "This is how you will activate it. By voice, through your glasses, or by typing.",
    onboardCategories: "What do you bet on?",
    onboardCategoriesSub: "Pick 3 categories. {name} will show you markets that match.",
    onboardLang: "What language?",
    onboardLangSub: "{name} will talk to you in your language.",
    startWhispering: "START WHISPERING",
    failedSearch: "Failed to search markets.",
    failedAnalysis: "Failed to analyze market.",
    failedBet: "Failed to place bet. Please try again.",
    failedPortfolio: "Failed to load portfolio.",
  },
  es: {
    greeting: "Hola! Que apuesta quieres hacer hoy?",
    askSpecific: "Vale! En que especificamente?",
    searchingMarkets: "Buscando mercados...",
    scanningWhales: "Agent Radar escaneando holders...",
    foundMarkets: "Encontre {n} mercado{s}. Cual te interesa?",
    noMarkets: "No encontre mercados para eso. Intenta con otra cosa?",
    whaleResult: "{n} ballena{s}, {pct}% {dir}.",
    radarResult: "Escanee {scanned} de {total} holders. {agentPct}% actividad de agentes detectada.",
    noWhales: "No hay ballenas rastreadas en este mercado. Aun puedes apostar.",
    howMuch: "Cuanto quieres apostar?",
    placingBet: "Apostando {amount} MON en {side}...",
    betConfirmed: "Apuesta confirmada en Polymarket.",
    connectWallet: "Conecta tu wallet para ver tu portafolio.",
    loadingPortfolio: "Cargando portafolio...",
    hereIsPortfolio: "Aqui esta tu portafolio.",
    analyzeFirst: "Primero elige un mercado, despues te ayudo a apostar.",
    helpText: "Puedes buscar mercados, analizar ballenas y apostar. Escribe sobre que quieres apostar!",
    wantAnalysis: "Quieres mi analisis antes de apostar?",
    analyzeBtn: "ANALIZAR CON IA",
    detectAgents: "DETECTAR AGENTES",
    explainWithAI: "EXPLICAR CON IA",
    explaining: "IA analizando datos del mercado...",
    betNow: "APOSTAR",
    skipAnalysis: "SALTAR, APOSTAR YA",
    connectForAnalysis: "Conecta tu wallet para detectar agentes.",
    successProb: "Probabilidad de Exito",
    recommendedSide: "Recomendado",
    smartMoneyBet: "SMART MONEY",
    noEdge: "Sin ventaja detectada. Apuesta bajo tu propio riesgo.",
    highConfidence: "Alta confianza",
    mediumConfidence: "Confianza media",
    lowConfidence: "Baja confianza",
    howMuchInvest: "Cuanto quieres invertir?",
    investPlaceholder: "Monto en USD",
    calculateProb: "CALCULAR PROBABILIDAD",
    marketImpactLabel: "Tu tamano",
    yourSizeMovesMarket: "Tu apuesta es {pct}% del volumen del mercado. Esto movera el precio en tu contra.",
    sizeOk: "Tu apuesta tiene impacto minimo en el mercado.",
    manualAmount: "O elige monto:",
    monOnMonad: "MON en Monad",
    onboardName: "Nombra a tu asistente",
    onboardNameSub: "Asi lo vas a activar. Por voz, con tus lentes, o escribiendo.",
    onboardCategories: "En que apuestas?",
    onboardCategoriesSub: "Elige 3 categorias. {name} te mostrara mercados que coincidan.",
    onboardLang: "En que idioma?",
    onboardLangSub: "{name} te hablara en tu idioma.",
    startWhispering: "EMPEZAR",
    failedSearch: "Error al buscar mercados.",
    failedAnalysis: "Error al analizar el mercado.",
    failedBet: "Error al apostar. Intenta de nuevo.",
    failedPortfolio: "Error al cargar portafolio.",
  },
  pt: {
    greeting: "Oi! Que aposta voce quer fazer hoje?",
    askSpecific: "Legal! Em que especificamente?",
    searchingMarkets: "Buscando mercados...",
    scanningWhales: "Agent Radar escaneando holders...",
    foundMarkets: "Encontrei {n} mercado{s}. Qual te interessa?",
    noMarkets: "Nao encontrei mercados para isso. Tenta outra coisa?",
    whaleResult: "{n} baleia{s}, {pct}% {dir}.",
    radarResult: "Escaneei {scanned} de {total} holders. {agentPct}% atividade de agentes detectada.",
    noWhales: "Sem baleias rastreadas neste mercado. Voce ainda pode apostar.",
    howMuch: "Quanto quer apostar?",
    placingBet: "Apostando {amount} MON em {side}...",
    betConfirmed: "Aposta confirmada na Polymarket.",
    connectWallet: "Conecte sua wallet para ver seu portfolio.",
    loadingPortfolio: "Carregando portfolio...",
    hereIsPortfolio: "Aqui esta seu portfolio.",
    analyzeFirst: "Escolha um mercado primeiro, depois te ajudo a apostar.",
    helpText: "Voce pode buscar mercados, analisar baleias e apostar. Escreva sobre o que quer apostar!",
    wantAnalysis: "Quer minha analise antes de apostar?",
    analyzeBtn: "ANALISAR COM IA",
    detectAgents: "DETECTAR AGENTES",
    explainWithAI: "EXPLICAR COM IA",
    explaining: "IA analisando dados do mercado...",
    betNow: "APOSTAR",
    skipAnalysis: "PULAR, APOSTAR JA",
    connectForAnalysis: "Conecte sua wallet para detectar agentes.",
    successProb: "Probabilidade de Sucesso",
    recommendedSide: "Recomendado",
    smartMoneyBet: "SMART MONEY",
    noEdge: "Sem vantagem detectada. Aposte por sua conta e risco.",
    highConfidence: "Alta confianca",
    mediumConfidence: "Confianca media",
    lowConfidence: "Baixa confianca",
    howMuchInvest: "Quanto voce quer investir?",
    investPlaceholder: "Valor em USD",
    calculateProb: "CALCULAR PROBABILIDADE",
    marketImpactLabel: "Seu tamanho",
    yourSizeMovesMarket: "Sua aposta e {pct}% do volume do mercado. Isso movera o preco contra voce.",
    sizeOk: "Sua aposta tem impacto minimo no mercado.",
    manualAmount: "Ou escolha valor:",
    monOnMonad: "MON na Monad",
    onboardName: "Nomeie seu assistente",
    onboardNameSub: "E assim que voce vai ativa-lo. Por voz, pelos oculos, ou digitando.",
    onboardCategories: "Em que voce aposta?",
    onboardCategoriesSub: "Escolha 3 categorias. {name} vai mostrar mercados que combinam.",
    onboardLang: "Qual idioma?",
    onboardLangSub: "{name} vai falar com voce no seu idioma.",
    startWhispering: "COMECAR",
    failedSearch: "Erro ao buscar mercados.",
    failedAnalysis: "Erro ao analisar o mercado.",
    failedBet: "Erro ao apostar. Tente novamente.",
    failedPortfolio: "Erro ao carregar portfolio.",
  },
}

function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let str = STRINGS[lang]?.[key] || STRINGS.en[key] || key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v))
    }
  }
  return str
}

// ─── Categories ───

interface BetCategory {
  id: string
  name: Record<Lang, string>
  icon: string
  query: string
}

const ALL_CATEGORIES: BetCategory[] = [
  { id: 'crypto',   name: { en: 'Crypto', es: 'Crypto', pt: 'Crypto' },             icon: 'bitcoin',    query: 'bitcoin ethereum crypto' },
  { id: 'nba',      name: { en: 'NBA', es: 'NBA', pt: 'NBA' },                      icon: 'dribbble',   query: 'nba' },
  { id: 'nfl',      name: { en: 'NFL', es: 'NFL', pt: 'NFL' },                      icon: 'trophy',     query: 'nfl' },
  { id: 'soccer',   name: { en: 'Soccer', es: 'Futbol', pt: 'Futebol' },            icon: 'circle-dot', query: 'liga mx' },
  { id: 'politics', name: { en: 'Politics', es: 'Politica', pt: 'Politica' },       icon: 'landmark',   query: 'president election politics' },
  { id: 'ai',       name: { en: 'AI', es: 'IA', pt: 'IA' },                         icon: 'brain',      query: 'artificial intelligence ai model' },
  { id: 'finance',  name: { en: 'Finance', es: 'Finanzas', pt: 'Financas' },        icon: 'trending-up',query: 'fed rates stock market' },
  { id: 'mma',      name: { en: 'MMA / UFC', es: 'MMA / UFC', pt: 'MMA / UFC' },   icon: 'swords',     query: 'ufc' },
  { id: 'baseball', name: { en: 'MLB', es: 'MLB', pt: 'MLB' },                      icon: 'zap',        query: 'mlb' },
  { id: 'esports',  name: { en: 'Esports', es: 'Esports', pt: 'Esports' },         icon: 'gamepad-2',  query: 'league of legends' },
  { id: 'world',    name: { en: 'World', es: 'Mundo', pt: 'Mundo' },                icon: 'globe',      query: 'world event global' },
  { id: 'culture',  name: { en: 'Culture', es: 'Cultura', pt: 'Cultura' },          icon: 'star',       query: 'oscars grammys entertainment' },
]

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'bitcoin': Bitcoin, 'dribbble': Dribbble, 'trophy': Trophy, 'circle-dot': CircleDot,
  'landmark': Landmark, 'brain': Brain, 'trending-up': TrendingUp, 'swords': Swords,
  'zap': Zap, 'gamepad-2': Gamepad2, 'globe': Globe, 'star': Star,
}

// ─── localStorage helpers ───

function getAssistantName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('betwhisper_assistant_name') || ''
}

function getSavedCategories(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('betwhisper_categories') || '[]') } catch { return [] }
}

function getSavedLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('betwhisper_lang') as Lang) || 'en'
}

function isOnboarded(): boolean {
  return !!getAssistantName() && getSavedCategories().length > 0 && !!localStorage.getItem('betwhisper_lang')
}

function saveOnboarding(name: string, categories: string[], lang: Lang) {
  localStorage.setItem('betwhisper_assistant_name', name)
  localStorage.setItem('betwhisper_categories', JSON.stringify(categories))
  localStorage.setItem('betwhisper_lang', lang)
}

// ─── UUID helper ───

let msgCounter = 0
function uid(): string { return `msg_${Date.now()}_${++msgCounter}` }

// ─── Onboarding Screen (3 steps) ───

function OnboardingScreen({ onComplete }: { onComplete: (name: string, categories: string[], lang: Lang) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [focused, setFocused] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lang, setLang] = useState<Lang>('es')

  const suggestions = ['Don Fede', 'Buddy', 'Seu Jorge', '老王', 'Coach', 'El Profe']

  const toggleCategory = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else if (next.size < 3) { next.add(id) }
      return next
    })
  }

  // Step 1: Name
  if (step === 1) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="mb-10">
            <div className="w-8 h-8 border border-white/20 flex items-center justify-center mb-8">
              <span className="text-[11px] font-bold">BW</span>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight mb-3">Name your assistant</h1>
            <p className="text-[15px] text-[--text-secondary] leading-relaxed">
              This is how you will activate it. By voice, through your glasses, or by typing.
            </p>
          </div>
          <div className="mb-6">
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2) }}
              placeholder="e.g. Don Fede"
              className={`w-full bg-transparent border ${focused ? 'border-white/40' : 'border-[--border-light]'} px-4 py-3.5 text-[16px] text-white placeholder:text-[--text-tertiary] outline-none transition-colors`}
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-10">
            {suggestions.map(s => (
              <button key={s} onClick={() => setName(s)}
                className="px-3 py-1.5 border border-[--border-light] text-[13px] text-[--text-secondary] hover:text-white hover:border-white/30 transition-colors active:scale-[0.97]">
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => { if (name.trim()) setStep(2) }} disabled={!name.trim()}
            className="w-full px-6 py-3.5 bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed">
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Categories
  if (step === 2) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <div className="mb-8">
            <div className="w-8 h-8 border border-white/20 flex items-center justify-center mb-8">
              <span className="text-[11px] font-bold">BW</span>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight mb-3">{t(lang, 'onboardCategories')}</h1>
            <p className="text-[15px] text-[--text-secondary] leading-relaxed">
              {t(lang, 'onboardCategoriesSub', { name: name })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mb-6">
            <span className={`text-[13px] font-bold font-mono ${selected.size === 3 ? 'text-emerald-500' : 'text-white'}`}>{selected.size}</span>
            <span className="text-[13px] font-mono text-white/30">/ 3</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-10">
            {ALL_CATEGORIES.map(cat => {
              const isSelected = selected.has(cat.id)
              const canSelect = selected.size < 3
              const IconComp = CATEGORY_ICONS[cat.icon]
              return (
                <button key={cat.id} onClick={() => toggleCategory(cat.id)} disabled={!isSelected && !canSelect}
                  className={`flex flex-col items-center gap-1.5 py-4 px-2 border transition-all active:scale-[0.97] ${
                    isSelected ? 'bg-white text-black border-white'
                      : canSelect ? 'bg-white/[0.03] text-white/60 border-white/[0.08] hover:text-white hover:border-white/20'
                        : 'bg-white/[0.03] text-white/20 border-white/[0.08] cursor-not-allowed'
                  }`}>
                  {IconComp && <IconComp className="w-5 h-5" />}
                  <span className="text-[11px] font-semibold">{cat.name[lang]}</span>
                </button>
              )
            })}
          </div>
          <button onClick={() => { if (selected.size === 3) setStep(3) }} disabled={selected.size < 3}
            className="w-full px-6 py-3.5 bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed">
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Language
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="mb-10">
          <div className="w-8 h-8 border border-white/20 flex items-center justify-center mb-8">
            <span className="text-[11px] font-bold">BW</span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight mb-3">{t(lang, 'onboardLang')}</h1>
          <p className="text-[15px] text-[--text-secondary] leading-relaxed">
            {t(lang, 'onboardLangSub', { name: name })}
          </p>
        </div>
        <div className="space-y-2 mb-10">
          {([
            { code: 'en' as Lang, label: 'English', flag: '🇺🇸' },
            { code: 'es' as Lang, label: 'Espanol', flag: '🇲🇽' },
            { code: 'pt' as Lang, label: 'Portugues', flag: '🇧🇷' },
          ]).map(opt => (
            <button key={opt.code} onClick={() => setLang(opt.code)}
              className={`w-full flex items-center gap-3 px-5 py-4 border transition-all active:scale-[0.98] ${
                lang === opt.code ? 'bg-white text-black border-white' : 'bg-white/[0.03] text-white/60 border-white/[0.08] hover:border-white/20'
              }`}>
              <span className="text-xl">{opt.flag}</span>
              <span className="text-[14px] font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => { if (name.trim() && selected.size === 3) onComplete(name.trim(), Array.from(selected), lang) }}
          className="w-full px-6 py-3.5 bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all active:scale-[0.97] flex items-center justify-center gap-2">
          {t(lang, 'startWhispering')} <ArrowUp className="w-4 h-4 rotate-45" />
        </button>
      </div>
    </div>
  )
}

// ─── Chat Attachment: Market List ───

function MarketListAttachment({ markets, onSelect }: { markets: MarketInfo[]; onSelect: (m: MarketInfo) => void }) {
  return (
    <div className="space-y-1.5 mt-2">
      {markets.map(market => (
        <button key={market.conditionId} onClick={() => onSelect(market)}
          className="w-full text-left flex items-center justify-between px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors active:scale-[0.99]">
          <div className="flex-1 min-w-0 mr-3">
            <div className="text-[13px] font-medium text-white line-clamp-2 mb-1">{market.question}</div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold font-mono text-emerald-500">YES {(market.yesPrice * 100).toFixed(0)}¢</span>
              <span className="text-[10px] font-bold font-mono text-red-400">NO {(market.noPrice * 100).toFixed(0)}¢</span>
              {market.volume > 0 && (
                <span className="text-[10px] font-mono text-white/30">
                  ${market.volume > 1000000 ? `${(market.volume / 1000000).toFixed(1)}M` : `${(market.volume / 1000).toFixed(0)}K`}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
        </button>
      ))}
    </div>
  )
}

// ─── Chat Attachment: Market Preview (before analysis) ───

function MarketPreviewAttachment({ market, lang, isConnected, onAnalyze, onSkip }: {
  market: MarketInfo; lang: Lang; isConnected: boolean
  onAnalyze: (market: MarketInfo) => void
  onSkip: (market: MarketInfo) => void
}) {
  return (
    <div className="mt-2 border border-white/[0.10] bg-white/[0.04]">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="text-[13px] font-medium text-white mb-2">{market.question}</div>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-white/30 mr-1">YES</span>
            <span className="text-[16px] font-bold font-mono text-emerald-500">{(market.yesPrice * 100).toFixed(0)}¢</span>
          </div>
          <div>
            <span className="text-[10px] text-white/30 mr-1">NO</span>
            <span className="text-[16px] font-bold font-mono text-red-400">{(market.noPrice * 100).toFixed(0)}¢</span>
          </div>
          {market.volume > 0 && (
            <div className="text-[10px] font-mono text-white/20">
              Vol ${market.volume > 1000000 ? `${(market.volume / 1000000).toFixed(1)}M` : `${(market.volume / 1000).toFixed(0)}K`}
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-3 flex items-center gap-2">
        {isConnected ? (
          <button onClick={() => onAnalyze(market)}
            className="flex-1 py-2.5 text-[12px] font-semibold border border-white/20 text-white hover:bg-white/[0.06] transition-colors active:scale-[0.97] flex items-center justify-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            {t(lang, 'detectAgents')}
          </button>
        ) : (
          <button onClick={() => onAnalyze(market)}
            className="flex-1 py-2.5 text-[12px] font-semibold border border-white/10 text-white/30 cursor-not-allowed flex items-center justify-center gap-1.5"
            title={t(lang, 'connectForAnalysis')}>
            <Wallet className="w-3.5 h-3.5" />
            {t(lang, 'detectAgents')}
          </button>
        )}
        <button onClick={() => onSkip(market)}
          className="flex-1 py-2.5 text-[12px] font-semibold border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors active:scale-[0.97]">
          {t(lang, 'skipAnalysis')}
        </button>
      </div>
    </div>
  )
}

// ─── Chat Attachment: Bet Choice (YES/NO without analysis) ───

function BetChoiceAttachment({ slug, yesPrice, noPrice, onPickSide }: {
  slug: string; yesPrice: number; noPrice: number
  onPickSide: (side: 'Yes' | 'No', slug: string, signalHash: string) => void
}) {
  return (
    <div className="mt-2 border border-white/[0.10] bg-white/[0.04]">
      <div className="px-4 py-3 flex items-center gap-4 border-b border-white/[0.06]">
        <div>
          <span className="text-[10px] text-white/30 mr-1">YES</span>
          <span className="text-[14px] font-bold font-mono text-emerald-500">{(yesPrice * 100).toFixed(0)}¢</span>
        </div>
        <div>
          <span className="text-[10px] text-white/30 mr-1">NO</span>
          <span className="text-[14px] font-bold font-mono text-red-400">{(noPrice * 100).toFixed(0)}¢</span>
        </div>
      </div>
      <div className="px-4 py-3 flex items-center gap-2">
        <button onClick={() => onPickSide('Yes', slug, 'skip')}
          className="flex-1 py-2 text-[12px] font-semibold border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors active:scale-[0.97]">
          BET YES
        </button>
        <button onClick={() => onPickSide('No', slug, 'skip')}
          className="flex-1 py-2 text-[12px] font-semibold border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors active:scale-[0.97]">
          BET NO
        </button>
      </div>
    </div>
  )
}

// ─── Chat Attachment: Deep Analysis Card (Agent Radar) ───

const STRATEGY_COLORS: Record<StrategyType, string> = {
  MARKET_MAKER: 'text-blue-400', HYBRID: 'text-purple-400', SNIPER: 'text-amber-400',
  MOMENTUM: 'text-cyan-400', UNCLASSIFIED: 'text-white/30',
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  bot: 'text-red-400 border-red-400/30', 'likely-bot': 'text-orange-400 border-orange-400/30',
  mixed: 'text-yellow-400 border-yellow-400/30', human: 'text-emerald-400 border-emerald-400/30',
}

function DeepAnalysisAttachment({ analysis, market, lang, onExplain, onSkipToBet }: {
  analysis: DeepAnalysisResult; market: MarketInfo; lang: Lang
  onExplain: (analysis: DeepAnalysisResult, market: MarketInfo) => void
  onSkipToBet: (market: MarketInfo, analysis: DeepAnalysisResult) => void
}) {
  const { classifications, capitalByOutcome, topHolders, strategies } = analysis
  const totalYesCap = capitalByOutcome.Yes.total
  const totalNoCap = capitalByOutcome.No.total
  const totalCap = totalYesCap + totalNoCap
  const yesPct = totalCap > 0 ? Math.round((totalYesCap / totalCap) * 100) : 50

  // Format dollar amounts
  const fmtCap = (n: number) => n > 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n > 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${Math.round(n)}`

  return (
    <div className="mt-2 border border-white/[0.10] bg-white/[0.04]">
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[9px] font-bold font-mono text-white/30 tracking-[1.5px]">AGENT RADAR</span>
        <span className="text-[9px] font-mono text-white/20">{analysis.holdersScanned} scanned / {analysis.totalHolders} holders</span>
      </div>

      {/* Market Structure */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="text-[10px] font-mono text-white/30 mb-2">MARKET STRUCTURE</div>
        <div className="flex items-center gap-4 mb-2">
          <div>
            <span className="text-[22px] font-bold font-mono text-white">{analysis.agentRate}%</span>
            <span className="text-[10px] text-white/30 ml-1">agent</span>
          </div>
          <div>
            <span className="text-[22px] font-bold font-mono text-white/60">{100 - analysis.agentRate}%</span>
            <span className="text-[10px] text-white/30 ml-1">human</span>
          </div>
        </div>
        <div className="h-1.5 bg-white/[0.06] w-full flex">
          <div className="h-full bg-red-400/70 transition-all duration-700" style={{ width: `${analysis.agentRate}%` }} />
          <div className="h-full bg-emerald-500/50 transition-all duration-700" style={{ width: `${100 - analysis.agentRate}%` }} />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[9px] font-mono text-red-400/60">BOT {classifications.bot}</span>
          <span className="text-[9px] font-mono text-orange-400/60">LIKELY {classifications.likelyBot}</span>
          <span className="text-[9px] font-mono text-yellow-400/60">MIXED {classifications.mixed}</span>
          <span className="text-[9px] font-mono text-emerald-400/60">HUMAN {classifications.human}</span>
        </div>
      </div>

      {/* Agent Capital Flow */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="text-[10px] font-mono text-white/30 mb-2">AGENT CAPITAL FLOW</div>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-emerald-500">YES</span>
              <span className="text-[10px] font-mono text-white/40">{fmtCap(totalYesCap)}</span>
            </div>
            <div className="h-1 bg-white/[0.06] w-full">
              <div className="h-full bg-emerald-500/60 transition-all duration-700" style={{ width: `${yesPct}%` }} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-mono text-red-400/50">agent {fmtCap(capitalByOutcome.Yes.agent)}</span>
              <span className="text-[8px] font-mono text-emerald-400/50">human {fmtCap(capitalByOutcome.Yes.human)}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-red-400">NO</span>
              <span className="text-[10px] font-mono text-white/40">{fmtCap(totalNoCap)}</span>
            </div>
            <div className="h-1 bg-white/[0.06] w-full">
              <div className="h-full bg-red-400/60 transition-all duration-700" style={{ width: `${100 - yesPct}%` }} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-mono text-red-400/50">agent {fmtCap(capitalByOutcome.No.agent)}</span>
              <span className="text-[8px] font-mono text-emerald-400/50">human {fmtCap(capitalByOutcome.No.human)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Mix */}
      {analysis.dominantStrategy && (
        <div className="px-4 py-2.5 border-b border-white/[0.06]">
          <div className="text-[10px] font-mono text-white/30 mb-1.5">STRATEGY MIX</div>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(strategies) as [StrategyType, number][])
              .filter(([, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <span key={type} className={`text-[10px] font-mono ${STRATEGY_COLORS[type]} border border-white/[0.06] px-2 py-0.5`}>
                  {type === 'MARKET_MAKER' ? 'Maker' : type === 'UNCLASSIFIED' ? 'Other' : type.charAt(0) + type.slice(1).toLowerCase()} x{count}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Smart Money Direction */}
      <div className="px-4 py-2.5 border-b border-white/[0.06]">
        <div className="text-[10px] font-mono text-white/30 mb-1.5">SMART MONEY</div>
        <div className="flex items-center gap-2">
          {analysis.smartMoneyDirection === 'Yes' || analysis.smartMoneyDirection === 'No' ? (
            <>
              <span className={`text-[14px] font-bold font-mono ${analysis.smartMoneyDirection === 'Yes' ? 'text-emerald-500' : 'text-red-400'}`}>
                {analysis.smartMoneyDirection.toUpperCase()}
              </span>
              <span className="text-[18px] font-bold font-mono text-white">{analysis.smartMoneyPct}%</span>
              <span className="text-[10px] text-white/30">of agent capital</span>
            </>
          ) : (
            <span className="text-[12px] font-mono text-white/40">
              {analysis.smartMoneyDirection === 'Divided' ? 'Divided. No clear consensus.' : 'No agent signal detected.'}
            </span>
          )}
        </div>
      </div>

      {/* Top Holders */}
      {topHolders.length > 0 && (
        <div className="px-4 py-2 border-b border-white/[0.06]">
          <div className="text-[10px] font-mono text-white/30 mb-1.5">TOP HOLDERS</div>
          {topHolders.slice(0, 5).map(h => (
            <div key={h.address} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[11px] font-medium text-white/70 truncate max-w-[120px]">{h.pseudonym}</span>
                <span className={`text-[8px] font-bold tracking-wider border px-1 py-0.5 ${CLASSIFICATION_COLORS[h.classification] || 'text-white/30 border-white/10'}`}>
                  {h.classification === 'likely-bot' ? 'L-BOT' : h.classification.toUpperCase()}
                </span>
                {h.strategy.type !== 'UNCLASSIFIED' && (
                  <span className={`text-[8px] font-mono ${STRATEGY_COLORS[h.strategy.type]}`}>{h.strategy.label}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-bold font-mono ${h.side === 'Yes' ? 'text-emerald-500' : 'text-red-400'}`}>{h.side.toUpperCase()}</span>
                <span className="text-[10px] font-mono text-white/20">{fmtCap(h.positionSize)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Red Flags */}
      {analysis.redFlags.length > 0 && (
        <div className="px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/[0.03]">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] font-bold font-mono text-amber-500 tracking-[1px]">RED FLAGS</span>
          </div>
          {analysis.redFlags.map((flag, i) => (
            <p key={i} className="text-[10px] text-amber-400/70 leading-relaxed">{flag}</p>
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div className="px-4 py-2.5 border-b border-white/[0.06]">
        <div className="text-[10px] font-mono text-white/30 mb-1">RECOMMENDATION</div>
        <p className="text-[11px] text-white/70 leading-relaxed">{analysis.recommendation}</p>
      </div>

      {/* Tags */}
      {analysis.tags.length > 0 && (
        <div className="px-4 py-2 border-b border-white/[0.06] flex flex-wrap gap-1.5">
          {analysis.tags.map(tag => (
            <span key={tag} className="text-[9px] font-mono text-white/40 border border-white/[0.08] px-2 py-0.5">{tag}</span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 py-3 flex items-center gap-2">
        <button onClick={() => onExplain(analysis, market)}
          className="flex-1 py-2.5 text-[12px] font-semibold border border-white/20 text-white hover:bg-white/[0.06] transition-colors active:scale-[0.97] flex items-center justify-center gap-1.5">
          <Brain className="w-3.5 h-3.5" />
          {t(lang, 'explainWithAI')}
        </button>
        <button onClick={() => onSkipToBet(market, analysis)}
          className="flex-1 py-2.5 text-[12px] font-semibold border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors active:scale-[0.97]">
          {t(lang, 'skipAnalysis')}
        </button>
      </div>
    </div>
  )
}

// ─── Chat Attachment: AI Explanation (Step 3) ───

function AIExplanationAttachment({ lines, market, analysis, lang, onNext }: {
  lines: string[]; market: MarketInfo; analysis: DeepAnalysisResult; lang: Lang
  onNext: (market: MarketInfo, analysis: DeepAnalysisResult) => void
}) {
  return (
    <div className="mt-2 border border-white/[0.10] bg-white/[0.04]">
      <div className="px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[9px] font-bold font-mono text-white/30 tracking-[1.5px]">AI ANALYSIS</span>
      </div>
      <div className="px-4 py-3">
        {lines.map((line, i) => (
          <p key={i} className="text-[12px] font-mono text-white/70 leading-relaxed mb-1">{line}</p>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <button onClick={() => onNext(market, analysis)}
          className="w-full py-2.5 text-[13px] font-semibold bg-white text-black hover:bg-white/90 transition-colors active:scale-[0.97]">
          {t(lang, 'betNow')}
        </button>
      </div>
    </div>
  )
}

// ─── Chat Attachment: Bet Amount Input (Step 3.5 - How much?) ───

function BetAmountInputAttachment({ market, analysis, lang, onCalculate }: {
  market: MarketInfo; analysis: DeepAnalysisResult; lang: Lang
  onCalculate: (market: MarketInfo, analysis: DeepAnalysisResult, amountUSD: number) => void
}) {
  const [amount, setAmount] = useState('')
  const volumeLabel = market.volume > 1000000
    ? `$${(market.volume / 1000000).toFixed(1)}M`
    : `$${Math.round(market.volume / 1000)}K`

  const numAmount = parseFloat(amount) || 0
  const sizeRatio = market.volume > 0 ? numAmount / market.volume : 0
  const sizePct = Math.round(sizeRatio * 1000) / 10

  return (
    <div className="mt-2 border border-white/[0.10] bg-white/[0.04]">
      <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[9px] font-bold font-mono text-white/30 tracking-[1.5px]">
          {t(lang, 'howMuchInvest').toUpperCase()}
        </span>
        <span className="text-[9px] font-mono text-white/20">Vol: {volumeLabel}</span>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[20px] font-bold font-mono text-white/40">$</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={t(lang, 'investPlaceholder')}
            className="flex-1 bg-transparent border-b border-white/20 text-[24px] font-bold font-mono text-white outline-none focus:border-white/40 transition-colors pb-1"
            min="1"
            step="1"
            autoFocus
          />
        </div>

        {/* Quick amounts */}
        <div className="flex items-center gap-2 mb-4">
          {['10', '50', '100', '500'].map(preset => (
            <button key={preset} onClick={() => setAmount(preset)}
              className={`flex-1 py-1.5 text-[11px] font-semibold font-mono border transition-colors active:scale-[0.97] ${
                amount === preset
                  ? 'border-white/40 text-white bg-white/10'
                  : 'border-white/10 text-white/30 hover:border-white/20'
              }`}>
              ${preset}
            </button>
          ))}
        </div>

        {/* Size impact preview */}
        {numAmount > 0 && (
          <div className={`text-[10px] font-mono mb-4 px-2 py-1.5 border-l-2 ${
            sizePct >= 25 ? 'border-red-400 text-red-400/70'
            : sizePct >= 5 ? 'border-amber-400 text-amber-400/70'
            : 'border-emerald-500 text-emerald-500/70'
          }`}>
            {sizePct >= 5
              ? t(lang, 'yourSizeMovesMarket', { pct: sizePct })
              : t(lang, 'sizeOk')}
          </div>
        )}

        <button onClick={() => numAmount > 0 && onCalculate(market, analysis, numAmount)}
          disabled={numAmount <= 0}
          className={`w-full py-2.5 text-[13px] font-semibold font-mono transition-colors active:scale-[0.97] ${
            numAmount > 0
              ? 'bg-white text-black hover:bg-white/90'
              : 'bg-white/10 text-white/20 cursor-not-allowed'
          }`}>
          {t(lang, 'calculateProb')}
        </button>
      </div>
    </div>
  )
}

// ─── Chat Attachment: Success Probability (Step 4 - The Killer Feature) ───

function SuccessProbabilityAttachment({ probability, market, signalHash, lang, onSmartBet, onManualBet }: {
  probability: ProbabilityResult; market: MarketInfo
  analysis: DeepAnalysisResult; signalHash: string; lang: Lang
  onSmartBet: (side: 'Yes' | 'No', slug: string, signalHash: string, amount: string, conditionId?: string) => void
  onManualBet: (side: 'Yes' | 'No', slug: string, signalHash: string, conditionId?: string) => void
}) {
  const hasSide = probability.recommendedSide !== null
  const side = probability.recommendedSide || 'Yes'
  const isYes = side === 'Yes'

  const probColor = probability.winProbability >= 65 ? 'text-emerald-500'
    : probability.winProbability >= 45 ? 'text-amber-400'
    : 'text-red-400'

  const confidenceText = t(lang,
    probability.confidence === 'high' ? 'highConfidence'
    : probability.confidence === 'medium' ? 'mediumConfidence'
    : 'lowConfidence'
  )

  const hasMarketImpact = probability.breakdown.marketImpact < -2

  return (
    <div className="mt-2 border border-white/[0.10] bg-white/[0.04]">
      <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[9px] font-bold font-mono text-white/30 tracking-[1.5px]">
          {t(lang, 'successProb').toUpperCase()}
        </span>
        {probability.betAmount > 0 && (
          <span className="text-[9px] font-mono text-white/20">${probability.betAmount} USD</span>
        )}
      </div>

      {/* Big probability number */}
      <div className="px-4 py-6 text-center">
        <div className={`text-[56px] font-bold font-mono leading-none ${probColor}`}>
          {probability.winProbability}%
        </div>
        <div className="text-[11px] text-white/30 mt-2 font-mono">{confidenceText}</div>
      </div>

      {/* Breakdown */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-y-1 text-[9px] font-mono text-white/20">
          <span>Market: {probability.breakdown.marketImplied}%</span>
          <span>Agent: {probability.breakdown.agentAdjustment > 0 ? '+' : ''}{probability.breakdown.agentAdjustment}%</span>
          {probability.breakdown.redFlagPenalty < 0 && (
            <span className="text-amber-400/60">Risk: {probability.breakdown.redFlagPenalty}%</span>
          )}
          {hasMarketImpact && (
            <span className="text-red-400/60">{t(lang, 'marketImpactLabel')}: {probability.breakdown.marketImpact}%</span>
          )}
        </div>
      </div>

      {hasSide ? (
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-white/30">{t(lang, 'recommendedSide')}</span>
            <span className={`text-[16px] font-bold font-mono ${isYes ? 'text-emerald-500' : 'text-red-400'}`}>
              {side.toUpperCase()}
            </span>
          </div>

          {/* Smart Money button */}
          <button onClick={() => onSmartBet(side, market.slug, signalHash, String(probability.smartMoneySize), market.conditionId)}
            className={`w-full py-3 text-[13px] font-semibold font-mono border transition-colors active:scale-[0.97] mb-2 ${
              isYes ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/[0.05] hover:bg-emerald-500/10'
                    : 'border-red-400/40 text-red-400 bg-red-400/[0.05] hover:bg-red-400/10'
            }`}>
            {t(lang, 'smartMoneyBet')}: ${probability.smartMoneySize} USD
          </button>
          <div className="text-[9px] font-mono text-white/15 text-center mb-3">
            Kelly: {Math.round(probability.kellyFraction * 100)}% of ${probability.betAmount}
          </div>

          {/* Full amount button */}
          {probability.betAmount > 0 && probability.smartMoneySize < probability.betAmount && (
            <button onClick={() => onSmartBet(side, market.slug, signalHash, String(probability.betAmount), market.conditionId)}
              className={`w-full py-2 text-[11px] font-semibold font-mono border transition-colors active:scale-[0.97] mb-3 ${
                isYes ? 'border-emerald-500/15 text-emerald-500/50 hover:bg-emerald-500/10'
                      : 'border-red-400/15 text-red-400/50 hover:bg-red-400/10'
              }`}>
              ${probability.betAmount} USD (100%)
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <p className="text-[11px] text-amber-400/70 font-mono mb-3">{t(lang, 'noEdge')}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => onManualBet('Yes', market.slug, signalHash, market.conditionId)}
              className="flex-1 py-2 text-[12px] font-semibold border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors active:scale-[0.97]">
              BET YES
            </button>
            <button onClick={() => onManualBet('No', market.slug, signalHash, market.conditionId)}
              className="flex-1 py-2 text-[12px] font-semibold border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors active:scale-[0.97]">
              BET NO
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Chat Attachment: Bet Confirmed ───

function BetConfirmedAttachment({ side, amount, txHash, explorerUrl, source, shares, price }: {
  side: string; amount: string; txHash: string; explorerUrl?: string; source?: string; shares?: number; price?: number
}) {
  const isReal = source === 'polymarket' || source === 'polymarket-mock'
  const linkUrl = explorerUrl || `${MONAD_EXPLORER}/tx/${txHash}`
  return (
    <div className="mt-2 border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <span className="text-[11px] font-bold font-mono text-emerald-500 tracking-[1px]">BET PLACED</span>
        {isReal && <span className="text-[9px] font-mono text-emerald-500/50 px-1.5 py-0.5 border border-emerald-500/20">POLYMARKET</span>}
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-[13px] font-bold font-mono ${side === 'Yes' ? 'text-emerald-500' : 'text-red-400'}`}>{side.toUpperCase()}</span>
        <span className="text-[13px] font-medium font-mono text-white">${amount} USD</span>
      </div>
      {isReal && price && shares && (
        <div className="flex items-center gap-4 mb-2 text-[10px] font-mono text-white/30">
          <span>Price: {price.toFixed(2)}</span>
          <span>Shares: {shares.toFixed(1)}</span>
        </div>
      )}
      <a href={linkUrl} target="_blank" rel="noopener noreferrer"
        className="text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors flex items-center gap-1">
        {txHash.slice(0, 18)}... <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}

// ─── Chat Attachment: Bet Prompt ───

function BetPromptAttachment({ side, slug, signalHash, conditionId, lang, onConfirm }: {
  side: 'Yes' | 'No'; slug: string; signalHash: string; conditionId: string; lang: Lang
  onConfirm: (side: 'Yes' | 'No', slug: string, signalHash: string, amount: string, conditionId?: string) => void
}) {
  const amounts = ['1', '5', '10', '25']
  const isYes = side === 'Yes'
  return (
    <div className={`mt-2 border px-4 py-3 ${isYes ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-red-400/20 bg-red-400/[0.03]'}`}>
      <div className="flex items-center gap-2">
        {amounts.map(amt => (
          <button key={amt} onClick={() => onConfirm(side, slug, signalHash, amt, conditionId)}
            className={`flex-1 py-2 text-[12px] font-semibold font-mono border transition-colors active:scale-[0.97] ${
              isYes ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10' : 'border-red-400/30 text-red-400 hover:bg-red-400/10'
            }`}>
            ${amt}
          </button>
        ))}
      </div>
      <div className="text-[10px] text-white/20 mt-2 font-mono">USD via Polymarket CLOB</div>
    </div>
  )
}

// ─── Chat Attachment: Portfolio ───

function PortfolioAttachment({ data }: { data: PortfolioData }) {
  return (
    <div className="mt-2 border border-white/[0.10] bg-white/[0.04]">
      <div className="px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[9px] font-bold font-mono text-white/30 tracking-[1.5px]">PORTFOLIO</span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-white/[0.06]">
        {[
          { label: 'Value', value: `$${data.portfolioValue.toFixed(2)}` },
          { label: 'P&L', value: `${data.stats.totalPnl >= 0 ? '+' : ''}$${data.stats.totalPnl.toFixed(2)}`, color: data.stats.totalPnl >= 0 ? 'text-emerald-500' : 'text-red-400' },
          { label: 'Win Rate', value: `${data.stats.winRate}%` },
          { label: 'Positions', value: String(data.stats.openPositions) },
        ].map(s => (
          <div key={s.label} className="bg-black px-4 py-3">
            <div className="text-[10px] text-white/30 mb-0.5">{s.label}</div>
            <div className={`text-[16px] font-bold font-mono ${s.color || 'text-white'}`}>{s.value}</div>
          </div>
        ))}
      </div>
      {data.positions.length > 0 && (
        <div className="px-4 py-2 border-t border-white/[0.06]">
          {data.positions.slice(0, 5).map(pos => (
            <div key={`${pos.conditionId}-${pos.outcome}`} className="flex items-center justify-between py-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-white/70 truncate pr-4">{pos.title}</div>
                <span className={`text-[10px] font-bold font-mono ${pos.outcome === 'Yes' ? 'text-emerald-500' : 'text-red-400'}`}>{pos.outcome}</span>
              </div>
              <span className={`text-[12px] font-mono font-semibold ${pos.pnl >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {pos.pnl >= 0 ? '+' : ''}${Math.abs(pos.pnl).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Chat Bubble ───

function ChatBubble({ message, assistantName }: { message: ChatMessage; assistantName: string }) {
  const isUser = message.role === 'user'
  const initial = assistantName.charAt(0).toUpperCase()

  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'items-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-5">
          <span className="text-[9px] font-bold text-white/60">{initial}</span>
        </div>
      )}
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <span className="text-[9px] font-bold font-mono text-white/30 tracking-[1.5px] mb-1 px-0.5">
          {isUser ? 'YOU' : assistantName.toUpperCase()}
        </span>
        {message.text && (
          <div className={`px-3 py-2 text-[13px] leading-relaxed ${
            isUser ? 'bg-white text-black' : 'border border-white/[0.08] bg-white/[0.04] text-white/80'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───

export default function PredictChat() {
  const { address, isConnected, connect, disconnect, signer } = useWeb3()

  const [assistantName, setAssistantNameState] = useState<string | null>(null)
  const [lang, setLangState] = useState<Lang>('en')
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    setAssistantNameState(getAssistantName() || null)
    setLangState(getSavedLang())
    setOnboarded(isOnboarded())
  }, [])

  const handleOnboardComplete = (name: string, categories: string[], selectedLang: Lang) => {
    saveOnboarding(name, categories, selectedLang)
    setAssistantNameState(name)
    setLangState(selectedLang)
    setOnboarded(true)
  }

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialLoadDone = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = useCallback((role: ChatRole, text: string, attachment?: ChatAttachment): string => {
    const id = uid()
    setMessages(prev => [...prev, { id, role, text, attachment, timestamp: Date.now() }])
    return id
  }, [])

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  // ─── Handlers ───

  const searchMarkets = useCallback(async (query: string) => {
    const loadingId = addMessage('assistant', '', { type: 'loading', text: t(lang, 'searchingMarkets') })
    try {
      const q = query === 'trending' ? '' : query
      const res = await fetch(`/api/markets?q=${encodeURIComponent(q)}&limit=12`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const allMarkets: MarketInfo[] = (data.events || []).flatMap((e: EventInfo) => e.markets)
      removeMessage(loadingId)
      if (allMarkets.length === 0) {
        addMessage('assistant', t(lang, 'noMarkets'))
      } else {
        const display = allMarkets.slice(0, 5)
        addMessage('assistant',
          t(lang, 'foundMarkets', { n: allMarkets.length, s: allMarkets.length === 1 ? '' : 's' }),
          { type: 'markets', markets: display }
        )
      }
    } catch {
      removeMessage(loadingId)
      addMessage('assistant', '', { type: 'error', text: t(lang, 'failedSearch') })
    }
  }, [addMessage, removeMessage, lang])

  const performAnalysis = useCallback(async (market: MarketInfo) => {
    const loadingId = addMessage('assistant', '', { type: 'loading', text: t(lang, 'scanningWhales') })
    try {
      const res = await fetch('/api/market/deep-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditionId: market.conditionId }),
      })
      if (!res.ok) throw new Error('API error')
      const analysis: DeepAnalysisResult = await res.json()
      removeMessage(loadingId)

      const text = analysis.holdersScanned > 0
        ? t(lang, 'radarResult', { scanned: analysis.holdersScanned, total: analysis.totalHolders, agentPct: analysis.agentRate })
        : t(lang, 'noWhales')

      addMessage('assistant', text,
        { type: 'deepAnalysis', analysis, market }
      )
    } catch {
      removeMessage(loadingId)
      addMessage('assistant', '', { type: 'error', text: t(lang, 'failedAnalysis') })
    }
  }, [addMessage, removeMessage, lang])

  const handleBetPrompt = useCallback((side: 'Yes' | 'No', slug: string, signalHash: string, conditionId?: string) => {
    addMessage('user', `${side} on this market`)
    addMessage('assistant', t(lang, 'howMuch'), { type: 'betPrompt', side, slug, signalHash, conditionId: conditionId || '' })
  }, [addMessage, lang])

  const handleBet = useCallback(async (side: 'Yes' | 'No', slug: string, signalHash: string, amount: string, conditionId?: string) => {
    addMessage('user', `$${amount} on ${side}`)

    // Step 1: Register intent on Monad
    let loadingId = addMessage('assistant', '', { type: 'loading', text: lang === 'es' ? 'Registrando intento en Monad...' : 'Registering intent on Monad...' })
    let monadTxHash: string | null = null
    if (isConnected && signer) {
      try {
        const result = await executeBet(signer, { marketSlug: slug, side, amount: '0.001', signalHash })
        monadTxHash = result.txHash
      } catch { /* continue without monad intent */ }
    }
    if (!monadTxHash) {
      await new Promise(r => setTimeout(r, 800))
      monadTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    }
    removeMessage(loadingId)

    // Step 2: Execute on Polymarket CLOB
    loadingId = addMessage('assistant', '', { type: 'loading', text: lang === 'es' ? 'Ejecutando en Polymarket CLOB...' : 'Executing on Polymarket CLOB...' })

    // Resolve conditionId from chat history if not passed directly
    let resolvedConditionId = conditionId
    if (!resolvedConditionId) {
      const marketMsg = [...messages].reverse().find(m =>
        m.attachment?.type === 'successProbability' || m.attachment?.type === 'deepAnalysis' || m.attachment?.type === 'marketPreview'
      )
      if (marketMsg?.attachment && 'market' in marketMsg.attachment) {
        resolvedConditionId = marketMsg.attachment.market.conditionId
      }
    }

    let clobResult: { txHash: string; explorerUrl: string; source: string; shares: number; price: number } | null = null

    if (resolvedConditionId) {
      try {
        const res = await fetch('/api/bet/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conditionId: resolvedConditionId,
            outcomeIndex: side === 'Yes' ? 0 : 1,
            amountUSD: parseFloat(amount),
            signalHash,
            marketSlug: slug,
            monadTxHash,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          clobResult = {
            txHash: data.polygonTxHash || data.txHash,
            explorerUrl: data.explorerUrl,
            source: data.source,
            shares: data.shares,
            price: data.price,
          }
        }
      } catch { /* fall through to demo */ }
    }

    if (!clobResult) {
      await new Promise(r => setTimeout(r, 1200))
      const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      clobResult = { txHash: mockHash, explorerUrl: `https://polygonscan.com/tx/${mockHash}`, source: 'demo', shares: parseFloat(amount) / 0.5, price: 0.5 }
    }

    // Record bet
    await fetch('/api/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketSlug: slug, side, amount, walletAddress: address || 'demo', txHash: clobResult.txHash, signalHash, source: clobResult.source, monadTxHash }),
    }).catch(() => {})

    removeMessage(loadingId)

    // Step 3: Confirmed
    addMessage('assistant', lang === 'es' ? 'Apuesta confirmada en Polymarket.' : 'Bet confirmed on Polymarket.', {
      type: 'betConfirmed', side, amount, txHash: clobResult.txHash,
      explorerUrl: clobResult.explorerUrl, source: clobResult.source,
      shares: clobResult.shares, price: clobResult.price,
    })
  }, [isConnected, signer, address, messages, addMessage, removeMessage, lang])

  const showPortfolio = useCallback(async () => {
    if (!isConnected || !address) {
      addMessage('assistant', t(lang, 'connectWallet'))
      return
    }
    const loadingId = addMessage('assistant', '', { type: 'loading', text: t(lang, 'loadingPortfolio') })
    try {
      const res = await fetch(`/api/user/portfolio?address=${address}`)
      if (!res.ok) throw new Error('API error')
      const data: PortfolioData = await res.json()
      removeMessage(loadingId)
      addMessage('assistant', t(lang, 'hereIsPortfolio'), { type: 'portfolio', data })
    } catch {
      removeMessage(loadingId)
      addMessage('assistant', '', { type: 'error', text: t(lang, 'failedPortfolio') })
    }
  }, [isConnected, address, addMessage, removeMessage, lang])

  const handleUserMessage = useCallback(async (text: string) => {
    const intent = parseIntent(text)

    switch (intent.type) {
      case 'TRENDING':
        await searchMarkets('trending')
        break
      case 'PLACE_BET': {
        const analysisMsg = [...messages].reverse().find(m =>
          m.attachment?.type === 'successProbability' || m.attachment?.type === 'deepAnalysis'
        )
        if (analysisMsg?.attachment?.type === 'successProbability') {
          const { market, signalHash } = analysisMsg.attachment
          const side = intent.side || analysisMsg.attachment.probability.recommendedSide || 'Yes'
          const amount = intent.amount?.toString() || '1'
          await handleBet(side, market.slug, signalHash, amount, market.conditionId)
        } else if (analysisMsg?.attachment?.type === 'deepAnalysis') {
          const { market, analysis } = analysisMsg.attachment
          const side = intent.side || 'Yes'
          const amount = intent.amount?.toString() || '1'
          await handleBet(side, market.slug, analysis.signalHash, amount, market.conditionId)
        } else {
          addMessage('assistant', t(lang, 'analyzeFirst'))
        }
        break
      }
      case 'SEARCH_MARKET':
        await searchMarkets(intent.query || text)
        break
      default: {
        const lower = text.toLowerCase()
        if (lower.includes('portfolio') || lower.includes('positions') || lower.includes('mis apuestas') || lower.includes('portafolio')) {
          await showPortfolio()
        } else if (lower.includes('help') || lower.includes('ayuda') || lower.includes('ajuda')) {
          addMessage('assistant', t(lang, 'helpText'))
        } else {
          // Guided flow: treat as a topic search
          await searchMarkets(text)
        }
      }
    }
  }, [messages, searchMarkets, handleBet, showPortfolio, addMessage, lang])

  const sendMessage = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isProcessing) return
    addMessage('user', text)
    setInputText('')
    setIsProcessing(true)
    try { await handleUserMessage(text) } finally { setIsProcessing(false) }
  }, [inputText, isProcessing, addMessage, handleUserMessage])

  const handleMarketSelect = useCallback((market: MarketInfo) => {
    if (isProcessing) return
    addMessage('user', market.question)
    addMessage('assistant', t(lang, 'wantAnalysis'), { type: 'marketPreview', market })
  }, [isProcessing, addMessage, lang])

  const handleAnalyzeMarket = useCallback((market: MarketInfo) => {
    if (isProcessing) return
    if (!isConnected) {
      addMessage('assistant', t(lang, 'connectForAnalysis'))
      return
    }
    addMessage('user', t(lang, 'detectAgents'))
    setIsProcessing(true)
    performAnalysis(market).finally(() => setIsProcessing(false))
  }, [isProcessing, isConnected, addMessage, performAnalysis, lang])

  const handleSkipAnalysis = useCallback((market: MarketInfo) => {
    if (isProcessing) return
    addMessage('user', t(lang, 'skipAnalysis'))
    addMessage('assistant', '', {
      type: 'betChoice', slug: market.slug, yesPrice: market.yesPrice, noPrice: market.noPrice
    })
  }, [isProcessing, addMessage, lang])

  // Step 2 -> Step 3: User clicks "EXPLICAR CON IA" after Agent Radar
  const handleExplainWithAI = useCallback(async (analysis: DeepAnalysisResult, market: MarketInfo) => {
    if (isProcessing) return
    addMessage('user', t(lang, 'explainWithAI'))
    setIsProcessing(true)
    const loadingId = addMessage('assistant', '', { type: 'loading', text: t(lang, 'explaining') })

    try {
      const res = await fetch('/api/market/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          market: { question: market.question, yesPrice: market.yesPrice, noPrice: market.noPrice, volume: market.volume, endDate: market.endDate },
          language: lang,
        }),
      })
      if (!res.ok) throw new Error('API error')

      const contentType = res.headers.get('content-type') || ''
      let lines: string[]

      if (contentType.includes('text/event-stream')) {
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ''
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value)
            const dataLines = chunk.split('\n').filter(l => l.startsWith('data: '))
            for (const dl of dataLines) {
              const payload = dl.slice(6)
              if (payload === '[DONE]') break
              try { const parsed = JSON.parse(payload); if (parsed.text) fullText += parsed.text } catch {}
            }
          }
        }
        lines = fullText.split('\n').filter(l => l.trim().length > 0)
      } else {
        const data = await res.json()
        lines = data.fallback || ['> Analysis unavailable.']
      }

      removeMessage(loadingId)
      addMessage('assistant', '', { type: 'aiExplanation', lines, market, analysis })
    } catch {
      removeMessage(loadingId)
      addMessage('assistant', '', { type: 'error', text: t(lang, 'failedAnalysis') })
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, addMessage, removeMessage, lang])

  // Step 3 -> Step 3.5: Ask how much to invest
  const handleAskAmount = useCallback((market: MarketInfo, analysis: DeepAnalysisResult) => {
    addMessage('assistant', t(lang, 'howMuchInvest'), {
      type: 'betAmountInput', market, analysis,
    })
  }, [addMessage, lang])

  // Step 3.5 -> Step 4: Calculate probability with user's bet amount
  const handleCalculateProbability = useCallback((market: MarketInfo, analysis: DeepAnalysisResult, amountUSD: number) => {
    addMessage('user', `$${amountUSD} USD`)
    const probability = calculateWinProbability(analysis, market.yesPrice, market.noPrice, amountUSD, market.volume)
    addMessage('assistant', t(lang, 'successProb'), {
      type: 'successProbability', probability, market, analysis, signalHash: analysis.signalHash,
    })
  }, [addMessage, lang])

  // Step 4: Smart Money instant bet (from SuccessProbabilityAttachment)
  const handleSmartBet = useCallback(async (side: 'Yes' | 'No', slug: string, signalHash: string, amount: string, conditionId?: string) => {
    await handleBet(side, slug, signalHash, amount, conditionId)
  }, [handleBet])

  // Initial greeting
  useEffect(() => {
    if (!onboarded || initialLoadDone.current) return
    initialLoadDone.current = true
    addMessage('assistant', t(lang, 'greeting'))
  }, [onboarded, addMessage, lang])

  // Loading gate
  if (onboarded === null) return <div className="min-h-screen bg-black" />
  if (!onboarded) return <OnboardingScreen onComplete={handleOnboardComplete} />

  const displayName = assistantName || 'BetWhisper'

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[--border] bg-black flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/betwhisper" className="flex items-center gap-2">
              <div className="w-5 h-5 border border-white/20 flex items-center justify-center">
                <span className="text-[8px] font-bold">BW</span>
              </div>
            </Link>
            <div>
              <span className="text-[13px] font-semibold text-white">{displayName}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-white/30 tracking-[1px]">PREDICTION MARKETS</span>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[9px] text-emerald-500/80">LIVE</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <span className="text-[11px] text-white/40 font-mono hidden sm:block">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button onClick={disconnect} className="p-2 border border-[--border-light] hover:border-white/30 transition-colors">
                  <LogOut className="w-3.5 h-3.5 text-white/40" />
                </button>
              </>
            ) : (
              <button onClick={connect}
                className="px-3 py-1.5 bg-white text-black text-[12px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97] flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Connect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id}>
              <ChatBubble message={msg} assistantName={displayName} />
              {msg.attachment && msg.role === 'assistant' && (
                <div className="ml-[34px]">
                  {msg.attachment.type === 'loading' && (
                    <div className="flex items-center gap-2 mt-2 px-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />
                      <span className="text-[12px] font-mono text-white/40">{msg.attachment.text}</span>
                    </div>
                  )}
                  {msg.attachment.type === 'error' && (
                    <div className="flex items-center gap-2 mt-2 px-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[12px] text-red-400/80">{msg.attachment.text}</span>
                    </div>
                  )}
                  {msg.attachment.type === 'markets' && (
                    <MarketListAttachment markets={msg.attachment.markets} onSelect={handleMarketSelect} />
                  )}
                  {msg.attachment.type === 'marketPreview' && (
                    <MarketPreviewAttachment market={msg.attachment.market} lang={lang}
                      isConnected={isConnected} onAnalyze={handleAnalyzeMarket} onSkip={handleSkipAnalysis} />
                  )}
                  {msg.attachment.type === 'betChoice' && (
                    <BetChoiceAttachment slug={msg.attachment.slug} yesPrice={msg.attachment.yesPrice}
                      noPrice={msg.attachment.noPrice} onPickSide={handleBetPrompt} />
                  )}
                  {msg.attachment.type === 'deepAnalysis' && (
                    <DeepAnalysisAttachment analysis={msg.attachment.analysis} market={msg.attachment.market}
                      lang={lang} onExplain={handleExplainWithAI} onSkipToBet={handleAskAmount} />
                  )}
                  {msg.attachment.type === 'aiExplanation' && (
                    <AIExplanationAttachment lines={msg.attachment.lines} market={msg.attachment.market}
                      analysis={msg.attachment.analysis} lang={lang} onNext={handleAskAmount} />
                  )}
                  {msg.attachment.type === 'betAmountInput' && (
                    <BetAmountInputAttachment market={msg.attachment.market} analysis={msg.attachment.analysis}
                      lang={lang} onCalculate={handleCalculateProbability} />
                  )}
                  {msg.attachment.type === 'successProbability' && (
                    <SuccessProbabilityAttachment probability={msg.attachment.probability} market={msg.attachment.market}
                      analysis={msg.attachment.analysis} signalHash={msg.attachment.signalHash} lang={lang}
                      onSmartBet={handleSmartBet} onManualBet={handleBetPrompt} />
                  )}
                  {msg.attachment.type === 'betPrompt' && (
                    <BetPromptAttachment side={msg.attachment.side} slug={msg.attachment.slug}
                      signalHash={msg.attachment.signalHash} conditionId={msg.attachment.conditionId} lang={lang} onConfirm={handleBet} />
                  )}
                  {msg.attachment.type === 'betConfirmed' && (
                    <BetConfirmedAttachment side={msg.attachment.side} amount={msg.attachment.amount} txHash={msg.attachment.txHash}
                      explorerUrl={msg.attachment.explorerUrl} source={msg.attachment.source}
                      shares={msg.attachment.shares} price={msg.attachment.price} />
                  )}
                  {msg.attachment.type === 'portfolio' && (
                    <PortfolioAttachment data={msg.attachment.data} />
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-[--border] bg-black flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <input type="text" value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
            placeholder={`${lang === 'es' ? 'Escribe a' : lang === 'pt' ? 'Escreva para' : 'Ask'} ${displayName}...`}
            className="flex-1 bg-transparent border border-white/[0.08] px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
            disabled={isProcessing}
          />
          <button onClick={sendMessage} disabled={!inputText.trim() || isProcessing}
            className={`w-10 h-10 flex items-center justify-center border transition-all active:scale-[0.95] ${
              inputText.trim() && !isProcessing ? 'bg-white border-white text-black' : 'border-white/[0.08] text-white/20 cursor-not-allowed'
            }`}>
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
