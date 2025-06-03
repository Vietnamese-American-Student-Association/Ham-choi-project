import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BottomNavBar from '../components/bottomNavBar';

interface TeamBtn { id: number; name: string }
interface Round   { index:number; teams:[TeamBtn,TeamBtn]; winnerId:number|null }
interface GameRow { id:number; name:string; rounds:Round[] }

/* map DB label → CSS color */
const cssColor = (label:string):string => {
  const m:Record<string,string> = {
    Red:'#ef5350',Blue:'#42a5f5',Green:'#66bb6a',Yellow:'#ffeb3b',Purple:'#ab47bc',Orange:'#ffa726',Pink:'#ec407a',Cyan:'#26c6da',
  }; return m[label] ?? label.toLowerCase();
};

const GamesPage:React.FC = () => {
  const router = useRouter();
  const [games,setGames]     = useState<GameRow[]>([]);
  const [loading,setLoading] = useState(true);
  const [half,setHalf]       = useState<'first'|'second'>('first');
  const [officer,setOfficer] = useState('');
  const [winner,setWinner]   = useState<Record<string,number>>({});
  const [isMobile,setIsMobile]=useState(false);

  /* handle viewport -------------------------------------------------- */
  useEffect(()=>{
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize',check);
    return ()=>window.removeEventListener('resize',check);
  },[]);

  /* fetch ------------------------------------------------------------- */
  const loadGames = async (name:string,h:'first'|'second')=>{
    setLoading(true);
    const res = await fetch(`/api/fetchOfficerGames?officerName=${encodeURIComponent(name)}&half=${h}`);
    const data = await res.json() as GameRow[];
    setGames(data);
    const map:Record<string,number>={};
    data.forEach(g=>g.rounds.forEach(r=>{if(r.winnerId) map[`${g.id}-${r.index}`]=r.winnerId;}));
    setWinner(map);
    setLoading(false);
  };

  useEffect(()=>{const n=sessionStorage.getItem('officerName');if(!n){router.push('/login');return;}setOfficer(n);loadGames(n,half);},[]);
  useEffect(()=>{if(officer) loadGames(officer,half);},[half]);

  /* report ------------------------------------------------------------ */
  const report = async (win:TeamBtn,lose:TeamBtn,gId:number,rd:number)=>{
    const res = await fetch('/api/reportGameResult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({winning_team_id:win.id,losing_team_id:lose.id,game_id:gId,round:rd,officer_name:officer})});
    const j=await res.json();
    if(!res.ok){alert(j.error||'Error');return;}
    setWinner(prev=>({...prev,[`${gId}-${rd}`]:win.id}));
  };

  /* styles depend on isMobile --------------------------------------- */
  const s:Record<string,React.CSSProperties>={
    page:{padding:isMobile?12:20,fontFamily:'Segoe UI, sans-serif'},
    title:{fontSize:isMobile?20:24,fontWeight:'bold',marginBottom:12,textAlign:isMobile?'center':'left'},
    toggle:{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap',justifyContent:isMobile?'center':'flex-start'},
    btn:{padding:'8px 16px',borderRadius:30,border:'1px solid #bbb',cursor:'pointer',background:'#fafafa'},
    active:{padding:'8px 16px',borderRadius:30,border:'2px solid #000',fontWeight:'bold',background:'#e0e0e0',cursor:'pointer'},
    card:{background:'#fff',borderRadius:12,padding:isMobile?12:20,boxShadow:'0 4px 12px rgba(0,0,0,.08)'},
    block:{marginBottom:isMobile?24:32},
    gName:{fontSize:isMobile?18:20,fontWeight:'bold',marginBottom:14},
    row:{display:'flex',alignItems:'center',gap:14,flexWrap:'nowrap',overflowX:'auto',marginBottom:14},
    label:{width:isMobile?'auto':90,fontWeight:500},
    tBtn:{flex:'0 0 auto',padding:'10px 14px',borderRadius:8,border:'none',color:'#fff',fontWeight:600,minWidth:100,cursor:'pointer'},
    wBadge:{marginLeft:'auto',whiteSpace:'nowrap',fontWeight:600}
  };

  /* render ----------------------------------------------------------- */
  return(
    <div style={s.page}>
      <h1 style={s.title}>Assigned Games – {half==='first'?'1ˢᵗ':'2ⁿᵈ'} Half</h1>
      <div style={s.toggle}>{(['first','second'] as const).map(h=>(<button key={h} style={half===h?s.active:s.btn} onClick={()=>setHalf(h)}>{h==='first'?'First Half':'Second Half'}</button>))}</div>
      {loading? <p>Loading…</p>: games.length===0? <p>No game assigned.</p>: (
        <div style={s.card}>{games.map(g=>(
          <div key={g.id} style={s.block}>
            <p style={s.gName}>{g.name}</p>
            {g.rounds.map(r=>{
              const key=`${g.id}-${r.index}`;
              const wId=winner[key];
              const wTeam=wId?r.teams.find(t=>t.id===wId)!:null;
              return(
                <div key={r.index} style={s.row}>
                  <span style={s.label}>Round {r.index}</span>
                  {r.teams.map(t=>{
                    const isW=wId===t.id;
                    return(
                      <button key={t.id}
                        disabled={isW}
                        onClick={()=>report(t,r.teams.find(x=>x.id!==t.id)!,g.id,r.index)}
                        style={{...s.tBtn,backgroundColor:cssColor(t.name),opacity:wId&& !isW?0.4:1}}
                      >{t.name}</button>
                    );
                  })}
                  <span style={s.wBadge}>{wTeam?`${wTeam.name} ✅`:'—'}</span>
                </div>
              );
            })}
          </div>
        ))}</div>
      )}
      <BottomNavBar initialTab='game' onTabChange={tab=>{
        if(tab==='game') router.push('/games');
        else if(tab==='log') router.push('/log');
        else if(tab==='officer') router.push('/officerChallenge');
        else if(tab==='leaderboard') router.push('/leaderboard');
      }}/>
    </div>
  );
};

export default GamesPage;
