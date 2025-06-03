import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseServer';

/**
 * Body: { winning_team_id, losing_team_id, game_id, round, officer_name }
 */
export default async function handler(
  req : NextApiRequest,
  res : NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error:'Use POST' });

  /* 0. validate body --------------------------------------------------- */
  const { winning_team_id, losing_team_id, game_id, round, officer_name } = req.body as {
    winning_team_id: number;
    losing_team_id : number;
    game_id        : number;
    round          : number;
    officer_name   : string;
  };

  if (![winning_team_id, losing_team_id, game_id, round].every(n => Number.isFinite(n)) ||
      !officer_name?.trim()) {
    return res.status(400).json({ error:'Bad or missing fields' });
  }
  const officerName = officer_name.trim();

  /* 1. validate game & round teams ------------------------------------- */
  const { data: game, error: gErr } = await supabase
    .from('games_id')
    .select(`matchup_round_${round}`)
    .eq('id', game_id)
    .maybeSingle();

  if (gErr)  return res.status(500).json({ error:gErr.message });
  if (!game) return res.status(404).json({ error:'Game not found' });

  const validIds = ((game as any)[`matchup_round_${round}`] as number[] | null)?.map(Number);
  if (!validIds || !validIds.includes(winning_team_id) || !validIds.includes(losing_team_id))
    return res.status(400).json({ error:'Team IDs not valid for this round' });

  /* 2. officer lookup -------------------------------------------------- */
  const { data: officer, error: oErr } = await supabase
    .from('officers')
    .select('id')
    .eq('name', officerName)
    .maybeSingle();

  if (oErr)   return res.status(500).json({ error:oErr.message });
  if (!officer) return res.status(404).json({ error:'Officer not found' });

  /* 3. existing result? ------------------------------------------------ */
  const { data: existing, error: rErr } = await supabase
    .from('game_results')
    .select('*')
    .eq('game_id', game_id)
    .eq('round', round)
    .maybeSingle();

  if (rErr) return res.status(500).json({ error:rErr.message });

  /* 4. point bookkeeping ---------------------------------------------- */
  if (!existing) {
    /* first record */
    const { error: insErr } = await supabase.from('game_results').insert({
      round, game_id, winning_team_id, losing_team_id, log_officer_id: officer.id,
    });
    const { error: winErr }  = await supabase.rpc('add_points', { p_team_id: winning_team_id, p_points: 2 });
    const { error: loseErr } = await supabase.rpc('add_points', { p_team_id: losing_team_id , p_points: 1 });

    if (insErr || winErr || loseErr)
      return res.status(500).json({ error: insErr?.message || winErr?.message || loseErr?.message });
  } else if (
    existing.winning_team_id !== winning_team_id ||
    existing.losing_team_id  !== losing_team_id
  ) {
    /* change of mind – roll back then apply */
    const { error: undoWin } = await supabase.rpc('add_points', { p_team_id: existing.winning_team_id, p_points:-2 });
    const { error: undoLose } = await supabase.rpc('add_points', { p_team_id: existing.losing_team_id , p_points:-1 });
    if (undoWin || undoLose)
      return res.status(500).json({ error: undoWin?.message || undoLose?.message });

    const { error: newWin }  = await supabase.rpc('add_points', { p_team_id: winning_team_id, p_points: 2 });
    const { error: newLose } = await supabase.rpc('add_points', { p_team_id: losing_team_id , p_points: 1 });
    if (newWin || newLose)
      return res.status(500).json({ error: newWin?.message || newLose?.message });

    const { error: updErr } = await supabase
      .from('game_results')
      .update({ winning_team_id, losing_team_id, log_officer_id: officer.id })
      .eq('id', existing.id);
    if (updErr) return res.status(500).json({ error: updErr.message });
  } else {
    /* nothing changed */
    return res.status(200).json({ ok:true, message:'No change' });
  }

  /* 5. async leaderboard refresh -------------------------------------- */
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3002'}/api/leaderboard`)
    .catch(console.error);

  res.status(200).json({ ok:true });
}