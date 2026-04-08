import { NextResponse } from 'next/server'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

async function callClaudeChat(systemPrompt, messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada')

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Erro na API Anthropic: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data.content[0].text
}

async function callClaude(systemPrompt, userMessage) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada. Adicione no arquivo .env.local')
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Erro na API Anthropic: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data.content[0].text
}

// ── Processar cronograma → tópicos ────────────────────────────────────────────
async function processarCronograma({ materiaNome, texto }) {
  const system = `Você é um assistente especializado em medicina e planejamento de estudos.
Sua tarefa é analisar um cronograma ou conteúdo programático de uma disciplina médica e extrair os tópicos de estudo de forma estruturada.
Responda APENAS com JSON válido, sem markdown, sem explicação.`

  const user = `Disciplina: ${materiaNome}

Cronograma/conteúdo programático:
${texto}

Extraia os tópicos de estudo. Para cada tópico, estime as horas necessárias baseado na complexidade típica em medicina.
Retorne um JSON com este formato exato:
{
  "topicos": [
    { "titulo": "nome do tópico", "horas": 2 },
    ...
  ]
}
Máximo de 30 tópicos. Agrupe assuntos muito similares. Seja específico nos nomes (ex: "Hipertensão arterial sistêmica" não apenas "HAS").`

  const raw = await callClaude(system, user)
  const parsed = JSON.parse(raw.trim())
  return parsed.topicos || []
}

// ── Gerar plano semanal com IA ─────────────────────────────────────────────────
async function gerarPlanoIA({ materias, provas, simulados, disponibilidade, aulas, diasAVista }) {
  const system = `Você é um coach de estudos especializado em medicina no Brasil.
Sua tarefa é criar um plano de estudos semanal detalhado e realista.
Responda APENAS com JSON válido, sem markdown, sem explicação.`

  // Monta contexto resumido
  const hoje = new Date().toISOString().slice(0, 10)
  const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

  const materiasCtx = materias.map((m) => ({
    id: m.id,
    nome: m.name,
    fase: m.fase || '',
    metaHoras: m.weeklyGoalHours,
    topicos: (m.topics || [])
      .filter((t) => t.status !== 'feito')
      .slice(0, 10)
      .map((t) => t.title),
  }))

  const provasCtx = provas
    .filter((p) => p.data >= hoje)
    .map((p) => {
      const diasAte = Math.ceil((new Date(p.data + 'T12:00:00') - new Date(hoje + 'T12:00:00')) / 86400000)
      const mat = materias.find((m) => m.id === p.materiaId)
      return { titulo: p.titulo, materia: mat?.name || 'Geral', diasRestantes: diasAte }
    })

  const simCtx = simulados.slice(0, 20).map((s) => {
    const mat = materias.find((m) => m.id === s.materiaId)
    return { materia: mat?.name || 'Geral', aproveitamento: s.aproveitamento }
  })

  const aulasCtx = aulas.map((a) => ({
    dia: DAY_NAMES[a.dow],
    horario: `${a.start}–${a.end}`,
    nome: a.nome,
  }))

  const dispCtx = disponibilidade.map((d) => ({
    dia: DAY_NAMES[d.dow],
    slots: d.slots.map((s) => `${s.start}–${s.end}`),
  }))

  // Gera os próximos N dias
  const datas = Array.from({ length: diasAVista }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dk = d.toISOString().slice(0, 10)
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
    return { data: dk, dia: DAY_NAMES[dow], dow }
  })

  const user = `Crie um plano de estudos para os próximos ${diasAVista} dias.

MATÉRIAS E TÓPICOS PENDENTES:
${JSON.stringify(materiasCtx, null, 2)}

PROVAS PRÓXIMAS:
${JSON.stringify(provasCtx, null, 2)}

HISTÓRICO DE SIMULADOS:
${JSON.stringify(simCtx, null, 2)}

AULAS FIXAS (não podem ter estudo nesse horário):
${JSON.stringify(aulasCtx, null, 2)}

HORÁRIOS DISPONÍVEIS PARA ESTUDO:
${JSON.stringify(dispCtx, null, 2)}

DATAS DISPONÍVEIS:
${JSON.stringify(datas, null, 2)}

INSTRUÇÕES:
- Priorize matérias com prova chegando (especialmente ≤7 dias)
- Priorize matérias com simulado abaixo de 60%
- Distribua as matérias por meta semanal de horas
- Para cada bloco, sugira um tópico específico da lista de pendentes
- Respeite EXATAMENTE os horários disponíveis (não coloque fora dos slots)
- Blocos de 45 a 90 minutos
- Não sobreponha com aulas

Retorne JSON com este formato exato:
{
  "blocos": [
    {
      "data": "2026-04-07",
      "materiaId": "id-da-materia",
      "topico": "Nome específico do tópico",
      "startTime": "19:00",
      "endTime": "20:30",
      "justificativa": "breve razão (ex: prova em 5 dias)"
    }
  ],
  "resumo": "2-3 frases explicando a lógica do plano gerado"
}`

  const raw = await callClaude(system, user)
  const parsed = JSON.parse(raw.trim())
  return parsed
}

