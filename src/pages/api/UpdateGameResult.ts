/* Readme: requires .env.local varaibles:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=pk_********
SUPABASE_SERVICE_ROLE_KEY=sk_********
*/
import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseServer from '../../utils/supabaseServer';// server clint

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })

  const { winning_team_id, losing_team_id, game_id } = req.body as {
    winning_team_id: number
    losing_team_id: number
    game_id?: number
  }

  if (!winning_team_id || !losing_team_id) {
    return res.status(400).json({ error: 'missing team IDs' })
  }

  //add 2 points to winning and add 1 point to losing
  const [{ error: winErr }, { error: loseErr }] = await Promise.all([
    supabaseServer.rpc('add_points', { p_team_id: winning_team_id, p_points: 2 }),
    supabaseServer.rpc('add_points', { p_team_id: losing_team_id,  p_points: 1 }),
  ])

  if (winErr || loseErr) {
    return res.status(400).json({ error: winErr?.message || loseErr?.message })
  }

  //leaderboard call
  //In production assign a env variable for the NEXT_PUBLIC_BASE_URL
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/leaderboard`)
    .catch(console.error)

  return res.status(200).json({ ok: true })
}
