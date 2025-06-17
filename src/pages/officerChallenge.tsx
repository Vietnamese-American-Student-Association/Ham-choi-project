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
  const [loadingAction, setLoadingAction] = useState(false);
  const [processingTeams, setProcessingTeams] = useState<Set<string>>(new Set());
  const [officerName, setOfficerName] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('officerName');
    if (!name) {
      router.push('/login');
      return;
    }
    setOfficerName(name);

    const fetchData = async () => {
      const [teamsRes, completedRes] = await Promise.all([
        fetch('/api/teams'),
        fetch(`/api/officerCompletedTeams?officerName=${name}`),
      ]);
      setTeams(await teamsRes.json());
      setCompletedTeams(await completedRes.json());
      setLoading(false);
    };

    fetchData();
  }, []);

  const updateStatus = async (color: string, action: 'increment' | 'decrement') => {
    // Prevent multiple simultaneous requests for the same team
    if (loadingAction || processingTeams.has(color)) return;
    
    setLoadingAction(true);
    setProcessingTeams(prev => new Set(prev).add(color));

    const endpoint = action === 'increment' ? '/api/markTeamComplete' : '/api/unmarkTeamComplete';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamColor: color, officerName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        throw new Error(errorData.message || 'Update failed');
      }

      // Record activity in the logs table
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer: officerName,
          action,
          teamColor: color
        })
      });
      // Refresh data after successful update
      const [teamsRes, completedRes] = await Promise.all([
        fetch('/api/teams'),
        fetch(`/api/officerCompletedTeams?officerName=${officerName}`),
      ]);
      
      if (teamsRes.ok && completedRes.ok) {
        setTeams(await teamsRes.json());
        setCompletedTeams(await completedRes.json());
      }
    } catch (error) {
      console.error('Update failed:', error);
      // You might want to show a toast notification here
    } finally {
      setLoadingAction(false);
      setProcessingTeams(prev => {
        const newSet = new Set(prev);
        newSet.delete(color);
        return newSet;
      });
    }
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
            const isProcessing = processingTeams.has(team.color);
            
            return (
              <div
                key={team.id}
                style={{
                  ...styles.teamRow,
                  backgroundColor: isCompleted ? '#e8f5e9' : '#fff',
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                <span style={{ ...styles.teamName, opacity: isCompleted ? 1 : 0.6 }}>
                  {team.color} {isCompleted && <span style={styles.checkmark}>✅</span>}
                  {isProcessing && <span style={styles.processing}>⏳</span>}
                </span>
                <div style={styles.buttonGroup}>
                  <button
                    style={{ 
                      ...styles.button, 
                      backgroundColor: isCompleted || isProcessing ? '#ccc' : '#81c784',
                      cursor: isCompleted || isProcessing || loadingAction ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => updateStatus(team.color, 'increment')}
                    disabled={isCompleted || loadingAction || isProcessing}
                  >
                    {isProcessing && !isCompleted ? 'Processing...' : 'Complete'}
                  </button>
                  <button
                    style={{ 
                      ...styles.button, 
                      backgroundColor: !isCompleted || isProcessing ? '#ccc' : '#e57373',
                      cursor: !isCompleted || isProcessing || loadingAction ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => updateStatus(team.color, 'decrement')}
                    disabled={!isCompleted || loadingAction || isProcessing}
                  >
                    {isProcessing && isCompleted ? 'Processing...' : 'Incomplete'}
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
  page: { backgroundColor: '#fff8f0', minHeight: '100vh', padding: 20, fontFamily: '"Segoe UI", Tahoma' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 26, color: '#b71c1c', fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#444' },
  loading: { textAlign: 'center', marginTop: 40, fontSize: 18, color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 20, maxWidth: 500, margin: '0 auto' },
  teamRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px', borderBottom: '1px solid #eee', borderRadius: 8, transition: 'opacity 0.2s ease' },
  teamName: { fontWeight: 'bold', fontSize: 16, flex: 1, color: '#333' },
  buttonGroup: { display: 'flex', gap: 8 },
  button: { padding: '6px 12px', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s ease' },
  checkmark: { marginLeft: 6, fontSize: 16 },
  processing: { marginLeft: 6, fontSize: 16 },
  progressWrapper: { marginBottom: 16, textAlign: 'center' },
  progressText: { marginBottom: 6, fontSize: 14, color: '#444' },
  progressBar: { height: 10, backgroundColor: '#eee', borderRadius: 5, overflow: 'hidden', maxWidth: 300, margin: '0 auto' },
  progressFill: { height: '100%', backgroundColor: '#66bb6a', transition: 'width 0.3s ease' },
};

export default OfficerChallenge;