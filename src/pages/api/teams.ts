import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { data, error } = await supabase
    .from('teams')
    .select('id, color, officer_counter')
    .order('color');

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
}