// Mayno — PDF report generator (FULL order type)
// Uses @react-pdf/renderer (Yoga-based layout, not DOM/CSS)
// Generates a branded report: parcel info + DRRP summary + AI risk analysis.

import {
  Document, Page, Text, View, StyleSheet, Font,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { AiRiskAnalysis } from '@/lib/ai/risk-analysis'

// ── Register fonts ─────────────────────────────────────────────────────
// @react-pdf uses its own font system; we fall back to Helvetica (built-in)
// until custom fonts are bundled in /public/fonts/. Helvetica renders clean.

// ── Styles ─────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:         10,
    color:            '#0A0A0A',
    backgroundColor:  '#FFFFFF',
    paddingTop:       48,
    paddingBottom:    56,
    paddingHorizontal: 52,
  },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  logo:   { fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5 },
  logoGreen: { color: '#22C55E' },
  headerMeta: { fontSize: 8, color: '#6B7280', textAlign: 'right' },

  // Section
  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  // Info grid
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  label: { fontSize: 8, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, width: '35%' },
  value: { fontSize: 10, fontFamily: 'Helvetica-Bold', width: '63%', textAlign: 'right' },

  // Risk score
  scoreWrap:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  scoreBox:   { width: 52, height: 52, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  scoreNum:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  scoreMeta:  { flex: 1 },
  scoreLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  scoreSub:   { fontSize: 9, color: '#6B7280' },

  // Bar
  barTrack: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 12 },
  barFill:  { height: 6, borderRadius: 4 },

  // Summary
  summary: { fontSize: 10, lineHeight: 1.6, color: '#374151', marginBottom: 16 },

  // Factors
  factorCard:    { backgroundColor: '#F8F9FB', borderRadius: 6, padding: 10, marginBottom: 8 },
  factorHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  factorTitle:   { fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1 },
  severityBadge: { fontSize: 7, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontFamily: 'Helvetica-Bold' },
  factorDesc:    { fontSize: 9, color: '#4B5563', lineHeight: 1.5, marginBottom: 4 },
  factorRec:     { fontSize: 9, color: '#1D4ED8', fontFamily: 'Helvetica-Oblique', lineHeight: 1.4 },

  // Footer
  footer:     { position: 'absolute', bottom: 20, left: 52, right: 52 },
  footerLine: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#9CA3AF' },

  // Disclaimer
  disclaimer: { backgroundColor: '#FFFBEB', borderRadius: 6, padding: 10, marginTop: 16 },
  disclaimerText: { fontSize: 8, color: '#92400E', lineHeight: 1.5 },

  // Cover divider
  divider: { borderBottomWidth: 2, borderBottomColor: '#22C55E', marginBottom: 24, width: 40 },

  // Page number
  pageNumber: { fontSize: 7, color: '#9CA3AF' },
})

// ── Helpers ────────────────────────────────────────────────────────────
function riskColor(level: string): string {
  return { low: '#22C55E', medium: '#F59E0B', high: '#EF4444', critical: '#7C3AED' }[level] ?? '#6B7280'
}
function riskLabel(level: string): string {
  return { low: 'Низький', medium: 'Середній', high: 'Високий', critical: 'Критичний' }[level] ?? level
}
function categoryLabel(cat: string): string {
  return {
    ownership:    'Право власності',
    encumbrances: 'Обтяження',
    legal:        'Правовий статус',
    cadastral:    'Кадастровий облік',
    financial:    'Фінансові ризики',
  }[cat] ?? cat
}

// ── PDF Document ───────────────────────────────────────────────────────
interface ReportProps {
  kadnum:   string
  address?: string
  area?:    string
  purpose?: string
  analysis: AiRiskAnalysis
  generatedAt: Date
}

