import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseServer';

interface TeamBtn { id: number; name: string }
interface Round   { index: number; teams: [TeamBtn, TeamBtn]; winnerId: number | null }
interface GameRow { id: number; name: string; rounds: Round[] }

export default async function handler(
  req : NextApiRequest,
  res : NextApiResponse<GameRow[] | { error: string }>
) {
  if (req.method !== 'GET') return res.status(405).json({ error:'Use GET' });

  const officerName = req.query.officerName as string | undefined;
  const halfParam   = (req.query.half as string | undefined)?.toLowerCase();
  const halfNum     = halfParam === 'second' ? 2 : 1;
  const halfCol     = halfNum === 2 ? 'second_half_game_id' : 'first_half_game_id';

  if (!officerName) return res.status(400).json({ error:'officerName required' });

  /* 1. officer → gameId */
  const { data: officer, error: oErr } = await supabase
    .from('officers')
    .select(`id, ${halfCol}`)
    .eq('name', officerName)
    .maybeSingle();
  if (oErr)     return res.status(500).json({ error:oErr.message });
  if (!officer) return res.status(404).json({ error:'Officer not found' });

  const gameId = (officer as any)[halfCol] as number | null;
  if (!gameId) return res.status(200).json([]);   // officer unassigned

  /* 2. game & match-ups */
  const { data: game, error: gErr } = await supabase
    .from('games_id')
    .select(`
      id, name,
      matchup_round_1, matchup_round_2, matchup_round_3,
      matchup_round_4, matchup_round_5
    `)
    .eq('id', gameId)
    .maybeSingle();
  if (gErr)  return res.status(500).json({ error:gErr.message });
  if (!game) return res.status(404).json({ error:'Game not found' });

  /* 3. existing results for that game */
  const { data: results, error: rErr } = await supabase
    .from('game_results')
    .select('round, winning_team_id')
    .eq('game_id', gameId);
  if (rErr) return res.status(500).json({ error:rErr.message });

  const winnerByRound: Record<number, number> = {};
  results.forEach(r => (winnerByRound[r.round as number] = r.winning_team_id));

  /* 4. build rounds array */
  const roundCols = [
    'matchup_round_1','matchup_round_2','matchup_round_3',
    'matchup_round_4','matchup_round_5',
  ] as const;

  const allTeamIds = new Set<number>();
  const roundsRaw = roundCols
    .map((col,i) => {
      const pair = (game as any)[col] as number[] | null;
      return pair ? { index:i+1, ids:pair } : null;
    })
    .filter(Boolean) as { index:number; ids:number[] }[];

  roundsRaw.forEach(r => r.ids.forEach(id => allTeamIds.add(id)));

  /* 5. team colours */
  const { data: teams, error: tErr } = await supabase
    .from('teams')
    .select('id, color')
    .in('id', Array.from(allTeamIds));
  if (tErr) return res.status(500).json({ error:tErr.message });

  const nameById: Record<number,string> = {};
  teams!.forEach(t => (nameById[t.id] = t.color));

  /* 6. response */
  const response: GameRow[] = [{
    id   : game.id,
    name : game.name,
    rounds: roundsRaw.map(r => ({
      index   : r.index,
      teams   : [
        { id:r.ids[0], name:nameById[r.ids[0]] },
        { id:r.ids[1], name:nameById[r.ids[1]] },
      ],
      winnerId: winnerByRound[r.index] ?? null,
    })),
  }];

  res.status(200).json(response);
}