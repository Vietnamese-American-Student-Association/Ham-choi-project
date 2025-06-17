import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BottomNavBar from '../components/bottomNavBar';

interface Log {
  id: string;
  created_at: string;
  officer: string;
  action: string;
  payload: Record<string, unknown> | null;
}

export default function LogPage() {
  const router = useRouter();
  const [logs, setLogs]     = useState<Log[]>([]);
  const [loading,setLoading]= useState(true);

  const fetchLogs = async () => {
    const res = await fetch('/api/logs');
    if (res.ok) setLogs(await res.json());
    setLoading(false);
  };

  useEffect(()=>{
    fetchLogs();
    const i = setInterval(fetchLogs, 5000);
    return ()=>clearInterval(i);
  },[]);

  return (
    <div style={{ backgroundColor:'#fff8f0',width:'100%',minHeight:'100vh' }}>
      <main style={{ maxWidth:700,margin:'2rem auto',fontFamily:'sans-serif',padding:20,backgroundColor:'#fff8f0' }}>
        <h1>Officer Activity Log</h1>
        <Link href="/">← Home</Link>

        {loading && <p>Loading…</p>}
        {!loading && logs.length===0 && <p>No activity yet.</p>}

        <ul style={{ listStyle:'none',padding:0 }}>
          {logs.map(({ id, created_at, officer, action, payload }) => (
            <li
              key={id}
              style={{
                margin:'0.75rem 0',
                padding:'0.75rem',
                border:'1px solid #ddd',
                borderRadius:6,
                backgroundColor:'#fdfdfd',
                boxShadow:'0 2px 6px rgba(0,0,0,.05)'
              }}
            >
              <strong>{officer}</strong>{' '}
              • <span style={{
                  color: action==='increment'
                    ? '#388e3c'
                    : action==='decrement'
                    ? '#c62828'
                    : '#1565c0'
                }}>
                <em>{action}</em>
              </span>{' '}

              {payload && typeof payload==='object' && 'teamColor' in payload && (
                <>team <b>{String((payload as {teamColor:unknown}).teamColor)}</b>{' '}</>
              )}

              {payload && typeof payload==='object' && 'winningTeam' in payload && (
                <>
                  round <b>{String((payload as {round:unknown}).round)}</b>{' '}
                  game <b>{String((payload as {gameName:unknown}).gameName)}</b>{' '}
                  winner <b>{String((payload as {winningTeam:unknown}).winningTeam)}</b>{' '}
                </>
              )}

              <span style={{ color:'#666' }}>
                — {new Date(created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>

        <BottomNavBar
          initialTab='log'
          onTabChange={tab=>{
            if(tab==='leaderboard') router.push('/leaderboard');
            else if(tab==='game')   router.push('/games');
            else if(tab==='officer')router.push('/officerChallenge');
          }}
        />
      </main>
    </div>
  );
}