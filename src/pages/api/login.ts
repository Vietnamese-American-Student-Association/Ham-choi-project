import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ message: 'Username is required' });
  }

  const { data, error } = await supabase
    .from('officers')
    .select('name')
    .eq('username', username)
    .single();

  if (error || !data) {
    return res.status(401).json({ message: 'Invalid username' });
  }

  return res.status(200).json({ name: data.name });
}