function MaynoReport({ kadnum, address, area, purpose, analysis, generatedAt }: ReportProps) {
  const riskCol  = riskColor(analysis.overallRisk)
  const barWidth = `${analysis.score}%`

  return (
    <Document
      title={`Повний звіт — ${kadnum}`}
      author="Mayno"
      subject="Аналіз земельної ділянки"
      creator="mayno.ua"
      producer="@react-pdf/renderer"
    >
      {/* ── Page 1: cover + info + AI summary ── */}
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.logo}>
            <Text>may</Text>
            <Text style={S.logoGreen}>no</Text>
          </Text>
          <Text style={S.headerMeta}>
            {'mayno.ua\n'}
            {generatedAt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Title */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 6, letterSpacing: -0.5 }}>
            Повний звіт
          </Text>
          <View style={S.divider} />
          <Text style={{ fontFamily: 'Helvetica', fontSize: 11, color: '#6B7280', letterSpacing: 0.5 }}>
            {kadnum}
          </Text>
          {address && (
            <Text style={{ fontSize: 10, color: '#374151', marginTop: 4 }}>{address}</Text>
          )}
        </View>

        {/* Parcel info */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Дані ділянки</Text>
          <View style={S.row}>
            <Text style={S.label}>Кадастровий №</Text>
            <Text style={[S.value, { fontFamily: 'Helvetica-BoldOblique', fontSize: 9 }]}>{kadnum}</Text>
          </View>
          {area && (
            <View style={S.row}>
              <Text style={S.label}>Площа</Text>
              <Text style={S.value}>{area}</Text>
            </View>
          )}
          {purpose && (
            <View style={S.row}>
              <Text style={S.label}>Цільове призначення</Text>
              <Text style={S.value}>{purpose}</Text>
            </View>
          )}
          <View style={S.row}>
            <Text style={S.label}>Аналіз підготовлено</Text>
            <Text style={S.value}>
              {generatedAt.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* AI risk overview */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>AI-аналіз ризиків</Text>

          <View style={S.scoreWrap}>
            <View style={[S.scoreBox, { backgroundColor: riskCol }]}>
              <Text style={S.scoreNum}>{analysis.score}</Text>
            </View>
            <View style={S.scoreMeta}>
              <Text style={S.scoreLabel}>{riskLabel(analysis.overallRisk)} ризик</Text>
              <Text style={S.scoreSub}>Індекс ризику: {analysis.score}/100</Text>
            </View>
          </View>

          {/* Score bar */}
          <View style={S.barTrack}>
            {/* @react-pdf doesn't support dynamic width strings — we use nested view hack */}
            <View style={[S.barFill, { width: barWidth as unknown as number, backgroundColor: riskCol }]} />
          </View>

          <Text style={S.summary}>{analysis.summary}</Text>
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <View style={S.footerLine}>
            <Text style={S.footerText}>Mayno — mayno.ua · Документ сформовано автоматично</Text>
            <Text style={S.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </View>
      </Page>

      {/* ── Page 2: risk factors ── */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.logo}>
            <Text>may</Text>
            <Text style={S.logoGreen}>no</Text>
          </Text>
          <Text style={S.headerMeta}>Повний звіт · {kadnum}</Text>
        </View>

        <View style={S.section}>
          <Text style={S.sectionTitle}>Виявлені фактори ризику</Text>

          {analysis.factors.length === 0 && (
            <Text style={[S.summary, { color: '#22C55E' }]}>
              Жодних суттєвих ризиків не виявлено.
            </Text>
          )}

          {analysis.factors.map((factor, i) => (
            <View key={i} style={S.factorCard} wrap={false}>
              <View style={S.factorHeader}>
                <Text style={S.factorTitle}>{factor.title}</Text>
                <View style={[S.severityBadge, { backgroundColor: riskColor(factor.severity) }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 7 }}>{riskLabel(factor.severity).toUpperCase()}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 8, color: '#9CA3AF', marginBottom: 4 }}>
                {categoryLabel(factor.category)}
              </Text>
              <Text style={S.factorDesc}>{factor.description}</Text>
              <Text style={S.factorRec}>Рекомендація: {factor.recommendation}</Text>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={S.disclaimer}>
          <Text style={S.disclaimerText}>{analysis.disclaimer}</Text>
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <View style={S.footerLine}>
            <Text style={S.footerText}>Mayno — mayno.ua · Документ сформовано автоматично</Text>
            <Text style={S.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ── Public API ─────────────────────────────────────────────────────────
export interface ReportInput {
  kadnum:   string
  address?: string
  area?:    string
  purpose?: string
  analysis: AiRiskAnalysis
}

export async function generateReportPdf(input: ReportInput): Promise<Buffer> {
  const doc = (
    <MaynoReport
      {...input}
      generatedAt={new Date()}
    />
  )
  return renderToBuffer(doc)
}
