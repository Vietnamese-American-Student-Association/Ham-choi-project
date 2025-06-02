import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { officerName, teamColor } = req.body;
  if (!officerName || !teamColor) return res.status(400).json({ message: 'Missing input' });

  const { error } = await supabase
    .from('officer_team_completions')
    .upsert({ officer_name: officerName, team_color: teamColor });

  if (error) return res.status(500).json({ message: 'Failed to mark complete', error });

  await supabase.rpc('increment_officer_counter', { team_color_input: teamColor });

  res.status(200).json({ success: true });
}