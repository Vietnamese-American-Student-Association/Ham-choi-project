'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../utils/supabaseClient';
import BottomNavBar from '../components/bottomNavBar';

interface Team {
  color: string;
  points: number;
}

const Leaderboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [officerName, setOfficerName] = useState('');
  const router = useRouter();

  /* ─────────── Fetch + realtime subscription ─────────── */
  useEffect(() => {
    const name = sessionStorage.getItem('officerName');
    if (!name) {
      router.push('/login');
      return;
    }
    setOfficerName(name);

    const init = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('color, points')
        .order('points', { ascending: false });

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching leaderboard:', error);
        return;
      }

      setTeams(data || []);
      setLoading(false);

      // live updates
      const channel = supabase
        .channel('leaderboard-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'teams' },
          async () => {
            const { data: newData, error: refetchErr } = await supabase
              .from('teams')
              .select('color, points')
              .order('points', { ascending: false });

            if (refetchErr) {
              // eslint-disable-next-line no-console
              console.error('Error refetching leaderboard:', refetchErr);
            } else {
              setTeams(newData || []);
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        Loading…
      </div>
    );
  }

  const topThree = teams.slice(0, 3);
  const rest = teams.slice(3);

  /* ─────────── helpers ─────────── */
  const medalColor = (rank: number) => {
    if (rank === 1) return 'border-yellow-400 text-yellow-500';
    if (rank === 2) return 'border-gray-400 text-gray-400';
    return 'border-orange-500 text-orange-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-5">
      <header className="mb-8 text-center">
        <p className="text-sm text-gray-600">Welcome, {officerName}</p>
        <h1 className="mt-1 text-3xl font-bold text-red-800">Leaderboard</h1>
      </header>

      {/* 🏆 Top-3 podium */}
      <div className="mb-9 flex justify-center gap-8">
        {[topThree[1], topThree[0], topThree[2]].map((team, visual) => {
          if (!team) return null;
          const trueIdx = visual === 1 ? 0 : visual === 0 ? 1 : 2;
          const rank = trueIdx + 1;
          const yOffset = rank === 1 ? -20 : 0;
          return (
            <motion.div
              key={team.color}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: yOffset }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="flex flex-col items-center"
            >
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full border-4 bg-white shadow-lg ${medalColor(
                  rank,
                )}`}
              >
                <span className="text-2xl font-semibold">{team.color[0]}</span>
              </div>
              <div className="mt-2 text-center font-semibold leading-tight">
                <div className="text-lg">{rank}</div>
                <div>{team.color}</div>
                <div className="text-xs text-gray-500">{team.points} pts</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 📋 Rest of leaderboard */}
      <motion.div
        layout
        className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow-lg"
      >
        <AnimatePresence>
          {rest.map((team, idx) => (
            <motion.div
              key={team.color}
              layout
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between border-b py-3 last:border-none"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center font-bold text-gray-500">
                  {idx + 4}
                </span>
                <span>{team.color}</span>
              </div>
              <span className="font-semibold text-gray-600">
                {team.points} pts
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <BottomNavBar
        initialTab="leaderboard"
        onTabChange={(tab) => {
          if (tab === 'game') router.push('/games');
          else if (tab === 'log') router.push('/log');
          else if (tab === 'officer') router.push('/officerChallenge');
        }}
      />
    </div>
  );
};

export default Leaderboard;