// ── Gerar Flashcards com IA ───────────────────────────────────────────────────
async function gerarFlashcards({ materiaNome, topico, quantidade }) {
  const system = `Você é um especialista em medicina e educação.
Sua tarefa é criar flashcards de alta qualidade para estudo de medicina.
Responda APENAS com JSON válido, sem markdown, sem explicação.`

  const user = `Crie ${quantidade || 10} flashcards para o tópico abaixo.
Matéria: ${materiaNome}
Tópico: ${topico}

Regras:
- Frente: pergunta objetiva e clara (como seria numa prova de residência)
- Verso: resposta direta, completa mas concisa
- Foque em: fisiopatologia, diagnóstico, tratamento, critérios diagnósticos, doses
- Varie o tipo: definições, mecanismos, condutas, diferenciais
- Nível: residência médica brasileira

Retorne JSON exato:
{
  "flashcards": [
    { "frente": "pergunta", "verso": "resposta", "dificuldade": 3 },
    ...
  ]
}
Dificuldade: 1=muito fácil, 2=fácil, 3=médio, 4=difícil, 5=muito difícil`

  const raw = await callClaude(system, user)
  const parsed = JSON.parse(raw.trim())
  return parsed.flashcards || []
}

// ── Agente de Rotina Semanal ──────────────────────────────────────────────────
async function agenteRotina({ messages, contexto }) {
  const hoje = new Date().toISOString().slice(0, 10)
  const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

  const datas = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dk = d.toISOString().slice(0, 10)
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
    return { data: dk, dia: DAY_NAMES[dow] }
  })

  const system = `Você é um assistente de planejamento semanal para um estudante de medicina no Brasil.
Seu papel é ajudar o usuário a montar o cronograma da semana de forma conversacional e prática.

CONTEXTO ATUAL DO USUÁRIO:
- Data de hoje: ${hoje}
- Próximos 7 dias: ${datas.map((d) => `${d.dia} (${d.data})`).join(', ')}
- Matérias: ${JSON.stringify(contexto.materias?.map((m) => ({ id: m.id, nome: m.name, metaHoras: m.weeklyGoalHours })))}
- Provas próximas: ${JSON.stringify(contexto.provas?.filter((p) => p.data >= hoje).map((p) => ({ titulo: p.titulo, data: p.data })))}
- Aulas fixas: ${JSON.stringify(contexto.aulas?.map((a) => ({ dia: DAY_NAMES[a.dow], horario: `${a.start}-${a.end}`, nome: a.nome })))}
- Horários livres configurados: ${JSON.stringify(contexto.disponibilidade?.map((d) => ({ dia: DAY_NAMES[d.dow], slots: d.slots.map((s) => `${s.start}-${s.end}`) })))}

COMO AGIR:
1. Converse naturalmente. O usuário vai te contar o que precisa fazer na semana
2. Quando tiver informação suficiente, gere o plano
3. Quando gerar um plano, inclua um JSON no final da resposta dentro de <PLANO>...</PLANO>
4. O JSON deve seguir este formato exato:
{
  "blocos": [
    { "data": "2026-04-07", "materiaId": "id-ou-null", "titulo": "Título do bloco", "startTime": "19:00", "endTime": "20:30", "categoria": "estudo", "icone": "📚", "nota": "" }
  ]
}
5. Categorias possíveis: estudo, treino, pessoal, casa, trabalho, saude, lazer
6. Ícones sugeridos: 📚 estudo, 💪 treino, 🍳 alimentação, 🛏️ casa, 💼 trabalho, 🏥 saúde, 🎮 lazer
7. Use materiaId apenas para blocos de estudo onde a matéria existe no contexto
8. Se o usuário pedir ajuste, modifique o plano e retorne um novo <PLANO>
9. Seja direto e prático. Máximo 3-4 frases de resposta antes do plano.
10. Responda sempre em português brasileiro.`

  const reply = await callClaudeChat(system, messages)
  return reply
}

