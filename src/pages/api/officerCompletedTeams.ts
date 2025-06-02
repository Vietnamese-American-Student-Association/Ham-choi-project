import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { officerName } = req.query;

  if (!officerName || typeof officerName !== 'string')
    return res.status(400).json({ message: 'officerName required' });

  const { data, error } = await supabase
    .from('officer_team_completions')
    .select('team_color')
    .eq('officer_name', officerName);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json(data.map(entry => entry.team_color));
}