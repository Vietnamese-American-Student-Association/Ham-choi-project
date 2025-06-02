import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BottomNavBar from '../components/bottomNavBar';

interface Team {
  id: number;
  color: string;
  officer_counter: number;
}

const OfficerChallenge: React.FC = () => {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [officerName, setOfficerName] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('officerName');
    if (!name) { router.push('/login'); return; }
    setOfficerName(name);

    const fetchTeams = async () => {
      const res = await fetch('/api/teams');
      setTeams(await res.json());
      setLoading(false);
    };
    fetchTeams();
  }, []);

  /* call RPC endpoints */
  const updateStatus = async (color: string, action: 'increment' | 'decrement') => {
    await fetch(`/api/${action}OfficerCounter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamColor: color }),
    });
    const res = await fetch('/api/teams');
    setTeams(await res.json());
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{officerName}&apos;s Challenge</h1>
        <p style={styles.subtitle}>Mark each team&apos;s challenge status</p>
      </div>

      {loading ? (
        <p style={styles.loading}>Loading teams...</p>
      ) : (
        <div style={styles.card}>
          {teams.map((team) => (
            <div key={team.id} style={styles.teamRow}>
              <span style={styles.teamName}>{team.color}</span>
              <div style={styles.buttonGroup}>
                <button
                  style={{ ...styles.button, backgroundColor: '#81c784' }}
                  onClick={() => updateStatus(team.color, 'increment')}
                >
                  Complete
                </button>
                <button
                  style={{ ...styles.button, backgroundColor: '#e57373' }}
                  onClick={() => updateStatus(team.color, 'decrement')}
                >
                  Incomplete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNavBar
        onTabChange={(tab) => {
          if (tab === 'leaderboard') router.push('/leaderboard');
          else if (tab === 'game') router.push('/game');
          else if (tab === 'log') router.push('/log');
        }}
        initialTab="officer"
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: { backgroundColor: '#fff8f0', minHeight: '100vh', padding: 20, fontFamily: '"Segoe UI",Tahoma' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 26, color: '#b71c1c', fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#444' },
  loading: { textAlign: 'center', marginTop: 40, fontSize: 18, color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 20, maxWidth: 500, margin: '0 auto' },
  teamRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' },
  teamName: { fontWeight: 'bold', fontSize: 16, flex: 1, color: '#333' },
  status: { fontSize: 14, color: '#555', minWidth: 100, textAlign: 'center' },
  buttonGroup: { display: 'flex', gap: 8 },
  button: { padding: '6px 12px', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' },
};

export default OfficerChallenge;