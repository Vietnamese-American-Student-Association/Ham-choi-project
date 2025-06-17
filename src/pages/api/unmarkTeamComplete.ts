import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { officerName, teamColor } = req.body;
  if (!officerName || !teamColor)
    return res.status(400).json({ message: 'Missing input' });

  // First check if the record exists
  const { data: existingRecord, error: checkError } = await supabase
    .from('officer_team_completions')
    .select('id')
    .eq('officer_name', officerName)
    .eq('team_color', teamColor)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    return res.status(500).json({ message: 'Failed to check existing record', error: checkError });
  }

  // If record doesn't exist, don't do anything
  if (!existingRecord) {
    return res.status(200).json({ success: true, message: 'Already unmarked' });
  }

  // Delete the record only if it exists
  const { error: deleteError } = await supabase
    .from('officer_team_completions')
    .delete()
    .eq('officer_name', officerName)
    .eq('team_color', teamColor);

  if (deleteError)
    return res.status(500).json({ message: 'Failed to unmark', error: deleteError });

  // Only decrement counter if we successfully deleted a record
  const { error: rpcError } = await supabase.rpc('decrement_officer_counter', {
    team_color_input: teamColor,
  });

  if (rpcError)
    return res.status(500).json({ message: 'Failed to update team counter', error: rpcError });

  res.status(200).json({ success: true });
}