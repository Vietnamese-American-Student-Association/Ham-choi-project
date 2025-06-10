import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseServer';

/**
 * Body: { winning_team_id, losing_team_id, game_id, round, officer_name }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Use POST' });

  /* 0. validate body --------------------------------------------------- */
  const { winning_team_id, losing_team_id, game_id, round, officer_name } = req.body as {
    winning_team_id: number;
    losing_team_id: number;
    game_id: number;
    round: number;
    officer_name: string;
  };

  if (![winning_team_id, losing_team_id, game_id, round].every(n => Number.isFinite(n)) ||
    !officer_name?.trim()) {
    return res.status(400).json({ error: 'Bad or missing fields' });
  }

  const officerName = officer_name.trim();

  /* 1. validate game & round teams ------------------------------------- */
  const { data: game, error: gErr } = await supabase
    .from('games_id')
    .select(`matchup_round_${round}`)
    .eq('id', game_id)
    .maybeSingle();

  if (gErr) return res.status(500).json({ error: gErr.message });
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const validIds = ((game as any)[`matchup_round_${round}`] as number[] | null)?.map(Number);
  if (!validIds || !validIds.includes(winning_team_id) || !validIds.includes(losing_team_id))
    return res.status(400).json({ error: 'Team IDs not valid for this round' });

  /* 2. officer lookup -------------------------------------------------- */
  const { data: officer, error: oErr } = await supabase
    .from('officers')
    .select('id')
    .eq('name', officerName)
    .maybeSingle();

  if (oErr) return res.status(500).json({ error: oErr.message });
  if (!officer) return res.status(404).json({ error: 'Officer not found' });

  /* 3. perform transaction via RPC ------------------------------------- */
  const { error: rpcError } = await supabase.rpc('perform_game_result_tx', {
    p_game_id: game_id,
    p_round: round,
    p_winning_team_id: winning_team_id,
    p_losing_team_id: losing_team_id,
    p_officer_id: officer.id,
  });

  if (rpcError) return res.status(500).json({ error: rpcError.message });

  /* 4. async leaderboard refresh ---------------------------------------- */
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3002'}/api/leaderboard`)
    .catch(console.error);

  res.status(200).json({ ok: true });
}