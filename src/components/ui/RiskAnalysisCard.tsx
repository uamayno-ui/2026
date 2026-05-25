'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, AlertTriangle, AlertOctagon, Info, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import type { AiRiskAnalysis, RiskFactor } from '@/lib/ai/risk-analysis'

// ── Risk colour mapping ────────────────────────────────────────────────

const RISK_CONFIG = {
  low:      { label: 'Низький ризик',      bg: 'bg-surface-green', text: 'text-success',   border: 'border-success/20',   Icon: ShieldCheck    },
  medium:   { label: 'Середній ризик',     bg: 'bg-amber-50',      text: 'text-amber-700', border: 'border-amber-200',    Icon: AlertTriangle  },
  high:     { label: 'Високий ризик',      bg: 'bg-red-50',        text: 'text-red-700',   border: 'border-red-200',      Icon: AlertOctagon   },
  critical: { label: 'Критичний ризик',    bg: 'bg-red-100',       text: 'text-red-800',   border: 'border-red-300',      Icon: AlertOctagon   },
} as const

const CATEGORY_LABELS: Record<RiskFactor['category'], string> = {
  ownership:    'Право власності',
  encumbrances: 'Обтяження',
  legal:        'Юридичний',
  cadastral:    'Кадастровий',
  financial:    'Фінансовий',
}

// ── Sub-components ─────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score < 25 ? 'bg-success' : score < 50 ? 'bg-amber-400' : score < 75 ? 'bg-orange-500' : 'bg-red-600'
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

function FactorCard({ factor }: { factor: RiskFactor }) {
  const [open, setOpen] = useState(false)
  const cfg = RISK_CONFIG[factor.severity]

  return (
    <div className={`border rounded-lg overflow-hidden ${cfg.border}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <cfg.Icon size={16} strokeWidth={1.5} className={`shrink-0 ${cfg.text}`} />
        <div className="flex-1 min-w-0">
          <span className="text-[14px] font-medium">{factor.title}</span>
          <span className="ml-2 text-[11px] text-gray-400">{CATEGORY_LABELS[factor.category]}</span>
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} shrink-0`}>
          {factor.severity === 'low' ? 'низький' : factor.severity === 'medium' ? 'середній' : factor.severity === 'high' ? 'високий' : 'критичний'}
        </span>
        {open ? <ChevronUp size={14} className="shrink-0 text-gray-400" /> : <ChevronDown size={14} className="shrink-0 text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 space-y-2.5 bg-white border-t border-gray-100">
          <p className="text-[13px] text-gray-700 leading-relaxed">{factor.description}</p>
          <div className="flex gap-2 items-start">
            <Info size={13} className="shrink-0 text-gray-400 mt-0.5" />
            <p className="text-[12px] text-gray-500 italic leading-relaxed">{factor.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main card ─────────────────────────────────────────────────────────

interface RiskAnalysisCardProps {
  orderId?: string
  analysis?: AiRiskAnalysis
  className?: string
}

export default function RiskAnalysisCard({ orderId, analysis: initialAnalysis, className = '' }: RiskAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<AiRiskAnalysis | null>(initialAnalysis ?? null)
  const [loading, setLoading]   = useState(!initialAnalysis && !!orderId)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (initialAnalysis || !orderId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/order/${orderId}/analysis`)
        if (res.status === 202) {
          // Not ready yet — retry after 10s
          if (!cancelled) setTimeout(load, 10_000)
          return
        }
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({}))
          setError(msg ?? 'Помилка завантаження аналізу')
          return
        }
        const data = await res.json()
        if (!cancelled) setAnalysis(data)
      } catch {
        if (!cancelled) setError('Мережева помилка')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [orderId, initialAnalysis])

  if (loading) {
    return (
      <div className={`border border-gray-200 rounded-xl p-6 flex items-center gap-3 ${className}`}>
        <Loader2 size={18} className="animate-spin text-gray-400" />
        <div>
          <p className="text-[14px] font-medium">AI аналізує ділянку…</p>
          <p className="text-[12px] text-gray-500">Зазвичай займає 15–30 секунд</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`border border-gray-200 rounded-xl p-6 ${className}`}>
        <p className="text-[14px] text-gray-500">{error}</p>
      </div>
    )
  }

  if (!analysis) return null

  const cfg = RISK_CONFIG[analysis.overallRisk]

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-5 py-4 ${cfg.bg} border-b ${cfg.border} flex items-center gap-3`}>
        <cfg.Icon size={22} strokeWidth={1.5} className={cfg.text} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4 mb-1">
            <h3 className="text-[16px] font-semibold">{cfg.label}</h3>
            <span className={`text-[13px] font-mono font-medium ${cfg.text}`}>{analysis.score}/100</span>
          </div>
          <ScoreBar score={analysis.score} />
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[14px] leading-relaxed text-gray-700">{analysis.summary}</p>
      </div>

      {/* Risk factors */}
      {analysis.factors.length > 0 && (
        <div className="px-5 py-4 space-y-2 border-b border-gray-100">
          <h4 className="text-[12px] font-medium uppercase tracking-[0.05em] text-gray-400 mb-3">
            Фактори ризику ({analysis.factors.length})
          </h4>
          {analysis.factors.map((factor, i) => (
            <FactorCard key={i} factor={factor} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-5 py-3 bg-surface-soft">
        <p className="text-[11px] text-gray-400 leading-relaxed">{analysis.disclaimer}</p>
      </div>
    </div>
  )
}