// ── Agente Financeiro ─────────────────────────────────────────────────────────
async function agenteFinanceiro({ messages, contexto }) {
  const hoje = new Date()
  const mesAtual = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Resume os dados financeiros
  const txs = (contexto.transactions || []).slice(0, 100)
  const receitas = txs.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0)
  const despesas = txs.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)
  const saldo = receitas - despesas

  const porCategoria = {}
  txs.filter((t) => t.type === 'despesa').forEach((t) => {
    const cat = contexto.categories?.find((c) => c.id === t.category)?.label || t.category || 'Outros'
    porCategoria[cat] = (porCategoria[cat] || 0) + t.amount
  })

  const system = `Você é um agente financeiro pessoal para um estudante de medicina no Brasil.
Você analisa os dados financeiros reais do usuário e dá conselhos práticos, diretos e personalizados.

DADOS FINANCEIROS DO USUÁRIO (${mesAtual}):
- Receitas: R$ ${receitas.toFixed(2)}
- Despesas: R$ ${despesas.toFixed(2)}
- Saldo: R$ ${saldo.toFixed(2)}
- Gastos por categoria: ${JSON.stringify(porCategoria, null, 2)}
- Meta financeira: ${JSON.stringify(contexto.finGoal)}
- Orçamentos: ${JSON.stringify(contexto.budgets)}
- Últimas transações: ${JSON.stringify(txs.slice(0, 20).map((t) => ({ tipo: t.type, valor: t.amount, categoria: t.category, desc: t.description, data: t.date })))}

COMO AGIR:
1. Responda perguntas sobre os dados financeiros reais acima
2. Dê conselhos práticos baseados nos dados reais — não invente números
3. Identifique padrões de gasto, oportunidades de economia e riscos
4. Para estudantes de medicina: considere o contexto de renda limitada, gastos com faculdade/cursinho e futuro financeiro
5. Seja direto: "você gastou X em Y, isso é Z% da sua renda"
6. Sugira metas realistas baseadas nos dados reais
7. Responda sempre em português brasileiro, em no máximo 150 palavras por resposta`

  const reply = await callClaudeChat(system, messages)
  return reply
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { action, payload } = await request.json()

    if (action === 'processar-cronograma') {
      const topicos = await processarCronograma(payload)
      return NextResponse.json({ topicos })
    }

    if (action === 'gerar-plano') {
      const resultado = await gerarPlanoIA(payload)
      return NextResponse.json(resultado)
    }

    if (action === 'gerar-flashcards') {
      const flashcards = await gerarFlashcards(payload)
      return NextResponse.json({ flashcards })
    }

    if (action === 'agente-rotina') {
      const reply = await agenteRotina(payload)
      return NextResponse.json({ reply })
    }

    if (action === 'agente-financeiro') {
      const reply = await agenteFinanceiro(payload)
      return NextResponse.json({ reply })
    }

    return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  } catch (err) {
    console.error('[AI Route]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
