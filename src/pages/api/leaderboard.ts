import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../utils/supabaseClient';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const {data, error} = await supabase
        .from('teams')
        .select('score, color')
        .order('score', {ascending:false});


    if (error){
        return res.status(500).json({error: error.message});
    }

    return res.status(200).json(data);
    }