import Anthropic from '@anthropic-ai/sdk'
import type { TemplateField } from './parsers'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ExtractedField {
  value: string | null
  confidence: number
  source: string
  reasoning: string
}

export interface ExtractionResult {
  fields: Record<string, ExtractedField>
}

export async function extractFieldsFromDocuments(
  templateFields: TemplateField[],
  documents: Array<{ name: string; content: string; fileType: string }>
): Promise<ExtractionResult> {
  const fieldList = templateFields
    .map(f => `  - ${f.name}  (appears as: ${f.placeholder})`)
    .join('\n')

  const MAX_CHARS_PER_DOC = 12000
  const docBlocks = documents
    .map(
      (d, i) =>
        `=== SOURCE ${i + 1}: "${d.name}" [${d.fileType.toUpperCase()}] ===\n` +
        d.content.slice(0, MAX_CHARS_PER_DOC) +
        (d.content.length > MAX_CHARS_PER_DOC ? '\n[... truncated ...]' : '')
    )
    .join('\n\n')

  const prompt = `You are an expert legal document analyst. Your task is to extract specific information from the provided source documents and map it to named template fields.

TEMPLATE FIELDS TO FILL:
${fieldList}

SOURCE DOCUMENTS:
${docBlocks}

RULES:
- Be precise. Extract actual values, not descriptions.
- Dates: use the format found in the document, or "DD Month YYYY" if reformatting is needed.
- Names and entities: use exact spelling and capitalisation as found in the source.
- If a field appears with conflicting values across documents, prefer the most authoritative or most recent.
- If a field is genuinely not present in any document, set value to null and confidence to 0.
- confidence is a float from 0.0 (not found) to 1.0 (found exactly).

Return ONLY a valid JSON object, no other text, no markdown fences:
{
  "fields": {
    "FIELD_NAME": {
      "value": "extracted value or null",
      "confidence": 0.95,
      "source": "Source name, section or context",
      "reasoning": "One sentence explaining the extraction"
    }
  }
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text =
    response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI response was not valid JSON')

  return JSON.parse(jsonMatch[0]) as ExtractionResult
}
