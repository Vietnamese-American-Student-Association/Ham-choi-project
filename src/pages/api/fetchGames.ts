/* Readme: requires .env.local varaibles:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=pk_********
SUPABASE_SERVICE_ROLE_KEY=sk_********
*/

//Use: /api/fetchGames?half=${half} <- type 'first' or 'second'
import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseServer from '../../utils/supabaseServer'

interface TeamBtn { id: number; name: string }
interface GameRow {
  id: number
  name: string
  buttons: [TeamBtn, TeamBtn]
}

// Returns GameRow[] array, an array of games each game contains two buttons
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameRow[] | { error: string }>
) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' })

  const halfParam = (req.query.half as string | undefined)?.toLowerCase()
  const half = halfParam === 'second' ? 2 : 1   // default to first half

  //get the games for the specified half
  const { data: games, error: gameErr } = await supabaseServer
    .from('games_id')
    .select('id, name, matchup_round_1')    // we only need round-1 matchups
    .eq('half', half)
    .order('id')

  if (gameErr) return res.status(500).json({ error: gameErr.message })
  if (!games?.length) return res.status(200).json([])

  //get the team IDs
  const teamIdSet = new Set<number>()
  games.forEach(g =>
    (g.matchup_round_1 as number[]).forEach((id: number) => teamIdSet.add(id))
  )

  //get team colors
  const { data: teams, error: teamErr } = await supabaseServer
    .from('teams')
    .select('id, color')
    .in('id', Array.from(teamIdSet))

  if (teamErr) return res.status(500).json({ error: teamErr.message })

  const nameById = Object.fromEntries(teams!.map(t => [t.id, t.color]))

  //build return
  const response: GameRow[] = games.map(g => {
    const [t1, t2] = g.matchup_round_1 as number[]
    return {
      id: g.id,
      name: g.name,
      buttons: [
        { id: t1, name: nameById[t1] },
        { id: t2, name: nameById[t2] }
      ]
    }
  })

  res.status(200).json(response)
}
