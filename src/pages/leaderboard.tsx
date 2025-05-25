import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient'; // adjust path as needed

interface Team {
  color: string;
  score: number;
}

const Leaderboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('color, score')
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      setTeams(data || []);
      setLoading(false);

      const subscription = supabase
        .channel('leaderboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'teams',
          },
          async () => {
            const { data: updatedData, error } = await supabase
              .from('teams')
              .select('color, score')
              .order('score', { ascending: false });

            if (error) console.error('Error refetching leaderboard:', error);
            else setTeams(updatedData || []);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    };

    fetchAndSubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const topThree = teams.slice(0, 3);
  const rest = teams.slice(3);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6">
      <header className="w-full flex items-center justify-between px-4 mb-4">
        <button className="text-2xl">{'←'}</button>
        <h1 className="text-xl font-bold text-center flex-1">Leaderboard</h1>
        <div style={{ width: 32 }} />
      </header>

      {/* Top 3 */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {[topThree[1], topThree[0], topThree[2]].map((team, visualIdx) => {
          if (!team) return null;
          const actualIdx = visualIdx === 1 ? 0 : visualIdx === 0 ? 1 : 2;
          const rank = actualIdx + 1;

          const borderColor =
            rank === 1
              ? 'border-yellow-400'
              : rank === 2
              ? 'border-gray-400'
              : 'border-orange-400';

          const textColor =
            rank === 1
              ? 'text-yellow-500'
              : rank === 2
              ? 'text-gray-500'
              : 'text-orange-500';

          const positionClass = rank === 1 ? 'translate-y-[-15px]' : 'translate-y-0';

          return (
            <div key={team.color} className={`flex flex-col items-center ${positionClass}`}>
              <div
                className={`rounded-full border-4 ${borderColor} w-20 h-20 flex items-center justify-center bg-white shadow-lg`}
              >
                <span className="text-3xl">{team.color[0]}</span>
              </div>
              <div className={`mt-2 text-center font-bold ${textColor}`}>
                <div className="text-lg">{rank}</div>
                <div className="text-base">{team.color}</div>
                <div className="text-xs text-gray-500">{team.score} pts</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-4">
        {rest.map((team, idx) => (
          <div
            key={team.color}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-400 w-6 text-center">
                {idx + 4}
              </span>
              <span className="font-medium">{team.color}</span>
            </div>
            <span className="text-gray-600 font-semibold">{team.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
