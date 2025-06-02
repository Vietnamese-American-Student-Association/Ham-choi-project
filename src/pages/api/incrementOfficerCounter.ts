import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { teamColor } = req.body;       // expects “Red”, “Blue”, etc.
  if (!teamColor || typeof teamColor !== 'string')
    return res.status(400).json({ message: 'teamColor (string) required' });

  const { error } = await supabase.rpc('increment_officer_counter', {
    team_color_input: teamColor,
  });

  if (error) {
    console.error(error);
    return res.status(500).json({ message: 'Increment RPC failed' });
  }

  res.status(200).json({ success: true });
}