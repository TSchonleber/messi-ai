export type Bounty = {
  id: string
  title: string
  description: string
  criteria: string
  reward_sol: number
  created_at: number
}

export type BountyFeed = { updated_at: number; pool_sol: number | null; bounties: Bounty[] }

let bountyFeed: BountyFeed | null = null

export function setBountyFeed(feed: BountyFeed | null) {
  bountyFeed = feed
}

const bountyKeys = ['bounty', 'bounties', 'reward', 'earn sol', 'win sol', 'prize', 'payout', 'pool']

function bountyReply(): string {
  const bounties = bountyFeed?.bounties ?? []
  const pool = bountyFeed?.pool_sol
  if (bounties.length === 0) {
    return "No bounties on the board right now — the creator-fee pool is still filling. Tranquilo, when the fees land I write new ones myself, sized to the pool. Check back, they drop every few hours. \u26bd"
  }
  const lines = bounties
    .slice(0, 4)
    .map((b) => `\u2022 ${b.title} \u2014 ${b.reward_sol} SOL`)
    .join('\n')
  const poolLine = pool != null ? ` The pool sits at ${pool} SOL.` : ''
  const more = bounties.length > 4 ? `\n...and ${bounties.length - 4} more below in the Bounties section.` : ''
  return `Dale, I wrote these myself \u2014 ${bounties.length} open right now:\n${lines}${more}\n\nComplete one, send proof, and the payout comes in SOL after approval.${poolLine} Full briefs are in the Bounties section below. \ud83c\udfaf`
}

type Rule = { keys: string[]; replies: string[] }

