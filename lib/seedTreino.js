import { savePlanos } from './treino'

function mkId(i) {
  return `ppl-seed-${i}`
}

function ex(i, name, sets, reps, rest, note = '') {
  return { id: mkId(i), name, sets, reps, weight: '', rest, note }
}

export const PPL_PLANOS = [
  // ── DIA 0 · Segunda · PUSH A ─────────────────────────────────────────────────
  {
    id: 'ppl-d0',
    dayOfWeek: 0,
    name: 'Push A — Peito + Ombros + Tríceps',
    exercises: [
      ex('d0-1', 'Supino Reto (barra olímpica)', 4, '8-10', '90s'),
      ex('d0-2', 'Supino Inclinado (Hammer Strength)', 3, '10-12', '75s'),
      ex('d0-3', 'Crucifixo Inclinado (halteres)', 3, '12-15', '60s'),
      ex('d0-4', 'Desenvolvimento Ombro (Hammer Strength)', 3, '10-12', '75s'),
      ex('d0-5', 'Elevação Lateral (polia baixa unilateral)', 3, '15', '45s'),
      ex('d0-6', 'Tríceps Corda (polia alta)', 3, '12-15', '60s'),
      ex('d0-7', 'Tríceps Coice (halter + banco)', 3, '12', '60s'),
      ex('d0-c', 'Cardio — Elíptico HIIT', 1, '15min', '-', '40s forte / 20s leve · 10 rounds'),
    ],
  },

  // ── DIA 1 · Terça · PULL A ───────────────────────────────────────────────────
  {
    id: 'ppl-d1',
    dayOfWeek: 1,
    name: 'Pull A — Costas + Bíceps (largura)',
    exercises: [
      ex('d1-1', 'Puxada Frente (pegada aberta)', 4, '10-12', '90s'),
      ex('d1-2', 'Puxada Triângulo (pegada fechada)', 3, '12', '75s'),
      ex('d1-3', 'Remada Baixa Cabos (triângulo)', 3, '10-12', '75s'),
      ex('d1-4', 'Remada Unilateral (Hammer Strength)', 3, '10-12', '75s'),
      ex('d1-5', 'Pullover (polia alta)', 3, '15', '60s'),
      ex('d1-6', 'Rosca Direta (barra EZ)', 3, '12', '60s'),
      ex('d1-7', 'Rosca Martelo (halteres)', 3, '12', '60s'),
      ex('d1-c', 'Cardio — Esteira Inclinada', 1, '20min', '-', 'Inclinação 8% · velocidade 5.5-6 km/h'),
    ],
  },

  // ── DIA 2 · Quarta · LEGS A ──────────────────────────────────────────────────
  {
    id: 'ppl-d2',
    dayOfWeek: 2,
    name: 'Legs A — Quadríceps',
    exercises: [
      ex('d2-1', 'Agachamento Livre (barra olímpica)', 4, '8-10', '120s'),
      ex('d2-2', 'Leg Press 45°', 4, '12-15', '90s'),
      ex('d2-3', 'Hack Squat (máquina)', 3, '12', '90s'),
      ex('d2-4', 'Cadeira Extensora', 3, '15', '60s'),
      ex('d2-5', 'Mesa Flexora Deitada', 3, '15', '60s'),
      ex('d2-6', 'Panturrilha em Pé (máquina)', 4, '20', '45s'),
      ex('d2-c', 'Cardio — Bike (steady state)', 1, '20min', '-', 'Frequência cardíaca zona 2-3 · resistência moderada'),
    ],
  },

  // ── DIA 3 · Quinta · PUSH B ──────────────────────────────────────────────────
  {
    id: 'ppl-d3',
    dayOfWeek: 3,
    name: 'Push B — Ombros + Peito + Tríceps',
    exercises: [
      ex('d3-1', 'Desenvolvimento Halteres (banco 90°)', 4, '10-12', '90s'),
      ex('d3-2', 'Elevação Lateral (halteres)', 4, '15', '60s'),
      ex('d3-3', 'Elevação Frontal (halter ou barra EZ)', 3, '12', '60s'),
      ex('d3-4', 'Supino Máquina (Hammer Strength Chest Press)', 3, '12-15', '75s'),
      ex('d3-5', 'Voador (Peck Deck)', 3, '15', '60s'),
      ex('d3-6', 'Tríceps Francês (barra EZ deitado)', 3, '12', '75s'),
      ex('d3-7', 'Tríceps Pushdown (polia alta barra reta)', 3, '15', '60s'),
      ex('d3-c', 'Cardio — Elíptico (ritmo constante)', 1, '15min', '-', 'Zona 2 · ritmo conversacional'),
    ],
  },

  // ── DIA 4 · Sexta · PULL B ───────────────────────────────────────────────────
  {
    id: 'ppl-d4',
    dayOfWeek: 4,
    name: 'Pull B — Costas + Bíceps (espessura)',
    exercises: [
      ex('d4-1', 'Remada Curvada (barra olímpica)', 4, '8-10', '90s'),
      ex('d4-2', 'Remada Cavalinho (máquina articulada)', 3, '12', '75s'),
      ex('d4-3', 'Remada Alta Cabos (pegada aberta)', 3, '12', '75s'),
      ex('d4-4', 'Puxada Supinada (lat pulldown)', 3, '12', '75s'),
      ex('d4-5', 'Face Pull (polia alta + corda)', 3, '20', '45s'),
      ex('d4-6', 'Rosca Concentrada (halter unilateral)', 3, '12', '60s'),
      ex('d4-7', 'Rosca Scott (banco Scott + barra EZ)', 3, '12', '60s'),
      ex('d4-c', 'Cardio — Esteira HIIT', 1, '20min', '-', '1min corrida (10 km/h) + 1min caminhada (5 km/h) · 10 rounds'),
    ],
  },

  // ── DIA 5 · Sábado · LEGS B ──────────────────────────────────────────────────
  {
    id: 'ppl-d5',
    dayOfWeek: 5,
    name: 'Legs B — Posterior + Glúteo',
    exercises: [
      ex('d5-1', 'Stiff (barra olímpica)', 4, '10-12', '90s'),
      ex('d5-2', 'Mesa Flexora Deitada', 4, '12', '75s'),
      ex('d5-3', 'Cadeira Flexora Sentada', 3, '15', '60s'),
      ex('d5-4', 'Hip Thrust (banco + barra)', 4, '12', '90s'),
      ex('d5-5', 'Afundo (halteres · área livre)', 3, '12 cada', '75s'),
      ex('d5-6', 'Abdução (máquina)', 3, '20', '45s'),
      ex('d5-7', 'Panturrilha Sentado (máquina)', 4, '20', '45s'),
      ex('d5-c', 'Cardio — Bike HIIT', 1, '20min', '-', '30s máximo + 30s leve · 15 rounds · queima de gordura'),
    ],
  },

  // ── DIA 6 · Domingo · CARDIO ATIVO ───────────────────────────────────────────
  {
    id: 'ppl-d6',
    dayOfWeek: 6,
    name: 'Cardio Ativo — Emagrecimento',
    exercises: [
      ex('d6-1', 'Aquecimento — Esteira Caminhada', 1, '5min', '-', 'Vel 5 km/h · ativa a circulação'),
      ex('d6-2', 'Bike HIIT', 1, '15min', '-', '40s sprint máximo + 20s leve · 15 rounds'),
      ex('d6-3', 'Esteira Inclinada (fat burn)', 1, '20min', '-', 'Inclinação 10% · vel 5.5 km/h · zona 3'),
      ex('d6-4', 'Elíptico (ritmo constante)', 1, '15min', '-', 'Resistência moderada · frequência cardíaca 130-150 bpm'),
      ex('d6-5', 'Desaquecimento — Caminhada', 1, '5min', '-', 'Vel 4 km/h · retorno gradual'),
    ],
  },
]

export function seedTreino() {
  savePlanos(PPL_PLANOS)
  return PPL_PLANOS
}
