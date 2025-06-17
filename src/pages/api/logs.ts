import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseClient';

/**
 * GET  → newest 100 log rows
 * POST → create a new log row
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return res.status(500).json({ error });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { officer, action, ...payload } = req.body || {};
    if (!officer || !action)
      return res.status(400).json({ message: 'Missing officer/action' });

    const { error } = await supabase.from('logs').insert({
      officer,
      action,
      payload,
    });
    if (error) return res.status(500).json({ error });
    return res.status(201).end();
  }

  return res.status(405).end();
}