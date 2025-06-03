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
  const [completedTeams, setCompletedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [officerName, setOfficerName] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('officerName');
    if (!name) { router.push('/login'); return; }
    setOfficerName(name);

    const fetchData = async () => {
      const [teamsRes, completedRes] = await Promise.all([
        fetch('/api/teams'),
        fetch(`/api/officerCompletedTeams?officerName=${name}`)
      ]);
      setTeams(await teamsRes.json());
      setCompletedTeams(await completedRes.json());
      setLoading(false);
    };
    fetchData();
  }, []);

  const updateStatus = async (color: string, action: 'increment' | 'decrement') => {
    const endpoint = action === 'increment' ? '/api/markTeamComplete' : '/api/unmarkTeamComplete';
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamColor: color, officerName }),
    });

    const [teamsRes, completedRes] = await Promise.all([
      fetch('/api/teams'),
      fetch(`/api/officerCompletedTeams?officerName=${officerName}`)
    ]);
    setTeams(await teamsRes.json());
    setCompletedTeams(await completedRes.json());
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{officerName}&apos;s Challenge</h1>
        <p style={styles.subtitle}>Mark each team&apos;s challenge status</p>
      </div>

      {!loading && (
        <div style={styles.progressWrapper}>
          <div style={styles.progressText}>
            Completed: {completedTeams.length} / {teams.length}
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${(completedTeams.length / teams.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <p style={styles.loading}>Loading teams...</p>
      ) : (
        <div style={styles.card}>
          {teams.map((team) => {
            const isCompleted = completedTeams.includes(team.color);
            return (
              <div
                key={team.id}
                style={{
                  ...styles.teamRow,
                  backgroundColor: isCompleted ? '#e8f5e9' : '#fff',
                }}
              >
                <span style={{ ...styles.teamName, opacity: isCompleted ? 1 : 0.6 }}>
                  {team.color} {isCompleted && <span style={styles.checkmark}>✅</span>}
                </span>
                <div style={styles.buttonGroup}>
                  <button
                    style={{ ...styles.button, backgroundColor: '#81c784' }}
                    onClick={() => updateStatus(team.color, 'increment')}
                    disabled={isCompleted}
                  >
                    Complete
                  </button>
                  <button
                    style={{ ...styles.button, backgroundColor: '#e57373' }}
                    onClick={() => updateStatus(team.color, 'decrement')}
                    disabled={!isCompleted}
                  >
                    Incomplete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNavBar
        onTabChange={(tab) => {
          if (tab === 'leaderboard') router.push('/leaderboard');
          else if (tab === 'game') router.push('/games');
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
  teamRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 12px',
    borderBottom: '1px solid #eee',
    borderRadius: 8,
  },
  teamName: { fontWeight: 'bold', fontSize: 16, flex: 1, color: '#333' },
  buttonGroup: { display: 'flex', gap: 8 },
  button: { padding: '6px 12px', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' },
  checkmark: { marginLeft: 6, fontSize: 16 },
  progressWrapper: {
    marginBottom: 16,
    textAlign: 'center',
  },
  progressText: {
    marginBottom: 6,
    fontSize: 14,
    color: '#444',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    maxWidth: 300,
    margin: '0 auto',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#66bb6a',
    transition: 'width 0.3s ease',
  },
};

export default OfficerChallenge;