import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';
import BottomNavBar from '../components/bottomNavBar';
import { useRouter } from 'next/router';

interface Team {
  color: string;
  score: number;
}

const Leaderboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [officerName, setOfficerName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const name = sessionStorage.getItem('officerName');
    if (!name) {
      router.push('/login');
      return;
    }
    setOfficerName(name);

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
      <div style={styles.centered}>
        <p>Loading...</p>
      </div>
    );
  }

  const topThree = teams.slice(0, 3);
  const rest = teams.slice(3);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.welcome}>Welcome, {officerName}</span>
        <h1 style={styles.title}>Leaderboard</h1>
      </header>

      {/* Top 3 */}
      <div style={styles.topThreeWrapper}>
        {[topThree[1], topThree[0], topThree[2]].map((team, visualIdx) => {
          if (!team) return null;
          const actualIdx = visualIdx === 1 ? 0 : visualIdx === 0 ? 1 : 2;
          const rank = actualIdx + 1;

          const borderColor =
            rank === 1 ? '#fdd835' : rank === 2 ? '#bdbdbd' : '#fb8c00';
          const textColor =
            rank === 1 ? '#fbc02d' : rank === 2 ? '#9e9e9e' : '#f57c00';
          const translateY = rank === 1 ? '-15px' : '0px';

          return (
            <div
              key={team.color}
              style={{
                ...styles.podiumItem,
                transform: `translateY(${translateY})`,
              }}
            >
              <div
                style={{
                  ...styles.avatar,
                  borderColor: borderColor,
                }}
              >
                <span style={{ fontSize: 24 }}>{team.color[0]}</span>
              </div>
              <div style={{ ...styles.rankInfo, color: textColor }}>
                <div>{rank}</div>
                <div>{team.color}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{team.score} pts</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <div style={styles.card}>
        {rest.map((team, idx) => (
          <div
            key={team.color}
            style={styles.row}
          >
            <div style={styles.rowLeft}>
              <span style={styles.rank}>{idx + 4}</span>
              <span>{team.color}</span>
            </div>
            <span style={styles.points}>{team.score} pts</span>
          </div>
        ))}
      </div>

      <BottomNavBar
        onTabChange={(tab) => {
          if (tab === 'game') router.push('/games');
          else if (tab === 'log') router.push('/log');
          else if (tab === 'officer') router.push('/officerChallenge');
          else if (tab === 'leaderboard') router.push('/leaderboard');
        }}
        initialTab="leaderboard"
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    backgroundColor: '#fff8f0',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  welcome: {
    fontSize: 14,
    color: '#555',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#b71c1c',
    marginTop: 4,
  },
  centered: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topThreeWrapper: {
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  podiumItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'transform 0.3s ease',
  },
  avatar: {
    backgroundColor: '#fff',
    width: 64,
    height: 64,
    borderRadius: '50%',
    border: '4px solid',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  rankInfo: {
    marginTop: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    padding: '20px',
    maxWidth: 500,
    margin: '0 auto',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
  },
  rowLeft: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  rank: {
    fontWeight: 'bold',
    color: '#999',
    width: 20,
    textAlign: 'center',
  },
  points: {
    fontWeight: 600,
    color: '#555',
  },
};

export default Leaderboard;