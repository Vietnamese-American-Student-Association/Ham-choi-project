import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { officerName, teamColor } = req.body;
  if (!officerName || !teamColor)
    return res.status(400).json({ message: 'Missing input' });

  // First check if the record already exists
  const { data: existingRecord, error: checkError } = await supabase
    .from('officer_team_completions')
    .select('id')
    .eq('officer_name', officerName)
    .eq('team_color', teamColor)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected if record doesn't exist
    return res.status(500).json({ message: 'Failed to check existing record', error: checkError });
  }

  // If record already exists, don't do anything
  if (existingRecord) {
    return res.status(200).json({ success: true, message: 'Already marked complete' });
  }

  // Insert the new record only if it doesn't exist
  const { error: insertError } = await supabase
    .from('officer_team_completions')
    .insert({ officer_name: officerName, team_color: teamColor });

  if (insertError) {
    // Handle unique constraint violation (in case of race condition)
    if (insertError.code === '23505') {
      return res.status(200).json({ success: true, message: 'Already marked complete' });
    }
    return res.status(500).json({ message: 'Failed to mark complete', error: insertError });
  }

  // Only increment counter if we successfully inserted a new record
  const { error: rpcError } = await supabase.rpc('increment_officer_counter', {
    team_color_input: teamColor,
  });

  if (rpcError)
    return res.status(500).json({ message: 'Failed to update team counter', error: rpcError });

  res.status(200).json({ success: true });
}