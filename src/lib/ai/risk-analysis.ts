// AI risk analysis — uses Claude API with structured JSON output (tool use)
// Виконується лише для замовлень типу FULL після отримання даних DZK + DRRP.
// Результат зберігається в Order.rawJson.aiAnalysis

import Anthropic from '@anthropic-ai/sdk'

// ── Types ─────────────────────────────────────────────────────────────

export interface RiskFactor {
  category:    'ownership' | 'encumbrances' | 'legal' | 'cadastral' | 'financial'
  severity:    'low' | 'medium' | 'high' | 'critical'
  title:       string   // ≤ 60 chars, Ukrainian
  description: string   // 1-3 sentences, Ukrainian
  recommendation: string // actionable next step, Ukrainian
}

export interface AiRiskAnalysis {
  overallRisk:  'low' | 'medium' | 'high' | 'critical'
  score:        number         // 0-100, вищий = більше ризику
  summary:      string         // 2-4 речення, Ukrainian
  factors:      RiskFactor[]
  disclaimer:   string
  generatedAt:  string         // ISO timestamp
  model:        string
}

// ── Input shape (from DZK + DRRP responses) ───────────────────────────

export interface ParcelData {
  kadnum:  string
  dzk?: {
    area?:        string
    purpose?:     string
    ownerType?:   string
    coordsValid?: boolean
    restrictions?: string[]
  }
  drrp?: {
    owners?:       { fullName: string; ownerType: string; share?: string }[]
    encumbrances?: { type: string; creditor?: string; amount?: string }[]
    restrictions?: { type: string; authority?: string }[]
    mortgages?:    { creditor: string; amount?: string; registered?: string }[]
    transactions?: { date: string; type: string }[]
    lastUpdate?:   string
  }
}

// ── Anthropic tool definition ─────────────────────────────────────────

const RISK_TOOL: Anthropic.Tool = {
  name: 'report_risk_analysis',
  description:
    'Report the structured risk analysis for a Ukrainian land parcel based on DZK and DRRP data.',
  input_schema: {
    type: 'object' as const,
    required: ['overallRisk', 'score', 'summary', 'factors', 'disclaimer'],
    properties: {
      overallRisk: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Overall risk level for the parcel.',
      },
      score: {
        type: 'number',
        description: 'Risk score from 0 (no risk) to 100 (maximum risk).',
      },
      summary: {
        type: 'string',
        description: '2-4 sentence summary of key findings in Ukrainian.',
      },
      factors: {
        type: 'array',
        description: 'List of identified risk factors.',
        items: {
          type: 'object',
          required: ['category', 'severity', 'title', 'description', 'recommendation'],
          properties: {
            category: {
              type: 'string',
              enum: ['ownership', 'encumbrances', 'legal', 'cadastral', 'financial'],
            },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            title:          { type: 'string' },
            description:    { type: 'string' },
            recommendation: { type: 'string' },
          },
        },
      },
      disclaimer: {
        type: 'string',
        description: 'Legal disclaimer in Ukrainian. Always include.',
      },
    },
  },
}

// ── Singleton Anthropic client ─────────────────────────────────────────

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

// ── Main function ──────────────────────────────────────────────────────

export async function analyzeParcelRisk(data: ParcelData): Promise<AiRiskAnalysis> {
  const client = getClient()

  const systemPrompt = `Ти — юридичний аналітик з нерухомості в Україні.
Аналізуй дані земельних ділянок з ДЗК і ДРРП та визначай ризики для покупця.
Відповідай ВИКЛЮЧНО українською мовою.
Будь точним, практичним і об'єктивним. Не вигадуй дані яких немає.
Враховуй чинне законодавство України, включно з обмеженнями воєнного часу.`

  const userMessage = `Проаналізуй земельну ділянку з такими даними:

Кадастровий номер: ${data.kadnum}

${data.dzk ? `ДЗК дані:
- Площа: ${data.dzk.area ?? 'невідомо'}
- Цільове призначення: ${data.dzk.purpose ?? 'невідомо'}
- Тип власності: ${data.dzk.ownerType ?? 'невідомо'}
- Координати валідні: ${data.dzk.coordsValid ?? 'невідомо'}
- Обмеження в ДЗК: ${data.dzk.restrictions?.join(', ') || 'немає'}` : 'ДЗК дані: недоступні'}

${data.drrp ? `ДРРП дані:
- Власники: ${data.drrp.owners?.map((o) => `${o.ownerType === 'LEGAL' ? '[ЮО]' : '[ФО]'} частка: ${o.share ?? 'повна'}`).join('; ') ?? 'невідомо'}
- Обтяження: ${data.drrp.encumbrances?.map((e) => e.type).join(', ') || 'відсутні'}
- Заборони: ${data.drrp.restrictions?.map((r) => r.type).join(', ') || 'відсутні'}
- Іпотеки: ${data.drrp.mortgages?.map((m) => `${m.creditor}${m.amount ? ` (${m.amount})` : ''}`).join(', ') || 'відсутні'}
- Останні угоди: ${data.drrp.transactions?.slice(0, 3).map((t) => `${t.type} (${t.date})`).join(', ') || 'немає'}
- Дата оновлення реєстру: ${data.drrp.lastUpdate ?? 'невідомо'}` : 'ДРРП дані: недоступні'}

Визнач ризики і заповни інструмент report_risk_analysis.`

  const response = await client.messages.create({
    model:      'claude-opus-4-5',
    max_tokens: 2048,
    system:     systemPrompt,
    tools:      [RISK_TOOL],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: userMessage }],
  })

  // Extract tool use block
  const toolBlock = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  if (!toolBlock) {
    throw new Error('AI did not call the risk analysis tool')
  }

  const result = toolBlock.input as Omit<AiRiskAnalysis, 'generatedAt' | 'model'>

  return {
    ...result,
    generatedAt: new Date().toISOString(),
    model:       'claude-opus-4-5',
  }
}