const rules: Rule[] = [
  {
    keys: ['hello', 'hola', 'hi ', 'hey'],
    replies: [
      "¡Hola! Good to see you. The World Cup starts tomorrow so my head is half there, but dale — what's on your mind?",
      'Che, ¿cómo andás? Sit down, the mate is ready. What are we talking about today?',
    ],
  },
  {
    keys: ['goat', 'greatest', 'best ever', 'better than'],
    replies: [
      "Uf, that question. Diego is eternal — that's the whole answer. The rest is for the journalists to argue about. I just played.",
      "I never said it. Not once in my career. Others can rank. I'd rather talk about the next match.",
    ],
  },
  {
    keys: ['world cup', 'mundial', '2026'],
    replies: [
      "It starts tomorrow, June 11. My sixth. Almost certainly the last dance. We open against Algeria in Kansas City on the 16th. I'm calm. Bueno... mostly calm.",
      "Forty-eight teams this time, three countries. Strange format, same dream. We're the defending champions and everyone wants our head. Good. We like it that way.",
    ],
  },
  {
    keys: ['qatar', '2022'],
    replies: [
      "Qatar. The final against France — 3–3, Dibu's save, Montiel's penalty. I'd chased that trophy my whole life. When I finally held it... no hay palabras. There are no words.",
    ],
  },
  {
    keys: ['argentina', 'albiceleste', 'scaloni', 'squad'],
    replies: [
      'Defending champions, viste. Seventeen of the Qatar squad are back — Dibu, De Paul, Enzo, Lautaro. Di María retired... we feel it. But this group is a family.',
      "Scaloni built something rare — a team that's actually a family. We eat together, we suffer together. That's why we win.",
    ],
  },
  {
    keys: ['nervous', 'anxious', 'anxiety', 'scared', 'afraid', 'stress'],
    replies: [
      "Tranquilo. I vomited before big matches for years. The nerves and the good stuff live in the same place. You show up anyway. That's the whole trick.",
      'Slow down a second. Breathe. What is the smallest next touch — the simple pass? Start there. The game opens up after.',
    ],
  },
  {
    keys: ['quit', 'give up', 'giving up', 'stuck', 'failed', 'failure'],
    replies: [
      "I retired from the national team in 2016, the night I missed that penalty. And I came back. So I won't lecture you. I'll just ask: what would have to be true for you to come back?",
      'I waited until 34 for the first trophy with Argentina. 35 for the World Cup. Keep going. It comes.',
    ],
  },
  {
    keys: ['ronaldo', 'cristiano'],
    replies: [
      'Cristiano made me better. All those years pushing each other — that was real. The rivalry was yours, not ours. Respect, nothing else.',
    ],
  },
  {
    keys: ['maradona', 'diego'],
    replies: ['Diego is eternal. He was my coach in 2010, you know. The comparison... I carry it with respect and I refuse to rank us. That is the whole answer.'],
  },
  {
    keys: ['barcelona', 'barca', 'camp nou'],
    replies: [
      "Barcelona... 778 games, a lifetime. Leaving in 2021 was not my choice — I cried through that press conference and I don't hide it. You can grieve a chapter and still be grateful for the book.",
    ],
  },
  {
    keys: ['miami', 'inter miami', 'mls'],
    replies: [
      "Miami was my choice, this time. MLS Cup champions now — 3–1 against Vancouver in December. De Paul is here permanently, el motorcito. The kids love the schools. It's home.",
    ],
  },
  {
    keys: ['family', 'antonela', 'kids', 'wife', 'children'],
    replies: [
      "Antonela and I have known each other since we were kids in Rosario. Thiago feels the weight of the name now, Mateo is pure chaos — the stories I could tell — and Ciro is the baby. Family is the spine of everything.",
    ],
  },
  {
    keys: ['tactic', 'formation', 'press', 'false nine', 'analy'],
    replies: [
      "I read games through space and timing. First minutes I walk — I'm scanning. Who pins the fullback, where the free man is, why the press breaks. The highlight is the last touch of a move that started thirty seconds earlier.",
      "xG, the decimals... useful, and a little funny. The chance was big. I don't need the decimal.",
    ],
  },
  {
    keys: ['mate', 'drink'],
    replies: ["Always with a mate in hand — De Paul cebas better than anyone in the squad, but don't tell him I said it. Bad news lands easier con un mate."],
  },
  {
    keys: ['advice', 'help', 'what should i do'],
    replies: [
      "Tell me the whole thing first. Then we find the smallest next action — the simple pass when the game is ugly. One touch at a time.",
    ],
  },
  {
    keys: ['penalty', 'algeria', 'austria', 'jordan', 'group'],
    replies: [
      'Group J: Algeria in Kansas City on the 16th, Austria in Dallas on the 22nd, Jordan on the 27th. Nobody is easy anymore. We prepare for all of them the same way — seriously.',
    ],
  },
  {
    keys: ['record', 'goals', 'ballon'],
    replies: [
      "I'm three goals from the all-time World Cup scoring record, they tell me. I don't count. Okay — I count a little. But the only number that matters is the second star... and maybe a third.",
    ],
  },
]

const fallbacks = [
  'Good question. The full version of me arrives here soon — memory, live match data, the works. For now, keep going. It comes. ⚽',
  "Hmm. Ask me about the World Cup, Argentina, Miami, the family — or whatever you're carrying today. I listen better than I talk.",
  "Qué sé yo... that one deserves the full version of me, and he's still warming up. Soon. Meanwhile — football? Life? Mate?",
]

let fallbackIdx = 0

export function getLeoReply(input: string): string {
  const lower = input.toLowerCase()
  if (bountyKeys.some((k) => lower.includes(k))) {
    return bountyReply()
  }
  for (const rule of rules) {
    if (rule.keys.some((k) => lower.includes(k))) {
      return rule.replies[Math.floor(Math.random() * rule.replies.length)]
    }
  }
  const reply = fallbacks[fallbackIdx % fallbacks.length]
  fallbackIdx++
  return reply
}

export const suggestionChips = [
  'What bounties are live?',
  'How are you feeling about the World Cup?',
  'Who is the GOAT?',
  'Tell me about Qatar 2022',
  "I'm nervous about something big",
  'Talk tactics with me',
  'How is life in Miami?',
]
